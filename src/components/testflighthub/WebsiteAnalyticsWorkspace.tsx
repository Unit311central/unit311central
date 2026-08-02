"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";

import type { WebsiteAnalyticsSummary } from "@/lib/website-analytics/service";
import { cn } from "@/lib/utils";
import { TqmsSection } from "./tqms-ui";

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

function RankTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="border-t border-white/8 text-white/55">
              <td className="px-3 py-6" colSpan={headers.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="border-t border-white/8 text-white/80">
                {row.map((cell, i) => (
                  <td
                    key={`${i}-${cell}`}
                    className={cn("px-3 py-2.5", i === 0 ? "font-medium text-white" : "tabular-nums")}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function WebsiteAnalyticsWorkspace() {
  const [summary, setSummary] = useState<WebsiteAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/website-analytics/summary", { cache: "no-store" });
      const data = (await response.json()) as WebsiteAnalyticsSummary & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to load website analytics.");
      setSummary(data);
    } catch (loadError) {
      setSummary(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load website analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshClarity() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/website-analytics/refresh", { method: "POST" });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Clarity refresh failed.");
      await load();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Clarity refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Website Analytics</h1>
          <p className="mt-1 max-w-3xl text-sm text-white/55">
            Public marketing site performance for unit311central.com — Clarity behaviour data
            plus first-party lead and CTA signals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary?.clarityDashboardUrl ? (
            <a
              href={summary.clarityDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/25"
            >
              Open Clarity dashboard
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => void refreshClarity()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh Clarity data
          </button>
        </div>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading website analytics…
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {summary && !loading ? (
        <>
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/55">
            <p>
              Clarity project:{" "}
              <span className="font-mono text-white/80">{summary.clarityProjectId || "not set"}</span>
              {" · "}
              Traffic source:{" "}
              <span className="text-white/80">
                {summary.trafficSource === "clarity_api"
                  ? "Clarity Data Export API"
                  : summary.trafficSource === "first_party"
                    ? "First-party website telemetry"
                    : summary.trafficSource === "mixed"
                      ? "Clarity API + first-party"
                      : "No traffic yet"}
              </span>
              {" · "}
              API token:{" "}
              {summary.clarityApiConfigured ? "configured" : "missing (CLARITY_API_TOKEN)"}
              {" · "}
              Last snapshot:{" "}
              {summary.clarityFetchedAt
                ? new Date(summary.clarityFetchedAt).toLocaleString()
                : "never"}
              {summary.clarityError ? ` · Snapshot note: ${summary.clarityError}` : ""}
            </p>
            {summary.dataNotes?.length ? (
              <ul className="list-disc space-y-1 pl-4 text-amber-100/80">
                {summary.dataNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            {!summary.clarityApiConfigured ? (
              <p className="text-white/45">
                To import Clarity dashboard metrics: open Clarity → Settings → Data Export →
                Generate new API token for project{" "}
                <span className="font-mono">{summary.clarityProjectId || "xvt6yldo67"}</span>, then
                set Production env <span className="font-mono">CLARITY_API_TOKEN</span> and
                redeploy. Behaviour metrics (rage/dead/quick-back) require that token or the
                Clarity UI links below.
              </p>
            ) : null}
          </div>

          <TqmsSection
            title="Traffic"
            subtitle={
              summary.trafficSource === "clarity_api" || summary.trafficSource === "mixed"
                ? "Visitors and sessions from Clarity Data Export (with first-party page views)."
                : "Visitors and sessions from first-party unit311central.com telemetry."
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
              <Kpi label="Visitors" value={String(summary.traffic.visitors)} />
              <Kpi label="Sessions" value={String(summary.traffic.sessions)} />
              <Kpi label="Page views" value={String(summary.traffic.pageViews)} />
              <Kpi label="Returning visitors" value={String(summary.traffic.returningVisitors)} />
              <Kpi
                label="Pages / session"
                value={String(summary.traffic.pagesPerSession)}
              />
              <Kpi
                label="Bot sessions"
                value={String(summary.traffic.botSessions)}
                hint="Clarity export only"
              />
              <Kpi
                label="Avg time on page"
                value={
                  summary.pages.averageTimeOnPageSeconds > 0
                    ? `${summary.pages.averageTimeOnPageSeconds}s`
                    : "—"
                }
              />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <RankTable
                headers={["Country", "Views / sessions"]}
                rows={summary.traffic.countries.map((r) => [r.name, String(r.value)])}
                empty="No country breakdown yet."
              />
              <RankTable
                headers={["Device", "Views / sessions"]}
                rows={summary.traffic.devices.map((r) => [r.name, String(r.value)])}
                empty="No device breakdown yet."
              />
              <RankTable
                headers={["Browser", "Views / sessions"]}
                rows={summary.traffic.browsers.map((r) => [r.name, String(r.value)])}
                empty="No browser breakdown yet."
              />
            </div>
          </TqmsSection>

          <div className="grid gap-4 lg:grid-cols-2">
            <TqmsSection title="Most visited pages">
              <RankTable
                headers={["Page", "Sessions / views"]}
                rows={summary.pages.mostVisited.map((r) => [r.name, String(r.value)])}
                empty="No page data yet. Ensure Clarity is loading on the marketing site."
              />
            </TqmsSection>
            <TqmsSection title="Least visited pages">
              <RankTable
                headers={["Page", "Sessions / views"]}
                rows={summary.pages.leastVisited.map((r) => [r.name, String(r.value)])}
                empty="No page data yet."
              />
            </TqmsSection>
            <TqmsSection title="Entry pages" subtitle="Highest-traffic landing pages.">
              <RankTable
                headers={["Page", "Volume"]}
                rows={summary.pages.entryPages.map((r) => [r.name, String(r.value)])}
                empty="No entry-page data yet."
              />
            </TqmsSection>
            <TqmsSection
              title="Exit pages"
              subtitle="Lower-traffic pages among observed routes — open Clarity for full exit pathing."
            >
              <RankTable
                headers={["Page", "Volume"]}
                rows={summary.pages.exitPages.map((r) => [r.name, String(r.value)])}
                empty="No exit-page data yet."
              />
            </TqmsSection>
          </div>

          <TqmsSection
            title="Marketing performance"
            subtitle="Key marketing routes and CTA engagement."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Kpi label="Home visits" value={String(summary.marketing.homeVisits)} />
              <Kpi label="Features / industries" value={String(summary.marketing.featuresVisits)} />
              <Kpi label="Pricing visits" value={String(summary.marketing.pricingVisits)} />
              <Kpi label="Contact visits" value={String(summary.marketing.contactVisits)} />
              <Kpi label="Demo / book visits" value={String(summary.marketing.demoVisits)} />
              <Kpi label="CTA clicks" value={String(summary.marketing.ctaClicks)} />
            </div>
          </TqmsSection>

          <TqmsSection title="Lead generation" subtitle="Form outcomes and conversion rates.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi
                label="Contact submissions"
                value={String(summary.marketing.contactSubmissions)}
              />
              <Kpi label="Demo requests" value={String(summary.marketing.demoRequests)} />
              <Kpi
                label="Contact conversion"
                value={`${summary.marketing.contactConversionRate}%`}
              />
              <Kpi
                label="Demo conversion"
                value={`${summary.marketing.demoConversionRate}%`}
              />
            </div>
          </TqmsSection>

          <TqmsSection
            title="User behaviour"
            subtitle={
              summary.behaviour.availableViaClarityOnly
                ? "Rage/dead/quick-back counts need Clarity Data Export. Use the Clarity links for heatmaps and recordings now."
                : "Frustration signals from Clarity Data Export."
            }
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi label="Rage clicks" value={String(summary.behaviour.rageClicks)} />
              <Kpi label="Dead clicks" value={String(summary.behaviour.deadClicks)} />
              <Kpi label="Quick backs" value={String(summary.behaviour.quickBacks)} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={summary.heatmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/5"
              >
                Open heatmaps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={summary.recordingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/5"
              >
                Open session recordings
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </TqmsSection>

          <TqmsSection
            title="Navigation analysis"
            subtitle={summary.journeys.note}
          >
            <RankTable
              headers={["Common path / page", "Volume"]}
              rows={summary.journeys.topPaths.map((r) => [r.name, String(r.value)])}
              empty="Pathing will populate as marketing traffic is collected."
            />
          </TqmsSection>
        </>
      ) : null}
    </div>
  );
}
