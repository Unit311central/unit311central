"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, ExternalLink, PenLine, Sparkles } from "lucide-react";

import {
  buildPortfolioPortalOverviewRows,
  portfolioPortalOverviewSummary,
  type PortfolioPortalOverviewRow,
  type QuarterlySummaryStatus,
} from "@/lib/talanton/portfolio-portal-overview-data";
import { cn } from "@/lib/utils";
import {
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

function quarterlyClass(status: QuarterlySummaryStatus) {
  if (status === "Submitted") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (status === "Due soon") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-rose-400/30 bg-rose-500/10 text-rose-100";
}

function portalStatusClass(status: PortfolioPortalOverviewRow["portalStatus"]) {
  if (status === "Active") return "text-emerald-300/90";
  if (status === "Invited") return "text-amber-300/90";
  return "text-white/45";
}

export default function TalantonPortfolioPortalOverviewWorkspace() {
  const rows = useMemo(() => buildPortfolioPortalOverviewRows(), []);
  const summary = useMemo(() => portfolioPortalOverviewSummary(rows), [rows]);
  const [selectedId, setSelectedId] = useState(rows[0]?.companyId ?? "");

  const selected =
    rows.find((row) => row.companyId === selectedId) ?? rows[0] ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Portfolio Companies"
        title="Portfolio Portal Overview"
        description="External portfolio company portal URLs, story activity, last access, and quarterly summary compliance across the Talanton holdings."
      />

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TalantonImpactMetric label="New stories (30d)" value={summary.newStories} tone="good" />
        <TalantonImpactMetric label="Active portals" value={summary.activePortals} />
        <TalantonImpactMetric
          label="Overdue quarterly summaries"
          value={summary.overdueQuarterly}
          tone={summary.overdueQuarterly > 0 ? "alert" : "default"}
        />
        <TalantonImpactMetric label="Due within 14 days" value={summary.dueSoonQuarterly} />
        <TalantonImpactMetric label="Latest portal activity" value={summary.latestActivity} hint="Most recent login or upload" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/25">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
              External portal access
            </p>
            <p className="mt-1 text-xs text-white/50">{rows.length} portfolio company URLs</p>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {rows.map((row) => {
              const active = row.companyId === selected?.companyId;
              return (
                <li key={row.companyId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.companyId)}
                    className={cn(
                      "mb-1 w-full rounded-xl border px-3 py-2.5 text-left transition",
                      active
                        ? "border-emerald-400/35 bg-emerald-500/10"
                        : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/5",
                    )}
                  >
                    <p className="truncate text-sm font-medium text-white">{row.companyName}</p>
                    <a
                      href={row.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                      className="mt-1 inline-flex items-center gap-1 truncate text-[11px] text-emerald-300/85 hover:text-emerald-200"
                    >
                      /{row.path}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <p className={cn("mt-1 text-[10px]", portalStatusClass(row.portalStatus))}>
                      {row.portalStatus}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
                    Selected portfolio
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">{selected.companyName}</h2>
                  <a
                    href={selected.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-300/90 hover:text-emerald-200"
                  >
                    {selected.portalUrl}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide",
                    quarterlyClass(selected.quarterlySummaryStatus),
                  )}
                >
                  {selected.quarterlySummaryStatus}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-emerald-300/80">
                    <PenLine className="h-4 w-4" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide">New stories logged</p>
                  </div>
                  <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
                    {selected.newStoriesLogged}
                  </p>
                  <p className="mt-1 text-xs text-white/50">Published or drafted in the last 30 days</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-sky-300/80">
                    <Clock3 className="h-4 w-4" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide">Last activity</p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{selected.lastActivity}</p>
                  <p className="mt-1 text-xs text-white/55">{selected.lastActivityDetail}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-amber-300/80">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-[10px] font-semibold uppercase tracking-wide">Quarterly summary</p>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-white">{selected.quarterlySummaryStatus}</p>
                  <p className="mt-1 text-xs text-white/55">Due {selected.quarterlySummaryDue}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex items-center gap-2 text-emerald-300/80">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide">All portfolios at a glance</p>
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-[10px] uppercase tracking-wide text-white/40">
                      <tr>
                        <th className="px-2 py-2 font-medium">Company</th>
                        <th className="px-2 py-2 font-medium">Stories</th>
                        <th className="px-2 py-2 font-medium">Last activity</th>
                        <th className="px-2 py-2 font-medium">Quarterly</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.companyId}
                          className={cn(
                            "border-t border-white/8",
                            row.companyId === selected.companyId && "bg-emerald-500/5",
                          )}
                        >
                          <td className="px-2 py-2 font-medium text-white/90">{row.companyName}</td>
                          <td className="px-2 py-2 tabular-nums text-white/70">{row.newStoriesLogged}</td>
                          <td className="px-2 py-2 text-white/60">{row.lastActivity}</td>
                          <td className="px-2 py-2">
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[10px]",
                                quarterlyClass(row.quarterlySummaryStatus),
                              )}
                            >
                              {row.quarterlySummaryStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
