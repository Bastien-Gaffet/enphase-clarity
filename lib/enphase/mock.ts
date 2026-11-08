import type { EnergyInterval, TariffConfig } from "../calculations/types";
import { isHeureCreuse } from "../calculations/tariff";
import type { DailyRollup } from "./history";

export interface MockSiteConfig {
  /** Installed peak power, kWc. */
  panelKwp: number;
  /** Average baseline household draw, kW. */
  baseLoadKw: number;
  /** Extra draw added during morning/evening peaks, kW. */
  peakLoadKw: number;
}

export const defaultMockSite: MockSiteConfig = {
  panelKwp: 6,
  baseLoadKw: 0.4,
  peakLoadKw: 1.8,
};

function seededNoise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / 86400000);
}

/**
 * Seasonal output, peaking at the June solstice and bottoming near 35 % of
 * that in deep winter. Without it every month of history looked identical,
 * which makes a yearly chart meaningless.
 */
function seasonalFactor(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0).getTime();
  const doy = Math.floor((date.getTime() - startOfYear) / 86400000);
  const phase = ((doy - 172) / 365) * 2 * Math.PI;
  return 0.675 + 0.325 * Math.cos(phase);
}

/** Cloud cover for the day: a stable per-day multiplier between 0.5 and 1. */
function weatherFactor(date: Date): number {
  return 0.5 + 0.5 * seededNoise(dayNumber(date) * 7.13);
}

/** How much of the panels' rating is actually available on a given day. */
export function dailyYieldFactor(date: Date): number {
  return seasonalFactor(date) * weatherFactor(date);
}

/** Bell-shaped output around solar noon, zero before sunrise / after sunset. */
function productionAt(hourFraction: number, kwp: number, daylight = 1): number {
  // Shorter days in winter, not merely weaker ones.
  const half = 7 * (0.6 + 0.4 * daylight);
  const sunrise = 13.5 - half;
  const sunset = 13.5 + half;
  if (hourFraction < sunrise || hourFraction > sunset) return 0;
  const solarNoon = (sunrise + sunset) / 2;
  const spread = (sunset - sunrise) / 2;
  const x = (hourFraction - solarNoon) / spread;
  const bell = Math.exp(-3.2 * x * x);
  return kwp * bell;
}

function consumptionAt(hourFraction: number, cfg: MockSiteConfig, dayOffset: number): number {
  const morning = Math.exp(-Math.pow((hourFraction - 7.5) / 1.1, 2));
  const evening = Math.exp(-Math.pow((hourFraction - 20) / 1.4, 2));
  const noise = 0.15 * seededNoise(hourFraction * 97 + dayOffset * 13.37);
  return cfg.baseLoadKw + cfg.peakLoadKw * Math.max(morning, evening) + noise;
}

/** Generates 15-min-resolution intervals for one calendar day. */
export function generateMockDay(date: Date, cfg: MockSiteConfig = defaultMockSite): EnergyInterval[] {
  const intervals: EnergyInterval[] = [];
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayOffset = Math.floor(dayStart.getTime() / 86400000);
  const now = new Date();
  const isToday = dayStart.toDateString() === now.toDateString();
  const stepsPerDay = 96; // 15-min steps
  const yieldFactor = dailyYieldFactor(dayStart);
  const daylight = seasonalFactor(dayStart);

  for (let i = 0; i < stepsPerDay; i++) {
    const hourFraction = i / 4;
    const timestamp = new Date(dayStart.getTime() + i * 15 * 60000);
    if (isToday && timestamp > now) break;

    const productionKw = productionAt(hourFraction, cfg.panelKwp, daylight) * yieldFactor;
    const consumptionKw = consumptionAt(hourFraction, cfg, dayOffset);
    const durationHours = 0.25;
    const productionKwh = productionKw * durationHours;
    const consumptionKwh = consumptionKw * durationHours;
    const gridImportKwh = Math.max(0, consumptionKwh - productionKwh);
    const gridExportKwh = Math.max(0, productionKwh - consumptionKwh);

    intervals.push({
      timestamp: timestamp.toISOString(),
      durationHours,
      productionKwh,
      consumptionKwh,
      gridImportKwh,
      gridExportKwh,
    });
  }

  return intervals;
}

