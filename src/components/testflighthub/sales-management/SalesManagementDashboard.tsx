"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, Loader2, RefreshCw, Target, TrendingUp } from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import {
  buildSalesDashboardMetrics,
  formatSalesMoney,
  type SalesDashboardMetrics,
} from "@/lib/sales-management-insights";
import { leadStatusClass } from "@/lib/crm-data";
import { cn } from "@/lib/utils";

import { WsKpiTile, WsSection } from "../domain-workspace-ui";

const STATUS_COLORS: Record<string, string> = {
  Cold: "#64748b",
  Warm: "#38bdf8",
  Hot: "#f97316",
  Won: "#22c55e",
  "Active Customer": "#a78bfa",
  Lost: "#ef4444",
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-xs text-white shadow-xl">
      {label ? <div className="mb-1 font-medium text-white/80">{label}</div> : null}
      {payload.map((entry) => (
        <div key={entry.name} style={{ color: entry.color ?? "#fff" }}>
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  );
}

export default function SalesManagementDashboard() {
  const basePath = useInternalOperationsBasePath();
  const [metrics, setMetrics] = useState<SalesDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sales-management/dashboard", { cache: "no-store" });
      const data = await readApiJson<{ metrics?: SalesDashboardMetrics; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load dashboard");
      setMetrics(data.metrics ?? buildSalesDashboardMetrics({ leads: [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statusChartData = useMemo(
    () =>
      (metrics?.byStatus ?? [])
        .filter((row) => row.count > 0)
        .map((row) => ({ name: row.status, value: row.count, fill: STATUS_COLORS[row.status] })),
    [metrics],
  );

  const pipelineValueChart = useMemo(
    () =>
      (metrics?.byStatus ?? [])
        .filter((row) => ["Cold", "Warm", "Hot"].includes(row.status) && row.value > 0)
        .map((row) => ({ stage: row.status, value: row.value })),
    [metrics],
  );

  const href = (tab: string) =>
    getInternalNavHref("sales-management", basePath, { tab });

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-white/60">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading sales dashboard…
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error ?? "Unable to load dashboard."}
      </div>
    );
  }

  const money = (value: number) => formatSalesMoney(value, metrics.currency);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Sales dashboard</h2>
          <p className="mt-1 text-xs text-white/45">
            Live pipeline, prospects, quotes, and discovery activity from workspace CRM data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/[0.08]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WsKpiTile label="Open pipeline value" value={money(metrics.pipelineValue)} hint="Cold, warm, and hot opportunities" />
        <WsKpiTile label="Open opportunities" value={String(metrics.openOpportunityCount)} hint="Active pipeline records" />
        <WsKpiTile label="Prospects" value={String(metrics.prospectCount)} hint="Cold and warm leads" />
        <WsKpiTile
          label="Win rate"
          value={metrics.winRatePct == null ? "—" : `${metrics.winRatePct}%`}
          hint={`${metrics.wonCount} won · ${metrics.lostCount} lost`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WsKpiTile label="Open quotes" value={String(metrics.quotesOpenCount)} hint={money(metrics.quotesOpenValue)} />
        <WsKpiTile label="Accepted quotes" value={String(metrics.quotesAcceptedCount)} hint="Commercial wins" />
        <WsKpiTile label="Upcoming actions" value={String(metrics.upcomingActionsCount)} hint="Next 14 days" />
        <WsKpiTile label="Discovery sessions" value={String(metrics.upcomingMeetingsCount)} hint="Scheduled discovery" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <WsSection title="Pipeline by stage" subtitle="Open opportunity value from CRM leads">
          <div className="h-64">
            {pipelineValueChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineValueChart}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {pipelineValueChart.map((entry) => (
                      <Cell key={entry.stage} fill={STATUS_COLORS[entry.stage] ?? "#7c3aed"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-white/40">No open pipeline value yet.</p>
            )}
          </div>
        </WsSection>

        <WsSection title="Opportunities by status" subtitle="All CRM lead statuses in this workspace">
          <div className="h-64">
            {statusChartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={2}>
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-white/40">No CRM leads in this workspace.</p>
            )}
          </div>
        </WsSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <WsSection title="Pipeline by salesperson" subtitle="Assignment data follows CRM ownership fields">
          <div className="space-y-2">
            {metrics.pipelineByAssignee.map((row) => (
              <div
                key={row.assignee}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{row.assignee}</p>
                  <p className="text-[11px] text-white/45">{row.count} open opportunities</p>
                </div>
                <p className="text-sm font-semibold text-violet-200">{money(row.value)}</p>
              </div>
            ))}
          </div>
        </WsSection>

        <WsSection title="Lead creation trend" subtitle="New CRM records by month">
          <div className="h-56">
            {metrics.leadsCreatedByMonth.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.leadsCreatedByMonth}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-white/40">No lead history available.</p>
            )}
          </div>
        </WsSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <WsSection
          title="Upcoming sales actions"
          subtitle="Follow-ups from CRM next-action dates"
          actions={
            <Link href={href("pipeline")} className="text-xs font-medium text-violet-300 hover:text-violet-200">
              Open pipeline
            </Link>
          }
        >
          <div className="space-y-2">
            {metrics.upcomingActions.length ? (
              metrics.upcomingActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{action.companyName}</p>
                    <p className="text-[11px] text-white/45">{action.nextAction}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-white/55">{action.nextActionDate}</p>
                    <p className={cn("text-[10px] font-medium uppercase tracking-wide", leadStatusClass(action.status))}>
                      {action.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-white/40">No upcoming actions in the next 14 days.</p>
            )}
          </div>
        </WsSection>

        <WsSection
          title="Discovery activity"
          subtitle="Scheduled discovery sessions"
          actions={
            <Link href={href("discovery")} className="text-xs font-medium text-violet-300 hover:text-violet-200">
              Open discovery
            </Link>
          }
        >
          <div className="space-y-2">
            {metrics.upcomingMeetings.length ? (
              metrics.upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{meeting.organization}</p>
                    <p className="text-[11px] text-white/45">{meeting.name}</p>
                  </div>
                  <div className="text-right text-[11px] text-white/55">
                    <CalendarClock className="ml-auto mb-1 h-3.5 w-3.5 text-violet-300" />
                    {meeting.formattedWhen}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-white/40">No upcoming discovery sessions.</p>
            )}
          </div>
        </WsSection>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href={href("prospects")}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10"
        >
          <Target className="h-4 w-4 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-white">Prospects</p>
          <p className="mt-1 text-xs text-white/45">Early-stage CRM leads</p>
        </Link>
        <Link
          href={href("opportunities")}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10"
        >
          <TrendingUp className="h-4 w-4 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-white">Opportunities</p>
          <p className="mt-1 text-xs text-white/45">Deal workspace and quotes</p>
        </Link>
        <Link
          href={href("pipeline")}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10"
        >
          <BarChart className="h-4 w-4 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-white">Pipeline</p>
          <p className="mt-1 text-xs text-white/45">Stage view over CRM data</p>
        </Link>
      </div>
    </div>
  );
}
