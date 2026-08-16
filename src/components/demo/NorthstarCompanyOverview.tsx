"use client";

import { X } from "lucide-react";

import { buildNorthstarOverviewSnapshot } from "@/lib/demo/overview";
import { buildNorthstarFinancialOverview } from "@/lib/demo/module-fixtures";
import { CorporateKpiTile } from "@/components/testflighthub/corporate-ui";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

type NorthstarCompanyOverviewProps = {
  onClose?: () => void;
  embedded?: boolean;
};

export default function NorthstarCompanyOverview({ onClose, embedded }: NorthstarCompanyOverviewProps) {
  const snapshot = buildNorthstarOverviewSnapshot();
  const financials = buildNorthstarFinancialOverview();
  const burnMonthly = financials.burnRate.monthly;
  const officeCount = snapshot.offices.length;
  const totalHeadcount = snapshot.offices.reduce((sum, office) => sum + office.headcount, 0);

  return (
    <div className={embedded ? "space-y-6" : "mx-auto max-w-3xl space-y-6 p-4 sm:p-6"}>
      {!embedded ? null : (
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-300/80">
              Company overview
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">{snapshot.company.tradingName}</h2>
          </div>
          {onClose ? (
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
      )}

      <header className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-950/40 to-[#07111f] p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-300/80">Northstar Industrial Technologies</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{snapshot.company.tradingName}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{snapshot.company.description}</p>
        <p className="mt-3 text-xs text-white/50">
          Founded {snapshot.company.foundedYear} · {officeCount} offices · {totalHeadcount} people across sites
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CorporateKpiTile label="Offices" value={String(officeCount)} hint={snapshot.offices.map((o) => o.city).join(" · ")} />
        <CorporateKpiTile label="Employees" value={String(snapshot.metrics.employees)} hint="Active headcount" />
        <CorporateKpiTile label="ARR" value={formatGbp(snapshot.metrics.arrGbp)} hint="Annual recurring revenue" />
        <CorporateKpiTile label="Cash" value={formatGbp(snapshot.metrics.cashGbp)} hint="Treasury position" />
        <CorporateKpiTile
          label="Burn rate"
          value={formatGbp(burnMonthly)}
          hint={`${financials.burnRate.trendLabel} · ${financials.burnRate.runwayMonths} mo runway`}
        />
        <CorporateKpiTile
          label="Gross margin"
          value={`${snapshot.metrics.actualGmPct}%`}
          hint={`Target ${snapshot.metrics.targetGmPct}%`}
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/45">Office footprint</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/75">
          {snapshot.offices.map((office) => (
            <li key={office.city} className="flex justify-between gap-4 border-b border-white/5 pb-2 last:border-0">
              <span>
                {office.city}, {office.country}
              </span>
              <span className="tabular-nums text-white/50">{office.headcount} FTE</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
