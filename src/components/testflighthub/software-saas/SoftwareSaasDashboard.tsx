"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

import type { SoftwareSaasDashboard } from "@/lib/software-billing/dashboard-model";
import { cn } from "@/lib/utils";

import SoftwareProviderBillingRow from "./SoftwareProviderBillingRow";
import {
  ActualSpendBlock,
  ProjectedSpendBlock,
  SpendToDateBlock,
  formatSaasMoney,
} from "./SoftwareSaasMetricBlocks";

function formatWhen(iso: string | null) {
  if (!iso) return "Never";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function SummaryTile({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/**
 * Generic Software & SaaS dashboard:
 * 1) LAST MONTH / UPCOMING / SPEND TO DATE
 * 2) one reusable row per provider
 */
export default function SoftwareSaasDashboard({
  dashboard,
  loading,
  syncing,
  error,
  onSync,
}: {
  dashboard: SoftwareSaasDashboard | null;
  loading?: boolean;
  syncing?: boolean;
  error?: string | null;
  onSync?: () => void;
}) {
  const summary = dashboard?.summary;
  const stale = summary?.syncStatus === "error" || Boolean(summary?.syncError);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Software &amp; SaaS</h2>
          <p className="mt-0.5 text-[11px] text-white/45">
            Last successful sync: {formatWhen(summary?.lastSuccessfulSyncAt ?? null)}
          </p>
        </div>
        {onSync ? (
          <button
            type="button"
            onClick={onSync}
            disabled={syncing || loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-medium text-white hover:bg-white/[0.1] disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync now
          </button>
        ) : null}
      </div>

      {error || stale ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {error ??
              summary?.syncError ??
              "Billing sync is stale. Showing the last successful data."}
          </span>
        </p>
      ) : null}

      {loading && !dashboard ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Software &amp; SaaS dashboard…
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <SummaryTile label="Last month">
              <ActualSpendBlock spend={summary.lastMonth} />
            </SummaryTile>
            <SummaryTile label="Upcoming">
              <ProjectedSpendBlock spend={summary.upcoming} />
            </SummaryTile>
            <SummaryTile label="Spend to date">
              <SpendToDateBlock spend={summary.spendToDate} />
            </SummaryTile>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                Providers
              </p>
              <p className="text-[11px] text-white/40">
                Connected actual last month:{" "}
                {formatSaasMoney(summary.lastMonth.total, summary.currency)}
              </p>
            </div>
            <div className="space-y-3">
              {(dashboard?.providers ?? []).map((row) => (
                <SoftwareProviderBillingRow key={row.slug} row={row} />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
