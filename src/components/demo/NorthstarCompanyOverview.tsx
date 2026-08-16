"use client";

import { X } from "lucide-react";

import { buildNorthstarOverviewSnapshot } from "@/lib/demo/overview";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function LightKpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-300/50 bg-white/55 px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">{label}</p>
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
  const { metrics } = snapshot;
  const officeCount = snapshot.offices.length;
  const totalHeadcount = snapshot.offices.reduce((sum, office) => sum + office.headcount, 0);

  return (
    <div className={embedded ? "space-y-4 p-4 sm:p-5" : "mx-auto max-w-4xl space-y-4 p-4 sm:p-6"}>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-sky-600 sm:text-3xl">Company overview</h1>
        {embedded && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300/60 bg-white/50 p-2 text-slate-500 hover:text-slate-800"
            aria-label="Close company overview"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-slate-700">{snapshot.company.description}</p>
      <p className="text-xs text-slate-500">
        Founded {snapshot.company.foundedYear} · {officeCount} offices · {totalHeadcount} people across sites
      </p>

      <div className="rounded-xl border border-slate-300/50 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
          Annual revenue 2025
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
          {formatGbp(metrics.annualRevenue2025Gbp)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <LightKpiTile
          label="Revenue growth"
          value={`+${metrics.revenueGrowthSince2023Pct}%`}
          hint="Year-on-year increase · 2023 to present"
        />
        <LightKpiTile
          label="Investment to date"
          value={formatGbp(metrics.investmentToDateGbp)}
          hint="Seed, Series A & growth rounds"
        />
        <LightKpiTile
          label="EBITDA"
          value={formatGbp(metrics.ebitdaGbp)}
          hint="Trailing twelve months · GBP"
        />
      </div>
    </div>
  );
}
