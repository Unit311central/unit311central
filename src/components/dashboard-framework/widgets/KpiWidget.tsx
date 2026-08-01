"use client";

import { useMemo, useState } from "react";

import type {
  DashboardKpiItem,
  DashboardKpiRowWidget,
  DashboardKpiTone,
} from "@/lib/dashboard-framework";
import { cn } from "@/lib/utils";
import { widgetShellClass } from "./widget-shell";

function toneClass(tone: DashboardKpiTone | undefined) {
  switch (tone) {
    case "positive":
      return "text-emerald-300";
    case "warning":
      return "text-amber-200";
    case "critical":
      return "text-rose-300";
    default:
      return "text-white/45";
  }
}

export function KpiWidget({ kpi }: { kpi: DashboardKpiItem }) {
  const periods = kpi.periods;
  const hasPeriods = Boolean(periods && periods.length > 0);
  const initialPeriodId =
    kpi.defaultPeriodId && periods?.some((period) => period.id === kpi.defaultPeriodId)
      ? kpi.defaultPeriodId
      : periods?.[0]?.id;

  const [periodId, setPeriodId] = useState(initialPeriodId || "");

  const active = useMemo(() => {
    if (!periods || periods.length === 0) {
      return {
        label: kpi.label,
        value: kpi.value,
        delta: kpi.delta,
        tone: kpi.tone,
        hint: kpi.hint,
      };
    }
    const selected = periods.find((period) => period.id === periodId) ?? periods[0];
    return {
      label: `${kpi.label} · ${selected.label}`,
      value: selected.value,
      delta: selected.delta ?? kpi.delta,
      tone: selected.tone ?? kpi.tone,
      hint: selected.hint ?? kpi.hint,
    };
  }, [kpi, periodId, periods]);

  return (
    <div className={widgetShellClass("px-3 py-3.5")}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[11px] font-medium text-white/45">{active.label}</p>
        {hasPeriods ? (
          <label className="sr-only" htmlFor={`kpi-period-${kpi.id}`}>
            {kpi.label} period
          </label>
        ) : null}
        {hasPeriods ? (
          <select
            id={`kpi-period-${kpi.id}`}
            value={periodId}
            onChange={(event) => setPeriodId(event.target.value)}
            className="max-w-[7.5rem] shrink-0 rounded-md border border-white/10 bg-[#0b1524] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 outline-none focus:border-sky-400/40"
          >
            {periods!.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white">
        {active.value}
      </p>
      {active.delta ? (
        <p className={cn("mt-1 text-[11px]", toneClass(active.tone))}>{active.delta}</p>
      ) : active.hint ? (
        <p className="mt-1 text-[11px] text-white/35">{active.hint}</p>
      ) : null}
    </div>
  );
}

export default function KpiRowWidget({ widget }: { widget: DashboardKpiRowWidget }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {widget.kpis.map((kpi) => (
        <KpiWidget key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
