/**
 * Shared report period parsing for EA PDFs.
 * Numbers always come from live series for the resolved window — never invented.
 */

export type CalendarQuarter = 1 | 2 | 3 | 4;

export type QuarterRef = {
  year: number;
  quarter: CalendarQuarter;
};

export type ReportPeriod =
  | { kind: "month"; key: string }
  | { kind: "ytd" }
  | { kind: "last_n_months"; n: number }
  | { kind: "quarter"; year: number; quarter: CalendarQuarter };

function previousMonthKey(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

function currentMonthKey(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

/** Last N calendar months ending at the previous completed month (excludes current partial). */
export function lastNMonthKeys(n: number, now = new Date()): string[] {
  const count = Math.max(1, Math.min(36, Math.floor(n)));
  const keys: string[] = [];
  for (let i = count; i >= 1; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
}

/** Previous completed calendar quarter relative to `now` (UTC). */
export function getLastCompletedCalendarQuarter(now = new Date()): QuarterRef {
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  const currentQuarter = (Math.floor(month / 3) + 1) as CalendarQuarter;
  if (currentQuarter === 1) {
    return { year: year - 1, quarter: 4 };
  }
  return { year, quarter: (currentQuarter - 1) as CalendarQuarter };
}

export function getPriorQuarter(ref: QuarterRef): QuarterRef {
  if (ref.quarter === 1) {
    return { year: ref.year - 1, quarter: 4 };
  }
  return { year: ref.year, quarter: (ref.quarter - 1) as CalendarQuarter };
}

export function quarterToReportPeriod(ref: QuarterRef): Extract<ReportPeriod, { kind: "quarter" }> {
  return { kind: "quarter", year: ref.year, quarter: ref.quarter };
}

/** ISO month keys (YYYY-MM) for each month in a calendar quarter. */
export function quarterMonthKeys(ref: QuarterRef): string[] {
  const startMonth = (ref.quarter - 1) * 3 + 1;
  return [0, 1, 2].map((offset) => {
    const month = startMonth + offset;
    return `${ref.year}-${String(month).padStart(2, "0")}`;
  });
}

export function formatQuarterLabel(ref: QuarterRef): string {
  return `Q${ref.quarter} ${ref.year}`;
}

export function parseReportPeriod(periodHint?: string | null): ReportPeriod {
  const hint = (periodHint || "").toLowerCase();
  const now = new Date();

  const lastN = hint.match(/\b(?:last|past|previous)\s+(\d{1,2})\s+months?\b/);
  if (lastN?.[1]) {
    return { kind: "last_n_months", n: Number(lastN[1]) };
  }
  if (/\blast\s+six\s+months\b/.test(hint) || /\bpast\s+six\s+months\b/.test(hint)) {
    return { kind: "last_n_months", n: 6 };
  }
  if (/\blast\s+quarter\b/.test(hint) || /\bprevious\s+quarter\b/.test(hint) || /\bprior\s+quarter\b/.test(hint)) {
    return quarterToReportPeriod(getLastCompletedCalendarQuarter(now));
  }

  if (/last\s+month|previous\s+month|prior\s+month/.test(hint)) {
    return { kind: "month", key: previousMonthKey(now) };
  }
  if (/ytd|year\s+to\s+date|this\s+year/.test(hint)) {
    return { kind: "ytd" };
  }
  return { kind: "month", key: currentMonthKey(now) };
}

/**
 * Legacy string period for fixed financial board PDF.
 * last-N collapses to current month key for that template (scoped PDF handles ranges).
 */
export function resolveFinancialPeriod(periodHint?: string | null): string {
  const parsed = parseReportPeriod(periodHint);
  if (parsed.kind === "ytd") return "ytd";
  if (parsed.kind === "month") return parsed.key;
  return currentMonthKey();
}

export function formatReportPeriodLabel(period: ReportPeriod): string {
  if (period.kind === "ytd") {
    return `Year to date ${new Date().getUTCFullYear()}`;
  }
  if (period.kind === "last_n_months") {
    const keys = lastNMonthKeys(period.n);
    const first = keys[0];
    const last = keys[keys.length - 1];
    return `Last ${period.n} months (${monthLabel(first)} – ${monthLabel(last)})`;
  }
  if (period.kind === "quarter") {
    const keys = quarterMonthKeys({ year: period.year, quarter: period.quarter });
    const first = keys[0];
    const last = keys[keys.length - 1];
    return `${formatQuarterLabel({ year: period.year, quarter: period.quarter })} (${monthLabel(first)} – ${monthLabel(last)})`;
  }
  return monthLabel(period.key);
}

function monthLabel(isoMonth: string) {
  const [year, month] = isoMonth.split("-").map(Number);
  if (!year || !month) return isoMonth;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
