"use client";

import type { SoftwareSaasProviderBillingRow } from "@/lib/software-billing/dashboard-model";
import { cn } from "@/lib/utils";

import {
  ActualSpendBlock,
  AllowanceUsageBlock,
  ProjectedSpendBlock,
  SpendToDateBlock,
} from "./SoftwareSaasMetricBlocks";

const STATUS_LABEL: Record<SoftwareSaasProviderBillingRow["connectionStatus"], string> = {
  connected: "Connected",
  planned: "Planned",
  not_configured: "Not configured",
  error: "Error",
};

const STATUS_TONE: Record<SoftwareSaasProviderBillingRow["connectionStatus"], string> = {
  connected: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  planned: "border-white/15 bg-white/[0.04] text-white/55",
  not_configured: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  error: "border-rose-400/30 bg-rose-500/10 text-rose-100",
};

/**
 * Reusable provider billing row — same layout for every Software & SaaS provider.
 * Do not put provider-specific chrome here; pass data through the generic model.
 */
export default function SoftwareProviderBillingRow({
  row,
}: {
  row: SoftwareSaasProviderBillingRow;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-white">
            {row.displayName}
          </h3>
          {row.planLabel ? (
            <p className="mt-0.5 text-[11px] text-white/45">{row.planLabel}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            STATUS_TONE[row.connectionStatus],
          )}
        >
          {STATUS_LABEL[row.connectionStatus]}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AllowanceUsageBlock state={row.allowanceUsage} />
        <ActualSpendBlock title="Last month" spend={row.lastMonth} compact />
        <ProjectedSpendBlock title="Upcoming" spend={row.upcoming} compact />
        <SpendToDateBlock title="Spend to date" spend={row.spendToDate} compact />
      </div>
    </article>
  );
}
