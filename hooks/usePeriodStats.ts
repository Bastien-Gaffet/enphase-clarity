import { useMemo } from "react";
import { useSettingsStore } from "../store/useSettingsStore";
import { useHistoryStore } from "../store/useHistoryStore";
import { generateMockRollups } from "../lib/enphase/mock";
import { computeSavingsFromRollups, type DailyRollup } from "../lib/enphase/history";
import { bucketsFor, rangeFor, withinRange, type Bucket, type Period } from "../lib/calculations/periods";
import type { SavingsBreakdown } from "../lib/calculations/tariff";

export interface PeriodStats {
  rollups: DailyRollup[];
  buckets: Bucket[];
  savings: SavingsBreakdown;
  /** Savings per bucket, aligned with `buckets`. */
  bucketSavings: number[];
  from: Date;
  to: Date;
  /** True when the figures come from the Enphase history rather than the demo generator. */
  real: boolean;
}

/**
 * Period statistics from whichever source is active: the synced Enphase
 * history in live mode, the demo generator otherwise. Both arrive as the same
 * daily rollups, so everything downstream is identical.
 */
export function usePeriodStats(period: Period): PeriodStats {
  const { tariff, investment, dataSource, mockSite } = useSettingsStore();
  const rollupMap = useHistoryStore((s) => s.rollups);

  return useMemo(() => {
    const now = new Date();
    const commissioned = new Date(investment.commissionedOn);
    const { from, to } = rangeFor(period, now, commissioned);

    const real = dataSource === "live" && Object.keys(rollupMap).length > 0;
    const rollups = real
      ? withinRange(
          Object.values(rollupMap).sort((a, b) => a.date.localeCompare(b.date)),
          from,
          to
        )
      : generateMockRollups(from, to, tariff, mockSite);

    const buckets = bucketsFor(period, rollups);

    return {
      rollups,
      buckets,
      savings: computeSavingsFromRollups(rollups, tariff),
      bucketSavings: buckets.map((b) => computeSavingsFromRollups(b.rollups, tariff).totalSavingsEUR),
      from,
      to,
      real,
    };
  }, [period, tariff, investment.commissionedOn, dataSource, mockSite, rollupMap]);
}
