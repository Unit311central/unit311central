/**
 * Northstar demo — year-by-year headcount by office (EA / HR reports SSOT).
 */

export type NorthstarHeadcountYearRow = {
  year: number;
  manchester: number;
  bristol: number;
  austin: number;
  total: number;
};

/** Headcount at fiscal year-end (Apr UK FY alignment for demo narrative). */
export const NORTHSTAR_HEADCOUNT_BY_YEAR: readonly NorthstarHeadcountYearRow[] = [
  { year: 2023, manchester: 5, bristol: 0, austin: 0, total: 5 },
  { year: 2024, manchester: 9, bristol: 3, austin: 0, total: 12 },
  { year: 2025, manchester: 11, bristol: 6, austin: 2, total: 19 },
  { year: 2026, manchester: 12, bristol: 7, austin: 6, total: 25 },
] as const;

export function buildNorthstarHeadcountGrowthSummary(): {
  asOf: string;
  headline: string;
  bullets: string[];
  series: NorthstarHeadcountYearRow[];
  locations: Array<{ id: string; label: string; current: number }>;
} {
  const latest = NORTHSTAR_HEADCOUNT_BY_YEAR[NORTHSTAR_HEADCOUNT_BY_YEAR.length - 1]!;
  const baseline = NORTHSTAR_HEADCOUNT_BY_YEAR[0]!;
  return {
    asOf: "16 August 2026",
    headline: `Headcount ${baseline.total} → ${latest.total} since ${baseline.year} across Manchester, Bristol, and Austin`,
    bullets: [
      `Manchester HQ: ${baseline.manchester} (${baseline.year}) → ${latest.manchester} (${latest.year})`,
      `Bristol: ${NORTHSTAR_HEADCOUNT_BY_YEAR.find((r) => r.year === 2024)?.bristol ?? 0} (${2024}) → ${latest.bristol} (${latest.year})`,
      `Austin (US expansion): ${NORTHSTAR_HEADCOUNT_BY_YEAR.find((r) => r.year === 2025)?.austin ?? 0} (${2025}) → ${latest.austin} (${latest.year}) — payroll run-rate +12% vs plan`,
      "Current FTE mix: 25 total (UK 19 + US 6).",
    ],
    series: [...NORTHSTAR_HEADCOUNT_BY_YEAR],
    locations: [
      { id: "manchester", label: "Manchester", current: latest.manchester },
      { id: "bristol", label: "Bristol", current: latest.bristol },
      { id: "austin", label: "Austin", current: latest.austin },
    ],
  };
}
