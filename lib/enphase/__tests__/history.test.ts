import { computeSavings } from "../../calculations/tariff";
import type { EnergyInterval, TariffConfig } from "../../calculations/types";
import { computeSavingsFromRollups, rollupIntervalsByDay } from "../history";

const tariff: TariffConfig = {
  hpPricePerKwh: 0.27,
  hcPricePerKwh: 0.2,
  hcWindows: [{ start: "22:00", end: "06:00" }],
  subscriptionMonthlyEUR: 15,
  surplusSellPricePerKwh: 0.04,
};

function iso(day: number, hour: number): string {
  return new Date(2026, 0, day, hour, 0, 0, 0).toISOString();
}

const intervals: EnergyInterval[] = [
  // Day 1, HP (noon): production covers consumption with 1 kWh exported.
  { timestamp: iso(15, 12), durationHours: 1, productionKwh: 2, consumptionKwh: 1, gridImportKwh: 0, gridExportKwh: 1 },
  // Day 1, HC (23h): all from the grid.
  { timestamp: iso(15, 23), durationHours: 1, productionKwh: 0, consumptionKwh: 1.5, gridImportKwh: 1.5, gridExportKwh: 0 },
  // Day 2, HP (noon): no production, fully imported.
  { timestamp: iso(16, 12), durationHours: 1, productionKwh: 0, consumptionKwh: 2, gridImportKwh: 2, gridExportKwh: 0 },
];

describe("rollupIntervalsByDay", () => {
  it("groups intervals by local calendar day and splits by HP/HC", () => {
    const rollups = rollupIntervalsByDay(intervals, tariff);
    expect(rollups).toHaveLength(2);

    const day1 = rollups.find((r) => r.date === "2026-01-15")!;
    expect(day1.productionKwh).toBeCloseTo(2, 5);
    expect(day1.consumptionKwh).toBeCloseTo(2.5, 5);
    expect(day1.heuresPleinesConsumptionKwh).toBeCloseTo(1, 5);
    expect(day1.heuresCreusesConsumptionKwh).toBeCloseTo(1.5, 5);
    expect(day1.heuresPleinesImportKwh).toBeCloseTo(0, 5);
    expect(day1.heuresCreusesImportKwh).toBeCloseTo(1.5, 5);
    expect(day1.gridExportKwh).toBeCloseTo(1, 5);

    const day2 = rollups.find((r) => r.date === "2026-01-16")!;
    expect(day2.consumptionKwh).toBeCloseTo(2, 5);
    expect(day2.heuresPleinesImportKwh).toBeCloseTo(2, 5);
  });
});

describe("computeSavingsFromRollups", () => {
  it("matches computeSavings run directly on the same underlying intervals", () => {
    const direct = computeSavings(intervals, tariff);
    const fromRollups = computeSavingsFromRollups(rollupIntervalsByDay(intervals, tariff), tariff);

    expect(fromRollups.totalSavingsEUR).toBeCloseTo(direct.totalSavingsEUR, 5);
    expect(fromRollups.costWithoutSolarEUR).toBeCloseTo(direct.costWithoutSolarEUR, 5);
    expect(fromRollups.gridCostEUR).toBeCloseTo(direct.gridCostEUR, 5);
    expect(fromRollups.exportRevenueEUR).toBeCloseTo(direct.exportRevenueEUR, 5);
    expect(fromRollups.heuresPleinesKwh).toBeCloseTo(direct.heuresPleinesKwh, 5);
    expect(fromRollups.heuresCreusesKwh).toBeCloseTo(direct.heuresCreusesKwh, 5);
    expect(fromRollups.selfConsumptionRatio).toBeCloseTo(direct.selfConsumptionRatio, 5);
    expect(fromRollups.autonomyRatio).toBeCloseTo(direct.autonomyRatio, 5);
  });

  it("returns zeros for an empty rollup list", () => {
    const result = computeSavingsFromRollups([], tariff);
    expect(result.totalSavingsEUR).toBe(0);
    expect(result.autonomyRatio).toBe(0);
  });
});
