import type { TouWindow } from "./types";

const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function isValidHhMm(value: string): boolean {
  return HHMM.test(value.trim());
}

/** Normalises "7:5" / "07:05" style input to "07:05"; returns null if unparseable. */
export function normaliseHhMm(value: string): string | null {
  const raw = value.trim().replace("h", ":");
  const match = HHMM.exec(raw);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Minutes covered by a window, accounting for midnight wrap. */
export function windowDurationMinutes(window: TouWindow): number {
  const start = toMinutes(window.start);
  const end = toMinutes(window.end);
  if (start === end) return 0;
  return end > start ? end - start : 24 * 60 - start + end;
}

/** Expands a window into the half-open minute ranges it covers on a 24h clock. */
function ranges(window: TouWindow): [number, number][] {
  const start = toMinutes(window.start);
  const end = toMinutes(window.end);
  if (start === end) return [];
  if (start < end) return [[start, end]];
  return [
    [start, 24 * 60],
    [0, end],
  ];
}

export interface WindowIssue {
  index: number;
  message: string;
}

/**
 * Validates a set of heures-creuses windows: each must parse, span a non-zero
 * duration, and not overlap another (overlapping windows would double-count
 * the same hours when splitting consumption).
 */
export function validateWindows(windows: TouWindow[]): WindowIssue[] {
  const issues: WindowIssue[] = [];

  windows.forEach((w, index) => {
    if (!isValidHhMm(w.start) || !isValidHhMm(w.end)) {
      issues.push({ index, message: "Format attendu : HH:MM (ex. 22:00)" });
      return;
    }
    if (windowDurationMinutes(w) === 0) {
      issues.push({ index, message: "Le début et la fin sont identiques" });
    }
  });

  for (let i = 0; i < windows.length; i++) {
    for (let j = i + 1; j < windows.length; j++) {
      const a = windows[i];
      const b = windows[j];
      if (!isValidHhMm(a.start) || !isValidHhMm(a.end)) continue;
      if (!isValidHhMm(b.start) || !isValidHhMm(b.end)) continue;

      const overlaps = ranges(a).some(([aStart, aEnd]) =>
        ranges(b).some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd)
      );
      if (overlaps) {
        issues.push({ index: j, message: `Chevauche la plage ${i + 1}` });
      }
    }
  }

  return issues;
}

/** Total heures-creuses hours per day across all windows. */
export function totalHoursPerDay(windows: TouWindow[]): number {
  return windows.reduce((sum, w) => sum + windowDurationMinutes(w), 0) / 60;
}
