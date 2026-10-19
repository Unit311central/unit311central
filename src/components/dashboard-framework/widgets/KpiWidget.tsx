"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { AnimatedCountUp } from "@/components/dashboard-framework/motion/AnimatedCountUp";
import { DashboardReveal } from "@/components/dashboard-framework/motion/DashboardReveal";
import { formatCountUpValue } from "@/components/dashboard-framework/motion/format-count-up";
import { useLivingMotionEnabled } from "@/components/dashboard-framework/motion/living-motion";
import type {
  DashboardKpiItem,
  DashboardKpiRowWidget,
  DashboardKpiTone,
} from "@/lib/dashboard-framework";
import { cn } from "@/lib/utils";
import { widgetShellClass, DASHBOARD_WIDGET_SHELL_ATTR, DASHBOARD_WIDGET_SHELL_VALUE } from "./widget-shell";

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

export function KpiWidget({ kpi, index = 0 }: { kpi: DashboardKpiItem; index?: number }) {
  const motionEnabled = useLivingMotionEnabled();
  const periods = kpi.periods;
  const hasPeriods = Boolean(periods && periods.length > 0);
  const initialPeriodId =
    kpi.defaultPeriodId && periods?.some((period) => period.id === kpi.defaultPeriodId)
      ? kpi.defaultPeriodId
      : periods?.[0]?.id;

  const [periodId, setPeriodId] = useState(initialPeriodId || "");
  const [valuePulse, setValuePulse] = useState(false);

  const active = useMemo(() => {
    if (!periods || periods.length === 0) {
      return {
        label: kpi.label,
        value: kpi.value,
        delta: kpi.delta,
        tone: kpi.tone,
        hint: kpi.hint,
        countUpTarget: kpi.countUpTarget,
      };
    }
    const selected = periods.find((period) => period.id === periodId) ?? periods[0];
    return {
      label: `${kpi.label} · ${selected.label}`,
      value: selected.value,
      delta: selected.delta ?? kpi.delta,
      tone: selected.tone ?? kpi.tone,
      hint: selected.hint ?? kpi.hint,
      countUpTarget: selected.countUpTarget ?? kpi.countUpTarget,
    };
  }, [kpi, periodId, periods]);

  const countUpKind = kpi.countUpKind ?? (kpi.id === "clients" ? "integer" : "compactCurrency");
  const formatValue = useCallback(
    (n: number) => formatCountUpValue(countUpKind, kpi.countUpCurrency, n),
    [countUpKind, kpi.countUpCurrency],
  );

  const showCountUp =
    typeof active.countUpTarget === "number" &&
    Number.isFinite(active.countUpTarget) &&
    active.value !== "—";

  return (
    <DashboardReveal index={index}>
      <motion.div
        {...{ [DASHBOARD_WIDGET_SHELL_ATTR]: DASHBOARD_WIDGET_SHELL_VALUE }}
        className={cn(
          widgetShellClass("px-3 py-3.5 transition-shadow duration-300"),
          motionEnabled && "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.28)]",
        )}
        whileHover={motionEnabled ? { y: -2 } : undefined}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      >
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
              onChange={(event) => {
                setPeriodId(event.target.value);
                setValuePulse(true);
                window.setTimeout(() => setValuePulse(false), 600);
              }}
              className="max-w-[7.5rem] shrink-0 rounded-md border border-white/10 bg-[#0b1524] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 outline-none transition-colors focus:border-sky-400/40"
            >
              {periods!.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <motion.p
          className={cn(
            "mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-white",
            valuePulse && motionEnabled && "text-cyan-100",
          )}
          animate={valuePulse && motionEnabled ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          {showCountUp ? (
            <AnimatedCountUp
              key={`${kpi.id}-${periodId}-${active.countUpTarget}`}
              target={active.countUpTarget!}
              format={formatValue}
              suffix={kpi.countUpSuffix ?? ""}
            />
          ) : (
            active.value
          )}
        </motion.p>
        {active.delta ? (
          <p className={cn("mt-1 text-[11px]", toneClass(active.tone))}>{active.delta}</p>
        ) : active.hint ? (
          <p className="mt-1 text-[11px] text-white/35">{active.hint}</p>
        ) : null}
      </motion.div>
    </DashboardReveal>
  );
}

export default function KpiRowWidget({ widget }: { widget: DashboardKpiRowWidget }) {
  const count = widget.kpis.length;
  const gridClass =
    count > 4
      ? "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      : "grid grid-cols-2 gap-3 xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {widget.kpis.map((kpi, index) => (
        <KpiWidget key={kpi.id} kpi={kpi} index={index} />
      ))}
    </div>
  );
}
