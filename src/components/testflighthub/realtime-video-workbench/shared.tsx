import { cn } from "@/lib/utils";
import type { ContentionStatus, CriterionStatus } from "@/lib/realtime-video-pipeline/workbench-types";

export function contentionTone(status: ContentionStatus) {
  if (status === "GREEN") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "AMBER") return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-rose-400/30 bg-rose-500/15 text-rose-100";
}

export function criterionTone(status: CriterionStatus) {
  if (status === "PASS") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "WARNING") return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  if (status === "FAIL") return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  return "border-white/10 bg-white/5 text-slate-300";
}

export function metricTile(label: string, value: string, sub?: string, className?: string) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-white/45">{sub}</p> : null}
    </div>
  );
}

export function fmtUsd(value: number | null | undefined) {
  if (value == null) return "TBD";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function fmtNum(value: number | null | undefined, digits = 2) {
  if (value == null) return "TBD";
  return value.toFixed(digits);
}

export const WORKBENCH_TABS = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Master Pipeline" },
  { id: "flight", label: "Flight Scenarios" },
  { id: "cost", label: "Cost Model" },
  { id: "performance", label: "Performance" },
  { id: "criteria", label: "Success Criteria" },
  { id: "architectures", label: "Living Architectures" },
  { id: "compare", label: "Compare" },
  { id: "assumptions", label: "Assumptions" },
] as const;

export type WorkbenchTabId = (typeof WORKBENCH_TABS)[number]["id"];
