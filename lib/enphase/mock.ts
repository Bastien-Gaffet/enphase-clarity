import type { EnergyInterval } from "../calculations/types";

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

/** Bell-shaped output around solar noon, zero before sunrise / after sunset. */
function productionAt(hourFraction: number, kwp: number): number {
  const sunrise = 6.5;
  const sunset = 20.5;
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

  for (let i = 0; i < stepsPerDay; i++) {
    const hourFraction = i / 4;
    const timestamp = new Date(dayStart.getTime() + i * 15 * 60000);
    if (isToday && timestamp > now) break;

    const productionKw = productionAt(hourFraction, cfg.panelKwp);
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
  const productionKw = productionAt(hourFraction, cfg.panelKwp) * jitter;
  const consumptionKw = consumptionAt(hourFraction, cfg, 0) * jitter;
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
export function forecastSolarSurplusByHour(cfg: MockSiteConfig = defaultMockSite): number[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const productionKw = productionAt(hour + 0.5, cfg.panelKwp);
    const consumptionKw = consumptionAt(hour + 0.5, cfg, 0);
    return Math.max(0, productionKw - consumptionKw);
  });
}
