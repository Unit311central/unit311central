import type { PlatformAnalyticsPeriod } from "@/lib/platform-analytics/types";

export const PLATFORM_ANALYTICS_PERIODS: {
  id: PlatformAnalyticsPeriod;
  label: string;
}[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "12m", label: "Last 12 months" },
  { id: "all", label: "All time" },
];

export function isPlatformAnalyticsPeriod(value: string | null | undefined): value is PlatformAnalyticsPeriod {
  return PLATFORM_ANALYTICS_PERIODS.some((p) => p.id === value);
}

/** Inclusive lower bound ISO string, or null for all-time. */
export function periodStartIso(period: PlatformAnalyticsPeriod, now = new Date()): string | null {
  if (period === "all") return null;
  const start = new Date(now);
  if (period === "7d") start.setDate(start.getDate() - 7);
  else if (period === "30d") start.setDate(start.getDate() - 30);
  else if (period === "90d") start.setDate(start.getDate() - 90);
  else if (period === "12m") start.setFullYear(start.getFullYear() - 1);
  return start.toISOString();
}

export function priorPeriodWindow(
  period: PlatformAnalyticsPeriod,
  now = new Date(),
): { from: string; to: string } | null {
  if (period === "all") return null;
  const currentStart = periodStartIso(period, now);
  if (!currentStart) return null;
  const startMs = new Date(currentStart).getTime();
  const endMs = now.getTime();
  const duration = endMs - startMs;
  return {
    from: new Date(startMs - duration).toISOString(),
    to: currentStart,
  };
}
