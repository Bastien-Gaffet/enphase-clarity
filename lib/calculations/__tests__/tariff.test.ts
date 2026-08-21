import { computeSavings, isHeureCreuse, isWithinWindow, priceAt } from "../tariff";
import type { EnergyInterval, TariffConfig } from "../types";

const tariff: TariffConfig = {
  hpPricePerKwh: 0.27,
  hcPricePerKwh: 0.2,
  hcWindows: [{ start: "22:00", end: "06:00" }],
  subscriptionMonthlyEUR: 15,
  surplusSellPricePerKwh: 0.04,
};

function at(hh: number, mm = 0): Date {
  const d = new Date(2026, 0, 15, hh, mm, 0, 0);
  return d;
}

describe("isWithinWindow / isHeureCreuse", () => {
  it("handles a midnight-wrapping window (22:00 -> 06:00)", () => {
    expect(isHeureCreuse(at(23, 0), tariff)).toBe(true);
    expect(isHeureCreuse(at(5, 0), tariff)).toBe(true);
    expect(isHeureCreuse(at(12, 0), tariff)).toBe(false);
  });

  it("is inclusive of start and exclusive of end", () => {
    expect(isWithinWindow(at(22, 0), tariff.hcWindows[0])).toBe(true);
    expect(isWithinWindow(at(6, 0), tariff.hcWindows[0])).toBe(false);
  });

  it("handles a same-day (non-wrapping) window", () => {
    const window = { start: "13:00", end: "17:00" };
    expect(isWithinWindow(at(14, 0), window)).toBe(true);
    expect(isWithinWindow(at(18, 0), window)).toBe(false);
  });

  it("treats a zero-length window as never active", () => {
    expect(isWithinWindow(at(10, 0), { start: "09:00", end: "09:00" })).toBe(false);
  });
});

describe("priceAt", () => {
  it("returns the heures-creuses rate inside the window and heures-pleines outside", () => {
    expect(priceAt(at(23, 0), tariff)).toBe(tariff.hcPricePerKwh);
    expect(priceAt(at(12, 0), tariff)).toBe(tariff.hpPricePerKwh);
  });
});

describe("computeSavings", () => {
  it("returns all zeros for an empty series", () => {
    const result = computeSavings([], tariff);
    expect(result.totalSavingsEUR).toBe(0);
    expect(result.autonomyRatio).toBe(0);
  });

  it("aggregates cost, export revenue, and HP/HC split correctly", () => {
    const intervals: EnergyInterval[] = [
      // Midday (HP): 2 kWh produced, 1 kWh consumed -> fully self-consumed, 1 kWh exported.
      {
        timestamp: at(12, 0).toISOString(),
        durationHours: 1,
        productionKwh: 2,
        consumptionKwh: 1,
        gridImportKwh: 0,
        gridExportKwh: 1,
      },
      // Night (HC): no production, 1.5 kWh consumed, all from the grid.
      {
        timestamp: at(23, 0).toISOString(),
        durationHours: 1,
        productionKwh: 0,
        consumptionKwh: 1.5,
        gridImportKwh: 1.5,
        gridExportKwh: 0,
      },
    ];

    const result = computeSavings(intervals, tariff);

    // Without solar: 1 kWh at HP + 1.5 kWh at HC.
    expect(result.costWithoutSolarEUR).toBeCloseTo(1 * 0.27 + 1.5 * 0.2, 5);
    // Actual grid draw: only the night 1.5 kWh at HC.
    expect(result.gridCostEUR).toBeCloseTo(1.5 * 0.2, 5);
    expect(result.exportRevenueEUR).toBeCloseTo(1 * 0.04, 5);
    expect(result.netCostEUR).toBeCloseTo(1.5 * 0.2 - 1 * 0.04, 5);
    expect(result.totalSavingsEUR).toBeCloseTo(result.costWithoutSolarEUR - result.netCostEUR, 5);
    expect(result.heuresPleinesKwh).toBe(0); // no HP grid import in this scenario
    expect(result.heuresCreusesKwh).toBe(1.5);
    expect(result.selfConsumedKwh).toBe(1);
    expect(result.exportedKwh).toBe(1);
    expect(result.selfConsumptionRatio).toBeCloseTo(1 / 2, 5); // 1 kWh self-consumed / 2 kWh produced
    expect(result.autonomyRatio).toBeCloseTo(1 / 2.5, 5); // 1 kWh self-consumed / 2.5 kWh consumed
  });
});
