"use client";

import { X } from "lucide-react";

import { buildNorthstarFinancialOverview } from "@/lib/demo/module-fixtures";
import { buildNorthstarOverviewSnapshot } from "@/lib/demo/overview";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function KpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-white sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-white/40">{hint}</p> : null}
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
  const { metrics } = snapshot;
  const officeCount = snapshot.offices.length;
  const totalHeadcount = snapshot.offices.reduce((sum, office) => sum + office.headcount, 0);
  const burnMonthly = financials.monthlyExpenses;
  const grossMarginPct = metrics.actualGmPct;
  const grossMarginTarget = metrics.targetGmPct;

  return (
    <div className={embedded ? "space-y-5 p-4 sm:p-5" : "mx-auto max-w-4xl space-y-5 p-4 sm:p-6"}>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Company overview</h1>
        {embedded && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white"
            aria-label="Close company overview"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-white/70">{snapshot.company.description}</p>
      <p className="text-xs text-white/50">
        Founded {snapshot.company.foundedYear} · {officeCount} offices · {totalHeadcount} people across sites
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiTile label="Offices" value={String(officeCount)} hint={snapshot.offices.map((o) => o.city).join(" · ")} />
        <KpiTile label="Employees" value={String(metrics.employees)} hint="Active headcount" />
        <KpiTile
          label="Annual revenue 2025"
          value={formatGbp(metrics.annualRevenue2025Gbp)}
          hint="Recognised revenue · GBP"
        />
        <KpiTile label="Cash" value={formatGbp(metrics.cashGbp)} hint="Treasury position" />
        <KpiTile
          label="Burn rate"
          value={`${formatGbp(burnMonthly)} / month`}
          hint={`${financials.burnRate.trendLabel} · ${financials.burnRate.runwayMonths} mo runway`}
        />
        <KpiTile
          label="Gross margin"
          value={`${grossMarginPct}%`}
          hint={`Target ${grossMarginTarget}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile
          label="Revenue growth"
          value={`+${metrics.revenueGrowthSince2023Pct}%`}
          hint="Year-on-year increase · 2023 to present"
        />
        <KpiTile
          label="Investment to date"
          value={formatGbp(metrics.investmentToDateGbp)}
          hint="Seed, Series A & growth rounds"
        />
        <KpiTile label="EBITDA" value={formatGbp(metrics.ebitdaGbp)} hint="Trailing twelve months · GBP" />
      </div>
    </div>
  );
}
