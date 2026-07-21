"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarRange } from "lucide-react";

import { engStatusClass, type EngEngineer } from "@/lib/engineering-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";
import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";
import { useEngineeringMockStore } from "./useEngineeringMockStore";
import {
  WsEmpty,
  WsKpiTile,
  WsSection,
  WsStatusPill,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
} from "./domain-workspace-ui";

type PeriodMode = "weekly" | "monthly" | "quarterly";

function periodLabels(mode: PeriodMode): string[] {
  if (mode === "weekly") return ["W28", "W29", "W30", "W31", "W32"];
  if (mode === "monthly") return ["Jul", "Aug", "Sep", "Oct", "Nov"];
  return ["Q2 '26", "Q3 '26", "Q4 '26", "Q1 '27"];
}

function seededAllocation(engineer: EngEngineer, periodIndex: number, mode: PeriodMode): number {
  const seed = engineer.id.charCodeAt(engineer.id.length - 1) + periodIndex * 11;
  const drift = mode === "weekly" ? 8 : mode === "monthly" ? 15 : 20;
  const base = engineer.allocationPct;
  const variance = ((seed * 7) % (drift * 2 + 1)) - drift;
  return Math.min(110, Math.max(0, base + variance));
}

function allocationCellClass(pct: number): string {
  if (pct >= 100) return "bg-rose-500/75 text-rose-50";
  if (pct >= 85) return "bg-amber-500/65 text-amber-50";
  if (pct >= 60) return "bg-sky-500/55 text-sky-50";
  if (pct >= 30) return "bg-emerald-500/40 text-emerald-50";
  return "bg-white/10 text-white/50";
}

function avgUtilisation(engineers: EngEngineer[]) {
  if (!engineers.length) return 0;
  return Math.round(engineers.reduce((sum, e) => sum + e.allocationPct, 0) / engineers.length);
}

