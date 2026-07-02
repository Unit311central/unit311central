"use client";

import { cn } from "@/lib/utils";
import { useDashboardData } from "./dashboard-data-context";

const ACCENT_GLOW = {
  blue: "shadow-[0_0_20px_rgba(59,130,246,0.12)] border-blue-500/10",
  emerald: "shadow-[0_0_20px_rgba(16,185,129,0.12)] border-emerald-500/10",
  cyan: "shadow-[0_0_20px_rgba(6,182,212,0.12)] border-cyan-500/10",
  amber: "shadow-[0_0_20px_rgba(245,158,11,0.12)] border-amber-500/10",
} as const;

export default function KPIGrid() {
  const { kpiMetrics } = useDashboardData();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:flex lg:gap-3">
      {kpiMetrics.map((metric) => (
        <div
          key={metric.label}
          className={cn(
            "group relative min-w-0 flex-1 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0D1B2A]/80 px-3 py-2.5 transition-colors hover:border-white/[0.12] sm:px-4 sm:py-3",
            ACCENT_GLOW[metric.accent]
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <p className="relative font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {metric.value}
          </p>
          <p className="relative mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
            {metric.label}
          </p>
        </div>
      ))}
    </div>
  );
}
