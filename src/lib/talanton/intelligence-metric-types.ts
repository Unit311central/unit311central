/** Traceable intelligence metric — never present seed/heuristic values as live data. */
export type TalantonMetric<T extends string | number = number> = {
  value: T | null;
  /** When true, UI must not show a fabricated number. */
  unavailable: boolean;
  source: string;
};

export const UNAVAILABLE_LABEL = "Data unavailable";

export function metricFromCount(
  value: number,
  source: string,
): TalantonMetric<number> {
  return { value, unavailable: false, source };
}

export function unavailableMetric(source: string): TalantonMetric<number> {
  return { value: null, unavailable: true, source };
}

export function formatTalantonMetric(
  metric: TalantonMetric<number>,
  formatter: (n: number) => string = (n) => String(n),
): string {
  if (metric.unavailable || metric.value === null) return UNAVAILABLE_LABEL;
  return formatter(metric.value);
}

/** Format nullable intelligence counts for UI (null → Data unavailable). */
export function formatNullableCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return UNAVAILABLE_LABEL;
  return value.toLocaleString();
}

export function formatNullableScore(
  score: number | null | undefined,
  unavailable: boolean,
): string {
  if (unavailable || score === null || score === undefined) return UNAVAILABLE_LABEL;
  return `${score}/100`;
}