export default function EngineeringCapacityWorkspace() {
  const basePath = useInternalOperationsBasePath();
  const store = useEngineeringMockStore();
  const [mode, setMode] = useState<PeriodMode>("weekly");

  const periods = useMemo(() => periodLabels(mode), [mode]);
  const engineers = store.engineers;

  const summary = useMemo(() => {
    const overallocated = engineers.filter((e) => e.allocationPct >= 100 || e.status === "Overloaded");
    const available = engineers.filter(
      (e) => e.status === "Available" || parseInt(e.availability, 10) >= 40,
    );
    const onLeave = engineers.filter((e) => e.status === "On Leave");
    const billableAvg = engineers.length
      ? Math.round(engineers.reduce((sum, e) => sum + e.billablePct, 0) / engineers.length)
      : 0;
    return {
      avgUtil: avgUtilisation(engineers),
      overallocated: overallocated.length,
      available: available.length,
      onLeave: onLeave.length,
      billableAvg,
      overallocatedList: overallocated,
      availableList: available,
    };
  }, [engineers]);

  const forecastNotes = useMemo(() => {
    const notes: string[] = [];
    for (const engineer of engineers) {
      if (engineer.leave !== "None" && engineer.leave.toLowerCase().includes("next")) {
        notes.push(`${engineer.name} — ${engineer.leave}; plan backfill for ${engineer.currentProject}.`);
      }
      if (engineer.availability !== "0%" && parseInt(engineer.availability, 10) >= 50) {
        notes.push(`${engineer.name} has ${engineer.availability} capacity for ${mode === "weekly" ? "this sprint" : "upcoming periods"}.`);
      }
    }
    if (summary.overallocatedList.length) {
      notes.unshift(
        `${summary.overallocatedList.length} engineer(s) over 100% — rebalance before next ${mode === "quarterly" ? "quarter" : "cycle"}.`,
      );
    }
    return notes.slice(0, 6);
  }, [engineers, mode, summary.overallocatedList.length]);

  const modeButtons: { id: PeriodMode; label: string }[] = [
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "quarterly", label: "Quarterly" },
  ];

  return (
    <div className="space-y-5">
      <WsSection
        title="Capacity Horizon"
        subtitle="Allocation intensity across engineers and time."
        actions={
          <div className="flex flex-wrap gap-2">
            {modeButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setMode(btn.id)}
                className={cn(
                  "inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition-colors",
                  mode === btn.id
                    ? "border-sky-400/50 bg-sky-500/20 text-sky-100"
                    : "border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]",
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        }
      >
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <WsKpiTile label="Avg Utilisation" value={`${summary.avgUtil}%`} />
          <WsKpiTile label="Overallocated" value={summary.overallocated} hint="At or above 100%" />
          <WsKpiTile label="Available Capacity" value={summary.available} />
          <WsKpiTile label="On Leave" value={summary.onLeave} />
          <WsKpiTile label="Avg Billable" value={`${summary.billableAvg}%`} />
        </section>
      </WsSection>

      <WsSection title="Utilisation Heatmap" subtitle={`Engineers × ${mode} periods — darker cells indicate higher allocation.`}>
        {engineers.length === 0 ? (
          <WsEmpty message="No engineers to display in the capacity grid." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-1 text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[140px] rounded-lg bg-[#0b1524] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                    Engineer
                  </th>
                  {periods.map((period) => (
                    <th
                      key={period}
                      className="min-w-[52px] px-1 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/45"
                    >
                      {period}
                    </th>
                  ))}
                  <th className="min-w-[56px] px-2 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                    Now
                  </th>
                </tr>
              </thead>
              <tbody>
                {engineers.map((engineer) => (
                  <tr key={engineer.id}>
                    <td className="sticky left-0 z-10 rounded-lg border border-white/10 bg-[#0b1524]/95 px-3 py-2">
                      <p className="truncate text-sm font-medium text-white">{engineer.name}</p>
                      <p className="truncate text-[11px] text-white/45">{engineer.role}</p>
                    </td>
                    {periods.map((period, index) => {
                      const pct = seededAllocation(engineer, index, mode);
                      return (
                        <td key={`${engineer.id}-${period}`} className="p-0.5">
                          <div
                            title={`${engineer.name} · ${period}: ${pct}%`}
                            className={cn(
                              "flex h-10 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums",
                              allocationCellClass(pct),
                            )}
                          >
                            {pct}%
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-0.5">
                      <div
                        className={cn(
                          "flex h-10 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums",
                          allocationCellClass(engineer.allocationPct),
                        )}
                      >
                        {engineer.allocationPct}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WsSection>

      <div className="grid gap-5 xl:grid-cols-2">
        <WsSection title="Overallocated Engineers" subtitle="Requires rebalancing or scope reduction.">
          {summary.overallocatedList.length === 0 ? (
            <WsEmpty message="No engineers are currently overallocated." />
          ) : (
            <ul className="space-y-2">
              {summary.overallocatedList.map((engineer) => (
                <li
                  key={engineer.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{engineer.name}</p>
                    <p className="text-xs text-white/45">
                      {engineer.currentProject} · {engineer.allocationPct}%
                    </p>
                  </div>
                  <WsStatusPill className={engStatusClass(engineer.status)}>{engineer.status}</WsStatusPill>
                </li>
              ))}
            </ul>
          )}
        </WsSection>

        <WsSection title="Available Engineers" subtitle="Ready for new assignment.">
          {summary.availableList.length === 0 ? (
            <WsEmpty message="No engineers with meaningful spare capacity." />
          ) : (
            <ul className="space-y-2">
              {summary.availableList.map((engineer) => (
                <li
                  key={engineer.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{engineer.name}</p>
                    <p className="text-xs text-white/45">
                      {engineer.skills.slice(0, 3).join(", ")} · {engineer.availability} free
                    </p>
                  </div>
                  <WsStatusPill className={engStatusClass(engineer.status)}>{engineer.availability}</WsStatusPill>
                </li>
              ))}
            </ul>
          )}
        </WsSection>
      </div>

      <WsSection
        title="Forecast Availability"
        subtitle="Planning notes derived from leave and spare capacity."
        actions={
          <Link href={getInternalNavHref("engineering-resources", basePath)} className={WsSecondaryButtonClass()}>
            Resources
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {forecastNotes.length === 0 ? (
          <WsEmpty message="No forecast notes — capacity looks stable." />
        ) : (
          <ul className="space-y-2">
            {forecastNotes.map((note) => (
              <li
                key={note}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80"
              >
                <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-sky-300/80" />
                {note}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={getInternalNavHref("hr-leave", basePath)} className={WsPrimaryButtonClass()}>
            Leave Calendar
          </Link>
          <Link href={getInternalNavHref("projects", basePath)} className={WsSecondaryButtonClass()}>
            Projects
          </Link>
        </div>
      </WsSection>
    </div>
  );
}
