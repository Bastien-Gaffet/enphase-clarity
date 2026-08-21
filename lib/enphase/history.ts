import type { EnergyInterval, TariffConfig } from "../calculations/types";
import { isHeureCreuse, type SavingsBreakdown } from "../calculations/tariff";
import { EnphaseClient, fetchEnergyIntervals } from "./client";

export interface DailyRollup {
  date: string; // YYYY-MM-DD, local calendar day
  productionKwh: number;
  consumptionKwh: number;
  gridImportKwh: number;
  gridExportKwh: number;
  /** Consumption split by time-of-use period, so cost can be recomputed against the current tariff later. */
  heuresPleinesConsumptionKwh: number;
  heuresCreusesConsumptionKwh: number;
  heuresPleinesImportKwh: number;
  heuresCreusesImportKwh: number;
}

function toLocalDateKey(timestamp: string): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function emptyRollup(date: string): DailyRollup {
  return {
    date,
    productionKwh: 0,
    consumptionKwh: 0,
    gridImportKwh: 0,
    gridExportKwh: 0,
    heuresPleinesConsumptionKwh: 0,
    heuresCreusesConsumptionKwh: 0,
    heuresPleinesImportKwh: 0,
    heuresCreusesImportKwh: 0,
  };
}

/**
 * Sums a batch of intervals into per-calendar-day totals, keeping the
 * heures-creuses/pleines split (evaluated against `tariff`'s current
 * windows) so savings can be recomputed later without re-fetching.
 */
export function rollupIntervalsByDay(intervals: EnergyInterval[], tariff: TariffConfig): DailyRollup[] {
  const byDay = new Map<string, DailyRollup>();

  for (const interval of intervals) {
    const key = toLocalDateKey(interval.timestamp);
    const day = byDay.get(key) ?? emptyRollup(key);
    const hc = isHeureCreuse(new Date(interval.timestamp), tariff);

    day.productionKwh += interval.productionKwh;
    day.consumptionKwh += interval.consumptionKwh;
    day.gridImportKwh += interval.gridImportKwh;
    day.gridExportKwh += interval.gridExportKwh;
    if (hc) {
      day.heuresCreusesConsumptionKwh += interval.consumptionKwh;
      day.heuresCreusesImportKwh += interval.gridImportKwh;
    } else {
      day.heuresPleinesConsumptionKwh += interval.consumptionKwh;
      day.heuresPleinesImportKwh += interval.gridImportKwh;
    }

    byDay.set(key, day);
  }

  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Recomputes a savings breakdown from cached daily rollups against the current tariff. */
export function computeSavingsFromRollups(rollups: DailyRollup[], tariff: TariffConfig): SavingsBreakdown {
  let costWithoutSolarEUR = 0;
  let gridCostEUR = 0;
  let exportRevenueEUR = 0;
  let heuresPleinesKwh = 0;
  let heuresCreusesKwh = 0;
  let selfConsumedKwh = 0;
  let exportedKwh = 0;
  let productionKwh = 0;
  let consumptionKwh = 0;

  for (const day of rollups) {
    costWithoutSolarEUR +=
      day.heuresPleinesConsumptionKwh * tariff.hpPricePerKwh +
      day.heuresCreusesConsumptionKwh * tariff.hcPricePerKwh;
    gridCostEUR += day.heuresPleinesImportKwh * tariff.hpPricePerKwh + day.heuresCreusesImportKwh * tariff.hcPricePerKwh;
    exportRevenueEUR += day.gridExportKwh * tariff.surplusSellPricePerKwh;
    heuresPleinesKwh += day.heuresPleinesImportKwh;
    heuresCreusesKwh += day.heuresCreusesImportKwh;
    selfConsumedKwh += Math.max(0, day.consumptionKwh - day.gridImportKwh);
    exportedKwh += day.gridExportKwh;
    productionKwh += day.productionKwh;
    consumptionKwh += day.consumptionKwh;
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

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface FetchHistoryOptions {
  /** Days per API request window. Enphase rate-limits vary by plan; keep this modest. */
  chunkDays?: number;
  /** Caps how many chunk requests one sync call makes — large backfills complete over several syncs instead of one burst. */
  maxChunksPerSync?: number;
  /** Delay between chunk requests, ms — spaces out calls to stay under rate limits. */
  delayMs?: number;
}

export interface FetchHistoryResult {
  rollups: DailyRollup[];
  /** Last calendar day (YYYY-MM-DD) successfully fetched, or null if nothing was fetched. */
  reachedDate: string | null;
  /** True if there is still more history between reachedDate and toDate — call again to continue. */
  hasMore: boolean;
}

/**
 * Fetches [fromDate, toDate) in day-chunks, oldest first, stopping after
 * maxChunksPerSync requests. Designed to be called repeatedly (e.g. on each
 * app open) until hasMore is false — a full year of history backfills
 * gradually instead of firing dozens of requests at once.
 */
export async function fetchHistoricalRollups(
  client: EnphaseClient,
  systemId: string,
  fromDate: Date,
  toDate: Date,
  tariff: TariffConfig,
  options: FetchHistoryOptions = {}
): Promise<FetchHistoryResult> {
  const { chunkDays = 14, maxChunksPerSync = 6, delayMs = 400 } = options;

  const from = startOfDay(fromDate);
  const to = startOfDay(toDate);
  if (from >= to) return { rollups: [], reachedDate: null, hasMore: false };

  const allIntervals: EnergyInterval[] = [];
  let cursor = from;
  let chunksUsed = 0;

  while (cursor < to && chunksUsed < maxChunksPerSync) {
    const chunkEnd = new Date(Math.min(addDays(cursor, chunkDays).getTime(), to.getTime()));

    const intervals = await fetchEnergyIntervals(
      client,
      systemId,
      Math.floor(cursor.getTime() / 1000),
      Math.floor(chunkEnd.getTime() / 1000)
    );
    allIntervals.push(...intervals);

    cursor = chunkEnd;
    chunksUsed += 1;
    if (cursor < to && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  const rollups = rollupIntervalsByDay(allIntervals, tariff);
  const reachedDate = cursor > from ? toLocalDateKey(addDays(cursor, -1).toISOString()) : null;

  return { rollups, reachedDate, hasMore: cursor < to };
}
