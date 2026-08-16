"use client";

import {
  formatNorthstarGbp,
  NORTHSTAR_ASSET_KPIS,
} from "@/lib/demo/northstar-operations-data";

function KpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

export default function NorthstarAssetKpiBar() {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <KpiTile
        label="Total value"
        value={formatNorthstarGbp(NORTHSTAR_ASSET_KPIS.totalValueGbp)}
        hint="Registered asset book value"
      />
      <KpiTile
        label="Total number"
        value={String(NORTHSTAR_ASSET_KPIS.totalCount)}
        hint="Plant, fleet, and IT assets"
      />
      <KpiTile
        label="Depreciation value"
        value={formatNorthstarGbp(NORTHSTAR_ASSET_KPIS.depreciationValueGbp)}
        hint="Accumulated depreciation YTD"
      />
    </section>
  );
}
