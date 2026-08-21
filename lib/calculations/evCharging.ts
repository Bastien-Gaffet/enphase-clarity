import { isHeureCreuse } from "./tariff";
import type { TariffConfig } from "./types";

export interface EvChargingParams {
  /** Energy needed to reach the target charge, kWh. */
  energyNeededKwh: number;
  /** Charger power output, kW (e.g. 1.4 / 3.7 / 7.4 / 11 / 22). */
  chargerPowerKw: number;
  /** First hour charging may start (0-23), typically "now" or arrival time. */
  windowStartHour: number;
  /** Hour by which charging must be complete (0-24, exclusive), e.g. 7 for "ready by 7am". */
  windowEndHour: number;
  tariff: TariffConfig;
  /** Optional forecast of exportable solar surplus per hour of day (index 0-23), kWh available that hour. */
  solarSurplusByHour?: number[];
  /** Anchor date — only its calendar date matters, hours come from the window params. */
  referenceDate?: Date;
}

export interface HourPlan {
  hour: number;
  energyKwh: number;
  costEUR: number;
  fromSolarKwh: number;
  isHeureCreuse: boolean;
}

export interface EvChargingPlan {
  schedule: HourPlan[];
  totalCostEUR: number;
  totalEnergyKwh: number;
  /** Cost of just plugging in at windowStartHour and charging straight through. */
  naiveCostEUR: number;
  savingsEUR: number;
  recommendedStartHours: number[];
}

/** Hours in [start, end) on a 0-23 clock, wrapping past midnight if end <= start. */
function hoursInWindow(start: number, end: number): number[] {
  const hours: number[] = [];
  let h = start;
  const span = end > start ? end - start : 24 - start + end;
  for (let i = 0; i < span; i++) {
    hours.push(h % 24);
    h++;
  }
  return hours;
}

/**
 * Greedy least-cost scheduling: charging is divisible across hourly blocks, so
 * filling the cheapest available hours first (solar surplus, then heures creuses,
 * then heures pleines) is optimal for a single appliance with no continuity constraint.
 */
export function simulateEvCharging(params: EvChargingParams): EvChargingPlan {
  const {
    energyNeededKwh,
    chargerPowerKw,
    windowStartHour,
    windowEndHour,
    tariff,
    solarSurplusByHour = [],
    referenceDate = new Date(),
  } = params;

  const hours = hoursInWindow(windowStartHour, windowEndHour);
  const base = new Date(referenceDate);
  base.setMinutes(0, 0, 0);

  const hourCosts = hours.map((hour) => {
    const at = new Date(base);
    at.setHours(hour);
    const hc = isHeureCreuse(at, tariff);
    const gridRate = hc ? tariff.hcPricePerKwh : tariff.hpPricePerKwh;
    const solarAvailableKwh = Math.min(chargerPowerKw, solarSurplusByHour[hour] ?? 0);
    return { hour, gridRate, solarAvailableKwh, isHeureCreuse: hc };
  });

  // Cheapest hours first: free solar beats heures creuses beats heures pleines.
  const ordered = [...hourCosts].sort((a, b) => {
    const effectiveA = a.gridRate * (1 - a.solarAvailableKwh / chargerPowerKw);
    const effectiveB = b.gridRate * (1 - b.solarAvailableKwh / chargerPowerKw);
    return effectiveA - effectiveB;
  });

  let remaining = energyNeededKwh;
  const schedule: HourPlan[] = [];
  for (const h of ordered) {
    if (remaining <= 0) break;
    const energyThisHour = Math.min(chargerPowerKw, remaining);
    const fromSolarKwh = Math.min(h.solarAvailableKwh, energyThisHour);
    const fromGridKwh = energyThisHour - fromSolarKwh;
    schedule.push({
      hour: h.hour,
      energyKwh: energyThisHour,
      costEUR: fromGridKwh * h.gridRate,
      fromSolarKwh,
      isHeureCreuse: h.isHeureCreuse,
    });
    remaining -= energyThisHour;
  }
  schedule.sort((a, b) => a.hour - b.hour);

  const totalCostEUR = schedule.reduce((sum, s) => sum + s.costEUR, 0);
  const totalEnergyKwh = schedule.reduce((sum, s) => sum + s.energyKwh, 0);

  // Naive baseline: plug in immediately at windowStartHour, charge straight through, no solar awareness.
  let naiveRemaining = energyNeededKwh;
  let naiveCostEUR = 0;
  for (const h of hourCosts) {
    if (naiveRemaining <= 0) break;
    const energyThisHour = Math.min(chargerPowerKw, naiveRemaining);
    naiveCostEUR += energyThisHour * h.gridRate;
    naiveRemaining -= energyThisHour;
  }

  return {
    schedule,
    totalCostEUR,
    totalEnergyKwh,
    naiveCostEUR,
    savingsEUR: naiveCostEUR - totalCostEUR,
    recommendedStartHours: schedule.map((s) => s.hour),
  };
}