export interface LiveSnapshot {
  productionKw: number;
  consumptionKw: number;
  gridKw: number; // positive = importing, negative = exporting
  isAutonomous: boolean;
  timestamp: string;
}

/** Instantaneous power reading for the live dashboard, mock mode. */
export function generateMockSnapshot(cfg: MockSiteConfig = defaultMockSite, at: Date = new Date()): LiveSnapshot {
  const hourFraction = at.getHours() + at.getMinutes() / 60;
  const jitter = 1 + 0.06 * (seededNoise(at.getMinutes() + at.getSeconds() / 60) - 0.5);
  // Same season and weather as the day curve and the rollups — without this
  // the live reading contradicts the chart directly beneath it.
  const productionKw =
    productionAt(hourFraction, cfg.panelKwp, seasonalFactor(at)) * dailyYieldFactor(at) * jitter;
  const consumptionKw = consumptionAt(hourFraction, cfg, dayNumber(at)) * jitter;
  const gridKw = consumptionKw - productionKw;

  return {
    productionKw,
    consumptionKw,
    gridKw,
    isAutonomous: gridKw <= 0,
    timestamp: at.toISOString(),
  };
}

/** Forecasted exportable solar surplus per hour (0-23), kWh, for EV-charging simulations. */
export function forecastSolarSurplusByHour(
  cfg: MockSiteConfig = defaultMockSite,
  at: Date = new Date()
): number[] {
  const yieldFactor = dailyYieldFactor(at);
  const daylight = seasonalFactor(at);
  return Array.from({ length: 24 }, (_, hour) => {
    const productionKw = productionAt(hour + 0.5, cfg.panelKwp, daylight) * yieldFactor;
    const consumptionKw = consumptionAt(hour + 0.5, cfg, dayNumber(at));
    return Math.max(0, productionKw - consumptionKw);
  });
}

/**
 * Daily rollups across a date range, for the period statistics in demo mode.
 *
 * Stepped hourly rather than every 15 minutes: a year of 15-minute intervals
 * is 35 000 points to build and throw away on every render, and the daily
 * totals are indistinguishable at this resolution.
 */
export function generateMockRollups(
  from: Date,
  to: Date,
  tariff: TariffConfig,
  cfg: MockSiteConfig = defaultMockSite
): DailyRollup[] {
  const rollups: DailyRollup[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  const now = new Date();

  while (cursor <= end) {
    const dayOffset = Math.floor(cursor.getTime() / 86400000);
    const yieldFactor = dailyYieldFactor(cursor);
    const daylight = seasonalFactor(cursor);
    const isToday = cursor.toDateString() === now.toDateString();
    const lastHour = isToday ? now.getHours() : 23;

    const day: DailyRollup = {
      date: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(
        cursor.getDate()
      ).padStart(2, "0")}`,
      productionKwh: 0,
      consumptionKwh: 0,
      gridImportKwh: 0,
      gridExportKwh: 0,
      heuresPleinesConsumptionKwh: 0,
      heuresCreusesConsumptionKwh: 0,
      heuresPleinesImportKwh: 0,
      heuresCreusesImportKwh: 0,
    };

    for (let hour = 0; hour <= lastHour; hour++) {
      const at = new Date(cursor);
      at.setHours(hour, 30, 0, 0);

      const productionKwh = productionAt(hour + 0.5, cfg.panelKwp, daylight) * yieldFactor;
      const consumptionKwh = consumptionAt(hour + 0.5, cfg, dayOffset);
      const importKwh = Math.max(0, consumptionKwh - productionKwh);
      const exportKwh = Math.max(0, productionKwh - consumptionKwh);
      const hc = isHeureCreuse(at, tariff);

      day.productionKwh += productionKwh;
      day.consumptionKwh += consumptionKwh;
      day.gridImportKwh += importKwh;
      day.gridExportKwh += exportKwh;
      if (hc) {
        day.heuresCreusesConsumptionKwh += consumptionKwh;
        day.heuresCreusesImportKwh += importKwh;
      } else {
        day.heuresPleinesConsumptionKwh += consumptionKwh;
        day.heuresPleinesImportKwh += importKwh;
      }
    }

    rollups.push(day);
    cursor.setDate(cursor.getDate() + 1);
  }

  return rollups;
}
