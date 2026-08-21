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

import { WsSection } from "../domain-workspace-ui";
import {
  ChartTooltip,
  SalesChartFrame,
  SalesKpiGrid,
  SalesKpiTile,
  SalesCompactEmpty,
  SalesRegisterCard,
  SalesTabHeader,
} from "./sales-management-ui";

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

  const href = (tab: string) => getInternalNavHref("sales-management", basePath, { tab });

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center text-sm text-white/55">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-300/80" />
        Loading sales dashboard…
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error ?? "Unable to load dashboard."}
      </div>
    );
  }

  const money = (value: number) => formatSalesMoney(value, metrics.currency);
  const showStatusPie = statusChartData.length >= 2;
  const showLeadTrend = metrics.leadsCreatedByMonth.length >= 2;

  return (
    <div className="space-y-4">
      <SalesTabHeader
        title="Sales command centre"
        description="Live KPIs, pipeline charts, and priority actions from workspace CRM, quotes, and discovery data."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/75 hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        }
      />

      <SalesKpiGrid>
        <SalesKpiTile label="Open pipeline value" value={money(metrics.pipelineValue)} hint="Cold, warm, and hot opportunities" />
        <SalesKpiTile label="Open opportunities" value={String(metrics.openOpportunityCount)} hint="Active pipeline records" />
        <SalesKpiTile label="Prospects" value={String(metrics.prospectCount)} hint="Cold and warm leads" />
        <SalesKpiTile
          label="Win rate"
          value={metrics.winRatePct == null ? "—" : `${metrics.winRatePct}%`}
          hint={`${metrics.wonCount} won · ${metrics.lostCount} lost`}
        />
      </SalesKpiGrid>

      <SalesKpiGrid>
        <SalesKpiTile label="Open quotes" value={String(metrics.quotesOpenCount)} hint={money(metrics.quotesOpenValue)} />
        <SalesKpiTile label="Accepted quotes" value={String(metrics.quotesAcceptedCount)} hint="Commercial wins" />
        <SalesKpiTile label="Upcoming actions" value={String(metrics.upcomingActionsCount)} hint="Next 14 days" />
        <SalesKpiTile label="Discovery sessions" value={String(metrics.upcomingMeetingsCount)} hint="Scheduled discovery" />
      </SalesKpiGrid>

      <div
        className={cn(
          "grid gap-4",
          showStatusPie && pipelineValueChart.length ? "xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" : "grid-cols-1",
        )}
      >
        {pipelineValueChart.length ? (
          <WsSection title="Pipeline by stage" subtitle="Open opportunity value from CRM leads" className="p-4 sm:p-5">
            <SalesChartFrame heightClassName="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineValueChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} width={56} />
                  <Tooltip content={<ChartTooltip valueFormatter={(value) => money(Number(value))} />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {pipelineValueChart.map((entry) => (
                      <Cell key={entry.stage} fill={STATUS_COLORS[entry.stage] ?? "#7c3aed"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SalesChartFrame>
          </WsSection>
        ) : (
          <WsSection title="Pipeline by stage" subtitle="Open opportunity value from CRM leads" className="p-4 sm:p-5">
            <SalesCompactEmpty message="No open pipeline value yet — add hot or warm CRM opportunities to populate this chart." />
          </WsSection>
        )}

        {showStatusPie ? (
          <WsSection title="Opportunities by status" subtitle="All CRM lead statuses in this workspace" className="p-4 sm:p-5">
            <SalesChartFrame heightClassName="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={118} paddingAngle={2}>
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </SalesChartFrame>
          </WsSection>
        ) : statusChartData.length === 1 ? (
          <WsSection title="Opportunities by status" subtitle="Current workspace snapshot" className="p-4 sm:p-5">
            <div className="space-y-2">
              {statusChartData.map((row) => (
                <div key={row.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <span className="text-sm text-white/70">{row.name}</span>
                  <span className="text-base font-semibold tabular-nums text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </WsSection>
        ) : null}
      </div>

      <div className={cn("grid gap-4", showLeadTrend ? "xl:grid-cols-2" : "grid-cols-1")}>
        <WsSection title="Pipeline by salesperson" subtitle="Assignment data follows CRM ownership fields" className="p-4 sm:p-5">
          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {metrics.pipelineByAssignee.length ? (
              metrics.pipelineByAssignee.map((row) => (
                <SalesRegisterCard key={row.assignee}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{row.assignee}</p>
                      <p className="text-xs text-white/45">{row.count} open opportunities</p>
                    </div>
                    <p className="shrink-0 text-base font-semibold tabular-nums text-violet-200">{money(row.value)}</p>
                  </div>
                </SalesRegisterCard>
              ))
            ) : (
              <SalesCompactEmpty message="No assigned pipeline yet." />
            )}
          </div>
        </WsSection>

        {showLeadTrend ? (
          <WsSection title="Lead creation trend" subtitle="New CRM records by month" className="p-4 sm:p-5">
            <SalesChartFrame heightClassName="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.leadsCreatedByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} width={32} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </SalesChartFrame>
          </WsSection>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WsSection title="Deals requiring attention" subtitle="Overdue CRM follow-ups" className="p-4 sm:p-5">
          <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            {(metrics.overdueActions ?? []).length ? (
              metrics.overdueActions.map((action) => (
                <SalesRegisterCard key={action.id} highlight="amber">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{action.companyName}</p>
                      <p className="text-xs text-white/50">{action.nextAction}</p>
                    </div>
                    <p className="shrink-0 text-[11px] font-medium text-amber-100">{action.nextActionDate}</p>
                  </div>
                </SalesRegisterCard>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-white/40">No overdue follow-ups.</p>
            )}
          </div>
        </WsSection>

        <WsSection
          title="Upcoming sales actions"
          subtitle="Follow-ups from CRM next-action dates"
          className="p-4 sm:p-5"
          actions={
            <Link href={href("pipeline")} className="text-xs font-medium text-violet-300 hover:text-violet-200">
              Open pipeline
            </Link>
          }
        >
          <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            {metrics.upcomingActions.length ? (
              metrics.upcomingActions.map((action) => (
                <SalesRegisterCard key={action.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{action.companyName}</p>
                      <p className="text-xs text-white/50">{action.nextAction}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-white/55">{action.nextActionDate}</p>
                      <p className={cn("text-[10px] font-medium uppercase tracking-wide", leadStatusClass(action.status))}>
                        {action.status}
                      </p>
                    </div>
                  </div>
                </SalesRegisterCard>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-white/40">No upcoming actions in the next 14 days.</p>
            )}
          </div>
        </WsSection>

        <WsSection
          title="Discovery activity"
          subtitle="Scheduled discovery sessions"
          className="p-4 sm:p-5"
          actions={
            <Link href={href("discovery")} className="text-xs font-medium text-violet-300 hover:text-violet-200">
              Open discovery
            </Link>
          }
        >
          <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
            {metrics.upcomingMeetings.length ? (
              metrics.upcomingMeetings.map((meeting) => (
                <SalesRegisterCard key={meeting.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{meeting.organization}</p>
                      <p className="text-xs text-white/50">{meeting.name}</p>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-white/55">
                      <CalendarClock className="ml-auto mb-1 h-3.5 w-3.5 text-violet-300" />
                      {meeting.formattedWhen}
                    </div>
                  </div>
                </SalesRegisterCard>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-white/40">No upcoming discovery sessions.</p>
            )}
          </div>
        </WsSection>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href={href("prospects")}
          className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10"
        >
          <Target className="h-4 w-4 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-white group-hover:text-violet-50">Prospects</p>
          <p className="mt-1 text-xs text-white/45">Early-stage CRM leads</p>
        </Link>
        <Link
          href={href("opportunities")}
          className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10"
        >
          <TrendingUp className="h-4 w-4 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-white group-hover:text-violet-50">Opportunities</p>
          <p className="mt-1 text-xs text-white/45">Deal workspace and quotes</p>
        </Link>
        <Link
          href={href("pipeline")}
          className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/30 hover:bg-violet-500/10"
        >
          <BarChart className="h-4 w-4 text-violet-300" />
          <p className="mt-2 text-sm font-semibold text-white group-hover:text-violet-50">Pipeline</p>
          <p className="mt-1 text-xs text-white/45">Stage view over CRM data</p>
        </Link>
      </div>
    </div>
  );
}
