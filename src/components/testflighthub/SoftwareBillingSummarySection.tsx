"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";

import { formatSoftwareMoney } from "@/lib/software-assets-data";
import type { SoftwareBillingSummary } from "@/lib/software-billing/types";
import { cn } from "@/lib/utils";
import { isInternalDomainHost } from "@/lib/app-domains";

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

function DeltaBadge({
  amount,
  percent,
  direction,
  currency,
}: {
  amount: number;
  percent: number | null;
  direction: SoftwareBillingSummary["overall"]["deltaDirection"];
  currency: string;
}) {
  const Icon = direction === "down" ? TrendingDown : direction === "up" ? TrendingUp : null;
  const tone =
    direction === "up"
      ? "text-amber-100 border-amber-400/30 bg-amber-500/10"
      : direction === "down"
        ? "text-emerald-100 border-emerald-400/30 bg-emerald-500/10"
        : "text-white/70 border-white/15 bg-white/[0.04]";

  return (
    <div className={cn("mt-2 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px]", tone)}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span>
        {formatSoftwareMoney(Math.abs(amount), currency)}
        {percent != null ? ` (${percent > 0 ? "+" : ""}${percent}%)` : ""}
      </span>
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  projected,
}: {
  label: string;
  value: string;
  hint?: string;
  projected?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      {projected ? (
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-200/80">
          Projected estimate
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-[11px] text-white/45">{hint}</p> : null}
    </div>
  );
}

export default function SoftwareBillingSummarySection() {
  const [enabled, setEnabled] = useState(false);
  const [summary, setSummary] = useState<SoftwareBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/software-billing/summary", { cache: "no-store" });
      const data = (await response.json()) as { summary?: SoftwareBillingSummary; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to load billing summary");
      setSummary(data.summary ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load billing summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    if (!isInternalDomainHost(host)) {
      setEnabled(false);
      setLoading(false);
      return;
    }
    setEnabled(true);
    void load();
  }, [load]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/software-billing/vercel/sync", {
        method: "POST",
      });
      const data = (await response.json()) as {
        summary?: SoftwareBillingSummary;
        result?: { ok?: boolean; error?: string };
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Sync failed");
      if (data.result && !data.result.ok) {
        throw new Error(data.result.error ?? "Sync failed");
      }
      setSummary(data.summary ?? null);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (!enabled) return null;

  const currency = summary?.currency ?? "USD";
  const money = (amount: number) => formatSoftwareMoney(amount, currency);
  const stale = summary?.syncStatus === "error" || Boolean(summary?.syncError);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Software cost summary</h2>
          <p className="mt-0.5 text-[11px] text-white/45">
            Last successful sync: {formatWhen(summary?.lastSuccessfulSyncAt ?? null)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing || loading}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs font-medium text-white hover:bg-white/[0.1] disabled:opacity-50"
        >
          {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Sync now
        </button>
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

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading billing summary…
        </div>
      ) : summary ? (
        <>
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
              Overall software
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Tile
                label="Total software cost"
                value={money(summary.overall.totalSoftwareCostMonthly)}
                hint="Live providers + manual register"
              />
              <Tile
                label="Last month spend"
                value={money(summary.overall.lastMonthSpend)}
                hint="Completed billing actuals"
              />
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">
                  Upcoming
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {money(summary.overall.upcoming)}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-200/80">
                  Includes projected estimates
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">
                  Delta
                </p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {money(summary.overall.deltaAmount)}
                </p>
                <DeltaBadge
                  amount={summary.overall.deltaAmount}
                  percent={summary.overall.deltaPercent}
                  direction={summary.overall.deltaDirection}
                  currency={currency}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
              Vercel
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Tile
                label="Vercel — last month"
                value={money(summary.vercel.lastMonth)}
                hint="Previous completed billing period"
              />
              <Tile
                label="Vercel — upcoming"
                value={money(summary.vercel.upcomingProjected)}
                projected
                hint="Not a finalized invoice"
              />
              <Tile
                label="Vercel — current spend"
                value={money(summary.vercel.currentSpend)}
                projected
                hint="Current billing period to date"
              />
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

export function useSoftwareBillingSummary(enabled: boolean) {
  const [summary, setSummary] = useState<SoftwareBillingSummary | null>(null);

  useEffect(() => {
    if (!enabled) return;
    void fetch("/api/internal/software-billing/summary", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { summary?: SoftwareBillingSummary }) => setSummary(data.summary ?? null))
      .catch(() => undefined);
  }, [enabled]);

  return summary;
}
