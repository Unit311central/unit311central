"use client";

import { useMemo, useState } from "react";

import {
  formatNorthstarGbp,
  getNorthstarLogisticsKpis,
  type LogisticsLatePeriodMonths,
} from "@/lib/demo/northstar-operations-data";
import { getLogisticsMockShipments } from "@/lib/logistics-data";
const PERIOD_OPTIONS: Array<{ months: LogisticsLatePeriodMonths; label: string }> = [
  { months: 1, label: "Last month" },
  { months: 3, label: "Last 3 months" },
  { months: 6, label: "Last 6 months" },
  { months: 12, label: "Last 12 months" },
];

export default function NorthstarLogisticsKpiBar() {
  const [periodMonths, setPeriodMonths] = useState<LogisticsLatePeriodMonths>(3);
  const shipments = useMemo(() => getLogisticsMockShipments(), []);
  const kpis = useMemo(
    () => getNorthstarLogisticsKpis(shipments, periodMonths),
    [shipments, periodMonths],
  );

  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Courier performance</h2>
          <p className="mt-1 text-xs text-white/45">In-transit packages and on-time delivery</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/55">
          <span className="text-[10px] uppercase tracking-[0.12em] text-white/40">Period</span>
          <select
            value={periodMonths}
            onChange={(e) => setPeriodMonths(Number(e.target.value) as LogisticsLatePeriodMonths)}
            className="rounded-lg border border-white/15 bg-[#0b1524] px-2 py-1.5 text-xs text-white outline-none focus:border-sky-400/40"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.months} value={opt.months}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-200/80">Inbound in transit</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{kpis.inboundInTransit}</p>
        </div>
        <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-sky-200/80">Outbound in transit</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{kpis.outboundInTransit}</p>
        </div>
        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-amber-200/80">Failed on-time</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{kpis.lateDeliveryPct}%</p>
          <p className="mt-0.5 text-[10px] text-amber-100/60">
            {PERIOD_OPTIONS.find((o) => o.months === periodMonths)?.label}
          </p>
        </div>
        <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-violet-200/80">Avg courier / package</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
            {formatNorthstarGbp(kpis.avgCourierSpendPerPackageGbp, 2)}
          </p>
        </div>
      </div>
    </section>
  );
}
