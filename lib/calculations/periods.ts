import type { DailyRollup } from "../enphase/history";

export type Period = "day" | "week" | "month" | "year" | "all";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
  { value: "all", label: "Total" },
];

export const PERIOD_TITLES: Record<Period, string> = {
  day: "Aujourd'hui",
  week: "7 derniers jours",
  month: "Ce mois-ci",
  year: "Cette année",
  all: "Depuis la mise en service",
};

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Inclusive day range covered by a period.
 *
 * "week" is the last seven days rather than the current ISO week: on a Monday
 * a calendar week would show a single day and read as a collapse in output.
 */
export function rangeFor(period: Period, now: Date, commissionedOn: Date): { from: Date; to: Date } {
  const to = startOfDay(now);
  const from = startOfDay(now);

  switch (period) {
    case "day":
      break;
    case "week":
      from.setDate(from.getDate() - 6);
      break;
    case "month":
      from.setDate(1);
      break;
    case "year":
      from.setMonth(0, 1);
      break;
    case "all":
      return { from: startOfDay(commissionedOn), to };
  }

  // Never reach back before the panels existed.
  const floor = startOfDay(commissionedOn);
  return { from: from < floor ? floor : from, to };
}

export function withinRange(rollups: DailyRollup[], from: Date, to: Date): DailyRollup[] {
  const fromKey = dateKey(from);
  const toKey = dateKey(to);
  return rollups.filter((r) => r.date >= fromKey && r.date <= toKey);
}

export interface Bucket {
  /** Chart label, kept short enough for an axis. */
  label: string;
  /** Full description for a tooltip or caption. */
  title: string;
  rollups: DailyRollup[];
}

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

/**
 * Groups a period's days into the bars a chart should show: daily bars for a
 * week, daily for a month, monthly for a year, monthly for everything.
 */
export function bucketsFor(period: Period, rollups: DailyRollup[]): Bucket[] {
  if (period === "day") {
    return rollups.map((r) => ({ label: "", title: r.date, rollups: [r] }));
  }

  if (period === "week" || period === "month") {
    return rollups.map((r) => {
      const d = new Date(`${r.date}T00:00:00`);
      return {
        label: period === "week" ? WEEKDAYS[d.getDay()] : String(d.getDate()),
        title: r.date,
        rollups: [r],
      };
    });
  }

  // year / all → one bar per calendar month
  const byMonth = new Map<string, DailyRollup[]>();
  for (const r of rollups) {
    const key = r.date.slice(0, 7);
    const list = byMonth.get(key);
    if (list) list.push(r);
    else byMonth.set(key, [r]);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => {
      const month = Number(key.slice(5, 7)) - 1;
      return {
        label: MONTHS[month],
        title: `${MONTHS[month]} ${key.slice(0, 4)}`,
        rollups: list,
      };
    });
}
