import type { EnergyInterval, TariffConfig, TouWindow } from "./types";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** True if the given Date falls inside a (possibly midnight-wrapping) TOU window. */
export function isWithinWindow(date: Date, window: TouWindow): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const start = toMinutes(window.start);
  const end = toMinutes(window.end);
  if (start === end) return false;
  if (start < end) return minutes >= start && minutes < end;
  // wraps midnight, e.g. 22:30 -> 06:30
  return minutes >= start || minutes < end;
}

export function isHeureCreuse(date: Date, tariff: TariffConfig): boolean {
  return tariff.hcWindows.some((w) => isWithinWindow(date, w));
}

/** Price paid for one grid kWh at the given instant. */
export function priceAt(date: Date, tariff: TariffConfig): number {
  return isHeureCreuse(date, tariff) ? tariff.hcPricePerKwh : tariff.hpPricePerKwh;
}

export interface SavingsBreakdown {
  /** What consumption would have cost if 100% bought from the grid at the applicable HP/HC rate. */
  costWithoutSolarEUR: number;
  /** What was actually paid for grid imports. */
  gridCostEUR: number;
  /** Revenue from exported surplus. */
  exportRevenueEUR: number;
  /** Net cost with solar (gridCost - exportRevenue). Can be negative (net income). */
  netCostEUR: number;
  /** costWithoutSolarEUR - netCostEUR. The headline number. */
  totalSavingsEUR: number;
  heuresPleinesKwh: number;
  heuresCreusesKwh: number;
  selfConsumedKwh: number;
  exportedKwh: number;
  /** selfConsumedKwh / productionKwh, 0..1. How much of what panels made was used on-site. */
  selfConsumptionRatio: number;
  /** consumptionKwh covered by production rather than the grid, 0..1. */
  autonomyRatio: number;
}

const EMPTY: SavingsBreakdown = {
  costWithoutSolarEUR: 0,
  gridCostEUR: 0,
  exportRevenueEUR: 0,
  netCostEUR: 0,
  totalSavingsEUR: 0,
  heuresPleinesKwh: 0,
  heuresCreusesKwh: 0,
  selfConsumedKwh: 0,
  exportedKwh: 0,
  selfConsumptionRatio: 0,
  autonomyRatio: 0,
};

/** Aggregates a series of metered intervals into a cost/savings breakdown. */
export function computeSavings(intervals: EnergyInterval[], tariff: TariffConfig): SavingsBreakdown {
  if (intervals.length === 0) return EMPTY;

  let costWithoutSolarEUR = 0;
  let gridCostEUR = 0;
  let exportRevenueEUR = 0;
  let heuresPleinesKwh = 0;
  let heuresCreusesKwh = 0;
  let selfConsumedKwh = 0;
  let exportedKwh = 0;
  let productionKwh = 0;
  let consumptionKwh = 0;

  for (const interval of intervals) {
    const date = new Date(interval.timestamp);
    const rate = priceAt(date, tariff);
    const hc = isHeureCreuse(date, tariff);

    costWithoutSolarEUR += interval.consumptionKwh * rate;
    gridCostEUR += interval.gridImportKwh * rate;
    exportRevenueEUR += interval.gridExportKwh * tariff.surplusSellPricePerKwh;

    if (hc) heuresCreusesKwh += interval.gridImportKwh;
    else heuresPleinesKwh += interval.gridImportKwh;

    const selfConsumed = Math.max(0, interval.consumptionKwh - interval.gridImportKwh);
    selfConsumedKwh += selfConsumed;
    exportedKwh += interval.gridExportKwh;
    productionKwh += interval.productionKwh;
    consumptionKwh += interval.consumptionKwh;
  }

  const netCostEUR = gridCostEUR - exportRevenueEUR;
  const totalSavingsEUR = costWithoutSolarEUR - netCostEUR;

  return {
    costWithoutSolarEUR,
    gridCostEUR,
    exportRevenueEUR,
    netCostEUR,
    totalSavingsEUR,
    heuresPleinesKwh,
    heuresCreusesKwh,
    selfConsumedKwh,
    exportedKwh,
    selfConsumptionRatio: productionKwh > 0 ? selfConsumedKwh / productionKwh : 0,
    autonomyRatio: consumptionKwh > 0 ? selfConsumedKwh / consumptionKwh : 0,
  };
}
