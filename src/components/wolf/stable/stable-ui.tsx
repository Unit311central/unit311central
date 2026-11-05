"use client";

import type { SurveyOperationsBasePath } from "@/lib/survey-operations-mock-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { wolfCardClass, wolfMetricLabelClass } from "@/components/wolf/wolf-ui";
import {
  parseStableFacilityTab,
  type StableFacilityTab,
} from "@/lib/wolf/stable/facility-tabs";
import type { StableFacility, StableHorse } from "@/lib/wolf/stable/demo-data";
import { cn } from "@/lib/utils";

export const STABLE_FACILITY_QUERY = "facility";
export const STABLE_TAB_QUERY = "tab";
export const STABLE_HORSE_QUERY = "horse";

export const NOT_IN_DEMONSTRATION = "Not in this demonstration";

export function stableDirectoryHref(basePath: SurveyOperationsBasePath) {
  return getInternalNavHref("wolf-stable", basePath);
}

export function stablePortfolioHref(basePath: SurveyOperationsBasePath) {
  return getInternalNavHref("wolf-stable-overview", basePath);
}

export function stableFacilityHref(
  basePath: SurveyOperationsBasePath,
  facilityId: string,
  tab: StableFacilityTab = "overview",
  horseId?: string | null,
) {
  const query: Record<string, string> = {
    [STABLE_FACILITY_QUERY]: facilityId,
    [STABLE_TAB_QUERY]: tab,
  };
  if (horseId) query[STABLE_HORSE_QUERY] = horseId;
  return getInternalNavHref("wolf-stable-facility", basePath, query);
}

export function facilityTabFromSearch(value: string | null): StableFacilityTab {
  return parseStableFacilityTab(value);
}

export function statusLabel(status: StableFacility["status"]): string {
  if (status === "operational") return "Operational";
  if (status === "attention") return "Attention";
  return "Closed";
}

export function horseStatusLabel(status: StableHorse["status"]): string {
  if (status === "in-stable") return "In stable";
  if (status === "turned-out") return "Turned out";
  return "Attention";
}

export async function toggleFullscreen(element: Element | null) {
  if (!(element instanceof HTMLElement)) return;
  if (document.fullscreenElement === element) {
    await document.exitFullscreen().catch(() => undefined);
    return;
  }
  await element.requestFullscreen().catch(() => undefined);
}

export function DemonstrationMark({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
      {children}
    </span>
  );
}

export function Metric({
  label,
  value,
  hint,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div className={`${wolfCardClass} px-4 py-3`}>
      <p className={wolfMetricLabelClass}>{label}</p>
      <p className={cn("mt-1 font-semibold tracking-tight text-white", compact ? "text-lg leading-snug" : "text-2xl")}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

export function EmptyNote({ children }: { children: string }) {
  return <p className="text-sm text-white/55">{children}</p>;
}
