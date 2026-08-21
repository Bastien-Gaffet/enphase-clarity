import {
  isValidHhMm,
  normaliseHhMm,
  totalHoursPerDay,
  validateWindows,
  windowDurationMinutes,
} from "../touWindows";

describe("isValidHhMm / normaliseHhMm", () => {
  it("accepts valid times and rejects invalid ones", () => {
    expect(isValidHhMm("22:00")).toBe(true);
    expect(isValidHhMm("7:05")).toBe(true);
    expect(isValidHhMm("24:00")).toBe(false);
    expect(isValidHhMm("22:60")).toBe(false);
    expect(isValidHhMm("abc")).toBe(false);
  });

  it("pads to HH:MM and accepts the 'h' separator", () => {
    expect(normaliseHhMm("7:05")).toBe("07:05");
    expect(normaliseHhMm(" 22:00 ")).toBe("22:00");
    expect(normaliseHhMm("6h30")).toBe("06:30");
    expect(normaliseHhMm("nope")).toBeNull();
  });
});

describe("windowDurationMinutes", () => {
  it("measures a same-day window", () => {
    expect(windowDurationMinutes({ start: "12:00", end: "14:00" })).toBe(120);
  });

  it("measures a window that wraps midnight", () => {
    expect(windowDurationMinutes({ start: "22:00", end: "06:00" })).toBe(8 * 60);
  });

  it("treats a zero-length window as zero", () => {
    expect(windowDurationMinutes({ start: "09:00", end: "09:00" })).toBe(0);
  });
});

describe("validateWindows", () => {
  it("accepts a typical two-range EDF contract", () => {
    expect(
      validateWindows([
        { start: "12:00", end: "14:00" },
        { start: "22:00", end: "06:00" },
      ])
    ).toEqual([]);
  });

  it("flags a malformed time", () => {
    const issues = validateWindows([{ start: "25:00", end: "06:00" }]);
    expect(issues).toHaveLength(1);
    expect(issues[0].index).toBe(0);
  });

  it("flags a zero-length window", () => {
    const issues = validateWindows([{ start: "09:00", end: "09:00" }]);
    expect(issues).toHaveLength(1);
  });

  it("flags plainly overlapping windows", () => {
    const issues = validateWindows([
      { start: "12:00", end: "15:00" },
      { start: "14:00", end: "16:00" },
    ]);
    expect(issues.some((i) => i.message.includes("Chevauche"))).toBe(true);
  });

  // Overlap detection has to account for the wrapped half of a midnight window.
  it("flags an overlap against the wrapped part of a night window", () => {
    const issues = validateWindows([
      { start: "22:00", end: "06:00" },
      { start: "05:00", end: "07:00" },
    ]);
    expect(issues.some((i) => i.message.includes("Chevauche"))).toBe(true);
  });

  it("accepts windows that merely touch at an edge", () => {
    expect(
      validateWindows([
        { start: "22:00", end: "06:00" },
        { start: "06:00", end: "08:00" },
      ])
    ).toEqual([]);
  });
});

describe("totalHoursPerDay", () => {
  it("sums across several windows", () => {
    expect(
      totalHoursPerDay([
        { start: "12:00", end: "14:00" },
        { start: "22:00", end: "06:00" },
      ])
    ).toBe(10);
  });
});
