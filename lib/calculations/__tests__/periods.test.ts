import { bucketsFor, dateKey, rangeFor, withinRange } from "../periods";
import type { DailyRollup } from "../../enphase/history";

function rollup(date: string): DailyRollup {
  return {
    date,
    productionKwh: 1,
    consumptionKwh: 1,
    gridImportKwh: 0,
    gridExportKwh: 0,
    heuresPleinesConsumptionKwh: 0,
    heuresCreusesConsumptionKwh: 0,
    heuresPleinesImportKwh: 0,
    heuresCreusesImportKwh: 0,
  };
}

const commissioned = new Date(2024, 0, 1);
// A Wednesday.
const now = new Date(2026, 4, 20, 15, 30);

describe("rangeFor", () => {
  it("covers only today for the day period", () => {
    const { from, to } = rangeFor("day", now, commissioned);
    expect(dateKey(from)).toBe("2026-05-20");
    expect(dateKey(to)).toBe("2026-05-20");
  });

  // A calendar week would show a single day on a Monday and read as a collapse.
  it("covers the last seven days, not the calendar week", () => {
    const { from, to } = rangeFor("week", now, commissioned);
    expect(dateKey(from)).toBe("2026-05-14");
    expect(dateKey(to)).toBe("2026-05-20");
  });

  it("starts the month period on the first", () => {
    expect(dateKey(rangeFor("month", now, commissioned).from)).toBe("2026-05-01");
  });

  it("starts the year period on 1 January", () => {
    expect(dateKey(rangeFor("year", now, commissioned).from)).toBe("2026-01-01");
  });

  it("runs from commissioning for the all period", () => {
    expect(dateKey(rangeFor("all", now, commissioned).from)).toBe("2024-01-01");
  });

  // Reaching back before the panels existed would invent production.
  it("never starts before commissioning", () => {
    const recent = new Date(2026, 4, 18);
    expect(dateKey(rangeFor("year", now, recent).from)).toBe("2026-05-18");
    expect(dateKey(rangeFor("week", now, recent).from)).toBe("2026-05-18");
  });
});

describe("withinRange", () => {
  it("keeps the bounds inclusive", () => {
    const rollups = ["2026-05-13", "2026-05-14", "2026-05-20", "2026-05-21"].map(rollup);
    const kept = withinRange(rollups, new Date(2026, 4, 14), new Date(2026, 4, 20));
    expect(kept.map((r) => r.date)).toEqual(["2026-05-14", "2026-05-20"]);
  });
});

describe("bucketsFor", () => {
  it("gives one bucket per day for a week", () => {
    const rollups = ["2026-05-18", "2026-05-19", "2026-05-20"].map(rollup);
    const buckets = bucketsFor("week", rollups);
    expect(buckets).toHaveLength(3);
    expect(buckets.map((b) => b.label)).toEqual(["Lun", "Mar", "Mer"]);
  });

  it("labels month buckets by day number", () => {
    const buckets = bucketsFor("month", ["2026-05-01", "2026-05-02"].map(rollup));
    expect(buckets.map((b) => b.label)).toEqual(["1", "2"]);
  });

  it("groups a year into calendar months", () => {
    const rollups = ["2026-01-05", "2026-01-28", "2026-03-02"].map(rollup);
    const buckets = bucketsFor("year", rollups);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].label).toBe("Jan");
    expect(buckets[0].rollups).toHaveLength(2);
    expect(buckets[1].label).toBe("Mar");
  });

  it("keeps month buckets in chronological order across years", () => {
    const buckets = bucketsFor("all", ["2026-02-01", "2025-11-01"].map(rollup));
    expect(buckets.map((b) => b.title)).toEqual(["Nov 2025", "Fév 2026"]);
  });

  it("returns nothing for an empty period", () => {
    expect(bucketsFor("month", [])).toEqual([]);
  });
});
