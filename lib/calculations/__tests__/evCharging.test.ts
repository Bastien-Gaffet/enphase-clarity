import { simulateEvCharging } from "../evCharging";
import type { TariffConfig } from "../types";

const tariff: TariffConfig = {
  hpPricePerKwh: 0.27,
  hcPricePerKwh: 0.2,
  hcWindows: [{ start: "22:00", end: "06:00" }],
  subscriptionMonthlyEUR: 15,
  surplusSellPricePerKwh: 0.04,
};

const referenceDate = new Date(2026, 0, 15);

describe("simulateEvCharging", () => {
  it("prefers free solar surplus, then heures creuses, over heures pleines", () => {
    const solarSurplusByHour = Array(24).fill(0);
    solarSurplusByHour[20] = 5; // exactly covers one hour at chargerPowerKw

    const plan = simulateEvCharging({
      energyNeededKwh: 10,
      chargerPowerKw: 5,
      windowStartHour: 20,
      windowEndHour: 8, // wraps midnight: 20,21,22,...,7
      tariff,
      solarSurplusByHour,
      referenceDate,
    });

    expect(plan.totalEnergyKwh).toBeCloseTo(10, 5);
    expect(plan.schedule).toHaveLength(2);

    // Hour 20 is fully solar-covered and therefore free.
    const solarHour = plan.schedule.find((s) => s.hour === 20);
    expect(solarHour?.fromSolarKwh).toBeCloseTo(5, 5);
    expect(solarHour?.costEUR).toBeCloseTo(0, 5);

    // The second hour must come from the cheaper heures-creuses pool (20/21 are HP, so
    // anything other than 20 that got picked has to be one of 22,23,0,1,2,3,4,5).
    const otherHour = plan.schedule.find((s) => s.hour !== 20)!;
    expect([22, 23, 0, 1, 2, 3, 4, 5]).toContain(otherHour.hour);
    expect(otherHour.isHeureCreuse).toBe(true);
    expect(otherHour.costEUR).toBeCloseTo(5 * tariff.hcPricePerKwh, 5);

    expect(plan.totalCostEUR).toBeCloseTo(5 * tariff.hcPricePerKwh, 5);
    // Naive: plug in immediately at 20h, two straight HP hours.
    expect(plan.naiveCostEUR).toBeCloseTo(10 * tariff.hpPricePerKwh, 5);
    expect(plan.savingsEUR).toBeCloseTo(plan.naiveCostEUR - plan.totalCostEUR, 5);
    expect(plan.savingsEUR).toBeGreaterThan(0);
  });

  it("never schedules more power in an hour than the charger can deliver", () => {
    const plan = simulateEvCharging({
      energyNeededKwh: 20,
      chargerPowerKw: 7.4,
      windowStartHour: 0,
      windowEndHour: 6,
      tariff,
      referenceDate,
    });

    for (const entry of plan.schedule) {
      expect(entry.energyKwh).toBeLessThanOrEqual(7.4 + 1e-9);
      expect(entry.fromSolarKwh).toBeLessThanOrEqual(entry.energyKwh + 1e-9);
    }
  });

  it("caps total scheduled energy at what the window can physically deliver", () => {
    const plan = simulateEvCharging({
      energyNeededKwh: 100,
      chargerPowerKw: 3,
      windowStartHour: 1,
      windowEndHour: 3, // only 2 hours available
      tariff,
      referenceDate,
    });

    expect(plan.totalEnergyKwh).toBeCloseTo(6, 5); // 2h * 3kW
    expect(plan.schedule).toHaveLength(2);
  });

  it("returns an empty plan when no energy is needed", () => {
    const plan = simulateEvCharging({
      energyNeededKwh: 0,
      chargerPowerKw: 7.4,
      windowStartHour: 20,
      windowEndHour: 7,
      tariff,
      referenceDate,
    });

    expect(plan.schedule).toHaveLength(0);
    expect(plan.totalCostEUR).toBe(0);
  });
});
