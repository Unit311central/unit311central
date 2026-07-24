/**
 * Shared report period parsing for EA PDFs.
 * Numbers always come from live series for the resolved window — never invented.
 */

export type ReportPeriod =
  | { kind: "month"; key: string }
  | { kind: "ytd" }
  | { kind: "last_n_months"; n: number };

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
