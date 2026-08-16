"use client";

import { X } from "lucide-react";

import { buildNorthstarOverviewSnapshot } from "@/lib/demo/overview";
import { buildNorthstarFinancialOverview } from "@/lib/demo/module-fixtures";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function LightKpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-300/80 bg-white px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}

type NorthstarCompanyOverviewProps = {
  onClose?: () => void;
  embedded?: boolean;
};

export default function NorthstarCompanyOverview({ onClose, embedded }: NorthstarCompanyOverviewProps) {
  const snapshot = buildNorthstarOverviewSnapshot();
  const financials = buildNorthstarFinancialOverview();
  const burnMonthly = financials.monthlyExpenses;
  const officeCount = snapshot.offices.length;
  const totalHeadcount = snapshot.offices.reduce((sum, office) => sum + office.headcount, 0);

  return (
    <div
      className={
        embedded
          ? "space-y-4 bg-[#e8eaed] p-4 sm:p-5"
          : "mx-auto max-w-4xl space-y-4 bg-[#e8eaed] p-4 sm:p-6"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-sky-600 sm:text-3xl">Company overview</h1>
        {embedded && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:text-slate-800"
            aria-label="Close company overview"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-slate-600">{snapshot.company.description}</p>
      <p className="text-xs text-slate-500">
        Founded {snapshot.company.foundedYear} · {officeCount} offices · {totalHeadcount} people across sites
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <LightKpiTile label="Offices" value={String(officeCount)} hint={snapshot.offices.map((o) => o.city).join(" · ")} />
        <LightKpiTile label="Employees" value={String(snapshot.metrics.employees)} hint="Active headcount" />
        <LightKpiTile label="ARR" value={formatGbp(snapshot.metrics.arrGbp)} hint="Annual recurring revenue" />
        <LightKpiTile label="Cash" value={formatGbp(snapshot.metrics.cashGbp)} hint="Treasury position" />
        <LightKpiTile
          label="Burn rate"
          value={`${formatGbp(burnMonthly)} / month`}
          hint={`${financials.burnRate.trendLabel} · ${financials.burnRate.runwayMonths} mo runway`}
        />
        <LightKpiTile
          label="Gross margin"
          value={`${snapshot.metrics.actualGmPct}%`}
          hint={`Target ${snapshot.metrics.targetGmPct}%`}
        />
      </div>

      <section className="rounded-xl border border-slate-300/80 bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Office footprint</h2>
        <ul className="mt-2 space-y-2">
          {snapshot.offices.map((office) => (
            <li
              key={office.city}
              className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 text-sm last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-800">
                  {office.leaderName} · {office.city}
                </p>
                <p className="text-xs text-slate-500">
                  {office.leaderTitle} — {snapshot.company.tradingName}
                </p>
              </div>
              <span className="shrink-0 tabular-nums text-xs text-slate-500">{office.headcount} FTE</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
