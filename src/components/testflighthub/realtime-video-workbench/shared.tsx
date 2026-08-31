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

export function largeMetricTile(label: string, value: string, sub?: string) {
  return (
    <div className="rounded-2xl border border-sky-400/25 bg-gradient-to-b from-sky-500/10 to-transparent px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200/70">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{value}</p>
      {sub ? <p className="mt-2 text-sm text-white/50">{sub}</p> : null}
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

/** Top-level workbench navigation — every feature must map to one of these tabs. */
export const WORKBENCH_TABS = [
  { id: "overview", label: "Overview", description: "Live engineering summary tiles" },
  { id: "pipeline", label: "Master Pipeline", description: "58-stage latency model & CRUD" },
  { id: "flight", label: "Flight Scenarios", description: "Schedule, aircraft, connectivity" },
  { id: "missions", label: "Mission Profiles", description: "Compute intensity per mission" },
  { id: "video", label: "Video & Bandwidth", description: "Bitrate, GB/TB, contention" },
  { id: "cost", label: "Cost Calculator", description: "WOLF vs Safari · 1–24 months" },
  { id: "latency", label: "Latency & Success", description: "Performance & PASS/FAIL criteria" },
  { id: "architectures", label: "Living Architectures", description: "Dynamic pipeline views" },
  { id: "assumptions", label: "Assumptions", description: "Reference data register" },
  { id: "test-runs", label: "Test Runs", description: "Measured field telemetry" },
  { id: "failure", label: "Failure & Resilience", description: "Failure modes & recovery" },
  { id: "architecture-options", label: "Architecture Options", description: "Cloud / edge / on-site" },
] as const;

export type WorkbenchTabId = (typeof WORKBENCH_TABS)[number]["id"];
