"use client";



import Link from "next/link";

import { useState } from "react";

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

import { BadgePercent, CalendarRange, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";



import { formatSalesMoney, resolveSalesUiCurrency } from "@/lib/sales-management-insights";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";

import { getInternalNavHref } from "@/lib/internal-operations-data";

import { cn } from "@/lib/utils";

import { WsInputClass, WsPrimaryButtonClass, WsSecondaryButtonClass, WsSection } from "../domain-workspace-ui";

import {

  ChartTooltip,

  SalesChartFrame,

  SalesActivityRow,

  SalesCompactEmpty,

  SalesEmptyState,

  SalesFilterBar,

  SalesFilterButton,

  SalesKpiGrid,

  SalesKpiTile,

  SalesManagementError,

  SalesManagementLoading,

  SalesRegisterCard,

  SalesTabHeader,

  useSalesWorkspaceSection,

} from "./sales-management-ui";



const STATUS_COLORS: Record<string, string> = {

  Cold: "#64748b",

  Warm: "#38bdf8",

  Hot: "#f97316",

};



export function SalesManagementActivitiesTab() {

  const { data, loading, error, reload } = useSalesWorkspaceSection("activities");

  const [filter, setFilter] = useState<"all" | "upcoming" | "overdue" | "completed" | "meetings">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftLeadId, setDraftLeadId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);



  const activities = (data?.activities ?? []) as Array<{

    id: string;

    kind: string;

    title: string;

    subtitle: string;

    whenLabel: string | null;

    status: string;

    ownerName: string | null;

    companyName: string | null;

  }>;



  const filtered =

    filter === "upcoming"

      ? activities.filter((item) => item.status === "upcoming")

      : filter === "overdue"

        ? activities.filter((item) => item.status === "overdue")

        : filter === "completed"

          ? activities.filter((item) => item.status === "completed")

          : filter === "meetings"

            ? activities.filter((item) => item.kind === "meeting")

            : activities;



  if (loading) return <SalesManagementLoading label="Loading activities…" />;

  if (error || !data) return <SalesManagementError message={error ?? "Unable to load activities."} onRetry={() => void reload()} />;

  async function handleCreateActivity() {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/sales-management/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crmLeadId: draftLeadId,
          title: draftTitle,
          message: draftMessage,
          activityType: "sales_activity",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Unable to create activity.");
      setCreateOpen(false);
      setDraftTitle("");
      setDraftLeadId("");
      setDraftMessage("");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create activity.");
    } finally {
      setSaving(false);
    }
  }

  const leadOptions = (data.mySales as { pipeline?: Array<{ id: string; companyName: string }> })?.pipeline ?? [];



  const filters = [

    { id: "all", label: "All" },

    { id: "upcoming", label: "Upcoming" },

    { id: "overdue", label: "Overdue" },

    { id: "completed", label: "Completed" },

    { id: "meetings", label: "Meetings" },

  ] as const;



  return (

    <div className="space-y-4">

      <SalesTabHeader

        title="Activities"

        description="CRM follow-ups, discovery meetings, and recorded sales activity from your workspace."

      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-white/45">Activities combine CRM follow-ups, discovery meetings, and logged sales activity.</p>
        <button type="button" className={WsPrimaryButtonClass()} onClick={() => setCreateOpen((open) => !open)}>
          <Plus className="h-3.5 w-3.5" />
          Add activity
        </button>
      </div>

      {createOpen ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Linked opportunity</span>
            <select className={WsInputClass()} value={draftLeadId} onChange={(e) => setDraftLeadId(e.target.value)}>
              <option value="">Select CRM opportunity</option>
              {leadOptions.map((lead) => (
                <option key={lead.id} value={lead.id}>{lead.companyName}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Title</span>
            <input className={WsInputClass()} value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Follow-up call" />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Notes</span>
            <input className={WsInputClass()} value={draftMessage} onChange={(e) => setDraftMessage(e.target.value)} placeholder="Optional detail" />
          </label>
          {formError ? <p className="text-xs text-rose-300">{formError}</p> : null}
          <div className="flex gap-2">
            <button type="button" className={WsPrimaryButtonClass()} disabled={saving} onClick={() => void handleCreateActivity()}>
              {saving ? "Saving…" : "Save activity"}
            </button>
            <button type="button" className={WsSecondaryButtonClass()} onClick={() => setCreateOpen(false)}>Cancel</button>
          </div>
        </div>
      ) : null}

      <SalesFilterBar>

        {filters.map((entry) => (

          <SalesFilterButton key={entry.id} active={filter === entry.id} onClick={() => setFilter(entry.id)}>

            {entry.label}

          </SalesFilterButton>

        ))}

      </SalesFilterBar>



      <WsSection title="Activity register" subtitle={`${filtered.length} items`} className="p-4 sm:p-5">

        <div className="max-h-[560px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] px-4 sm:px-5">

          {filtered.map((item) => (

            <SalesActivityRow

              key={item.id}

              title={item.title}

              subtitle={item.subtitle}

              companyName={item.companyName}

              ownerName={item.ownerName}

              whenLabel={item.whenLabel}

              status={item.status}

              overdue={item.status === "overdue"}

            />

          ))}

          {!filtered.length ? (

            <div className="py-6">

              <SalesEmptyState

                icon={ClipboardList}

                title="No activities in this view"

                description="Schedule CRM follow-ups or book discovery sessions to build your sales activity timeline."

                compact

              />

            </div>

          ) : null}

        </div>

      </WsSection>

    </div>

  );

}



export function SalesManagementTargetsTab() {

  const { data, loading, error, reload } = useSalesWorkspaceSection("targets");

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);



  if (loading) return <SalesManagementLoading label="Loading targets…" />;

  if (error || !data) return <SalesManagementError message={error ?? "Unable to load targets."} onRetry={() => void reload()} />;



  const targets = (data.targets ?? []) as Array<{

    id: string;

    ownerName: string | null;

    teamName: string | null;

    periodStart: string;

    periodEnd: string;

    targetValue: number;

    actualValue: number;

    progressPct: number | null;

    currency: "GBP" | "USD" | "AUD" | "ZAR";

  }>;



  async function submitTarget(form: HTMLFormElement) {

    setSaving(true);

    setFormError(null);

    const fd = new FormData(form);

    try {

      const response = await fetch("/api/sales-management/targets", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          ownerUserId: String(fd.get("ownerUserId") || "") || null,

          teamId: String(fd.get("teamId") || "") || null,

          periodType: String(fd.get("periodType") || "quarter"),

          periodStart: String(fd.get("periodStart") || ""),

          periodEnd: String(fd.get("periodEnd") || ""),

          targetValue: Number(fd.get("targetValue") || 0),

          notes: String(fd.get("notes") || "") || null,

        }),

      });

      const payload = await response.json();

      if (!response.ok) throw new Error(payload.error ?? "Unable to save target");

      form.reset();

      await reload();

    } catch (err) {

      setFormError(err instanceof Error ? err.message : "Unable to save target");

    } finally {

      setSaving(false);

    }

  }



  async function deleteTarget(targetId: string) {
    if (!window.confirm("Delete this target?")) return;
    const res = await fetch(`/api/sales-management/targets?id=${encodeURIComponent(targetId)}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Unable to delete target.");
      return;
    }
    await reload();
  }

  const fieldClass =

    "mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/40";

  const quarterChartData = targets.map((target) => ({
    name: (target.ownerName ?? target.teamName ?? "Team").split(" ")[0],
    target: target.targetValue,
    actual: target.actualValue,
  }));

  const currency = targets[0]?.currency
    ? resolveSalesUiCurrency(targets[0].currency)
    : resolveSalesUiCurrency(data.context.currency);



  return (

    <div className="space-y-4">

      <SalesTabHeader

        title="Targets"

        description="Revenue targets by salesperson or team. Actuals derive from Won opportunities and accepted quotes in the period."

      />



      {data.context.isManager ? (

        <WsSection title="Set a target" subtitle="Managers can define quarterly or monthly goals" className="p-4 sm:p-5">

          <form

            className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-3"

            onSubmit={(event) => {

              event.preventDefault();

              void submitTarget(event.currentTarget);

            }}

          >

            <label className="space-y-1 text-xs font-medium text-white/55">

              Salesperson

              <select name="ownerUserId" className={fieldClass}>

                <option value="">Team target (select team below)</option>

                {data.context.people.map((person) => (

                  <option key={person.userId} value={person.userId}>

                    {person.displayName}

                  </option>

                ))}

              </select>

            </label>

            <label className="space-y-1 text-xs font-medium text-white/55">

              Team

              <select name="teamId" className={fieldClass}>

                <option value="">Individual target</option>

                {data.context.teams.map((team) => (

                  <option key={team.id} value={team.id}>

                    {team.name}

                  </option>

                ))}

              </select>

            </label>

            <label className="space-y-1 text-xs font-medium text-white/55">

              Period type

              <select name="periodType" className={fieldClass}>

                <option value="month">Month</option>

                <option value="quarter">Quarter</option>

                <option value="year">Year</option>

              </select>

            </label>

            <label className="space-y-1 text-xs font-medium text-white/55">

              Period start

              <input name="periodStart" type="date" required className={fieldClass} />

            </label>

            <label className="space-y-1 text-xs font-medium text-white/55">

              Period end

              <input name="periodEnd" type="date" required className={fieldClass} />

            </label>

            <label className="space-y-1 text-xs font-medium text-white/55">

              Target value

              <input name="targetValue" type="number" min="0" step="1000" required className={fieldClass} />

            </label>

            <label className="md:col-span-3 space-y-1 text-xs font-medium text-white/55">

              Notes

              <input name="notes" className={fieldClass} placeholder="Optional context for this target" />

            </label>

            {formError ? <p className="md:col-span-3 text-sm text-red-300">{formError}</p> : null}

            <div className="md:col-span-3 flex justify-end">

              <button

                type="submit"

                disabled={saving}

                className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"

              >

                {saving ? "Saving…" : "Save target"}

              </button>

            </div>

          </form>

        </WsSection>

      ) : null}



      {targets.length ? (
        <WsSection
          title="Actual vs target"
          subtitle="Quarter progress by salesperson or team — actuals from Won deals and accepted quotes"
          className="p-4 sm:p-5"
        >
          <SalesChartFrame heightClassName="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={quarterChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => formatSalesMoney(value, currency).replace(/\.\d{2}$/, "")}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(value, name) =>
                        formatSalesMoney(value, currency) + (name === "actual" ? " (actual)" : name === "target" ? " (target)" : "")
                      }
                    />
                  }
                />
                <Bar dataKey="target" name="Target" fill="rgba(139,92,246,0.35)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SalesChartFrame>
        </WsSection>
      ) : null}



      <WsSection title="Active targets" subtitle="Progress uses real Won deal value and accepted quotes" className="p-4 sm:p-5">

        {!targets.length ? (

          <SalesEmptyState

            icon={CalendarRange}

            title="No targets defined yet"

            description="Set revenue targets for salespeople or teams to track progress against Won opportunities and accepted quotes."

          />

        ) : (

          <div className="grid gap-3 md:grid-cols-2">

            {targets.map((target) => (

              <SalesRegisterCard key={target.id}>

                <div className="space-y-3">

                  <div className="flex flex-wrap items-start justify-between gap-2">

                    <div>

                      <p className="text-sm font-semibold text-white">

                        {target.ownerName ?? target.teamName ?? "Workspace target"}

                      </p>

                      <p className="text-xs text-white/45">

                        {target.periodStart} → {target.periodEnd}

                      </p>

                    </div>

                    <p className="text-sm font-semibold tabular-nums text-violet-200">

                      {formatSalesMoney(target.actualValue, target.currency)} / {formatSalesMoney(target.targetValue, target.currency)}

                    </p>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">

                    <div

                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-300"

                      style={{ width: `${Math.min(target.progressPct ?? 0, 100)}%` }}

                    />

                  </div>

                  <p className="text-xs text-white/45">

                    {target.progressPct == null ? "—" : `${target.progressPct}%`} of target achieved

                  </p>

                  {data.context.isManager ? (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        className={WsSecondaryButtonClass()}
                        onClick={() => void deleteTarget(target.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  ) : null}

                </div>

              </SalesRegisterCard>

            ))}

          </div>

        )}

      </WsSection>

    </div>

  );

}



export function SalesManagementPerformanceTab() {

  const { data, loading, error, reload } = useSalesWorkspaceSection("performance");

  const [selectedUserId, setSelectedUserId] = useState<string>("");

  if (loading) return <SalesManagementLoading label="Loading performance…" />;

  if (error || !data) return <SalesManagementError message={error ?? "Unable to load performance."} onRetry={() => void reload()} />;

  const currency = resolveSalesUiCurrency(data.context.currency);
  const money = (value: number) => formatSalesMoney(value, currency);

  const performance = data.performance as {
    wonCount: number;
    lostCount: number;
    conversionPct: number | null;
    openPipelineValue: number;
    wonValue: number;
    pipelineByPerson: Array<{ assignee: string; count: number; value: number }>;
    bySalesperson?: Array<{
      userId: string;
      name: string;
      targetValue: number;
      actualValue: number;
      progressPct: number | null;
      variance: number;
      openPipeline: number;
      weightedForecast: number;
      status: "ahead" | "on_track" | "behind";
    }>;
  };

  const people = performance.bySalesperson ?? [];
  const activePerson =
    people.find((person) => person.userId === selectedUserId) ??
    people[0] ??
    null;

  const maxPipeline = Math.max(...performance.pipelineByPerson.map((row) => row.value), 1);

  const statusClass =
    activePerson?.status === "ahead"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      : activePerson?.status === "behind"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
        : "border-sky-400/30 bg-sky-500/10 text-sky-100";

  return (

    <div className="space-y-4">

      <SalesTabHeader

        title="Performance"

        description="Select a salesperson to see target attainment, pipeline, and forecast in one view."

      />

      {people.length ? (
        <WsSection title="Salesperson performance" subtitle="Current quarter target vs actual CRM outcomes" className="p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] flex-1 space-y-1 text-xs font-medium text-white/55">
              Salesperson
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/40"
                value={activePerson?.userId ?? ""}
                onChange={(event) => setSelectedUserId(event.target.value)}
              >
                {people.map((person) => (
                  <option key={person.userId} value={person.userId}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
            {activePerson ? (
              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide", statusClass)}>
                {activePerson.status === "ahead"
                  ? "Ahead of target"
                  : activePerson.status === "behind"
                    ? "Behind target"
                    : "On target"}
              </span>
            ) : null}
          </div>

          {activePerson ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SalesKpiTile label="Target" value={money(activePerson.targetValue)} hint="Current quarter" />
              <SalesKpiTile label="Actual" value={money(activePerson.actualValue)} hint="Won + accepted in period" />
              <SalesKpiTile
                label="Achieved"
                value={activePerson.progressPct == null ? "—" : `${activePerson.progressPct}%`}
                hint={`Variance ${money(activePerson.variance)}`}
              />
              <SalesKpiTile label="Open pipeline" value={money(activePerson.openPipeline)} hint="Owned opportunities" />
              <SalesKpiTile label="Weighted forecast" value={money(activePerson.weightedForecast)} hint="Pipeline × probability + won" />
            </div>
          ) : null}
        </WsSection>
      ) : null}

      <SalesKpiGrid>

        <SalesKpiTile label="Won deals" value={String(performance.wonCount)} hint={money(performance.wonValue)} />

        <SalesKpiTile label="Lost deals" value={String(performance.lostCount)} hint="Closed-lost opportunities" />

        <SalesKpiTile label="Win rate" value={performance.conversionPct == null ? "—" : `${performance.conversionPct}%`} hint="Won / (won + lost)" />

        <SalesKpiTile label="Open pipeline" value={money(performance.openPipelineValue)} hint="Current open value" />

      </SalesKpiGrid>



      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">

        <WsSection title="Pipeline by salesperson" subtitle="Open value ranked by CRM owner" className="p-4 sm:p-5">

          {performance.pipelineByPerson.length ? (

            <div className="space-y-3">

              {performance.pipelineByPerson.map((row) => (

                <div key={row.assignee} className="space-y-1.5">

                  <div className="flex items-center justify-between gap-3 text-sm">

                    <div className="min-w-0">

                      <p className="truncate font-medium text-white">{row.assignee}</p>

                      <p className="text-xs text-white/45">{row.count} open deals</p>

                    </div>

                    <p className="shrink-0 font-semibold tabular-nums text-violet-200">{money(row.value)}</p>

                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">

                    <div

                      className="h-full rounded-full bg-gradient-to-r from-emerald-500/90 to-emerald-300/90"

                      style={{ width: `${Math.max((row.value / maxPipeline) * 100, row.value > 0 ? 8 : 0)}%` }}

                    />

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <SalesEmptyState title="No owned pipeline" description="Assign CRM owners to compare salesperson performance." compact />

          )}

        </WsSection>



        <WsSection title="Distribution chart" subtitle="Compact view of open pipeline value" className="p-4 sm:p-5">

          <SalesChartFrame heightClassName="h-[260px]">

            {performance.pipelineByPerson.length ? (

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={performance.pipelineByPerson} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>

                  <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />

                  <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />

                  <YAxis type="category" dataKey="assignee" width={88} tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }} />

                  <Tooltip content={<ChartTooltip valueFormatter={(v) => money(Number(v))} />} />

                  <Bar dataKey="value" fill="#22c55e" radius={[0, 6, 6, 0]} barSize={18} />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <p className="flex h-full items-center justify-center text-sm text-white/40">No data to chart.</p>

            )}

          </SalesChartFrame>

        </WsSection>

      </div>

    </div>

  );

}



export function SalesManagementForecastTab() {

  const { data, loading, error, reload } = useSalesWorkspaceSection("forecast");

  if (loading) return <SalesManagementLoading label="Loading forecast…" />;

  if (error || !data) return <SalesManagementError message={error ?? "Unable to load forecast."} onRetry={() => void reload()} />;

  const currency = resolveSalesUiCurrency(data.context.currency);
  const money = (value: number) => formatSalesMoney(value, currency);

  const forecast = data.forecast as {

    openPipelineValue: number;

    weightedPipelineValue: number;

    committedWonValue: number;

    acceptedQuotesValue: number;

    totalVisibleForecast: number;

    weightedForecastTotal: number;

    salesStaffCount?: number;

    horizons?: Array<{

      months: number;

      label: string;

      forecastRevenue: number;

      weightedForecast: number;

      pipelineValue: number;

      salesStaffCount: number;

    }>;

    assumptions: string[];

  };



  const components = [

    { label: "Open pipeline", value: forecast.openPipelineValue, color: "from-sky-500/80 to-sky-400/50" },

    { label: "Committed (Won)", value: forecast.committedWonValue, color: "from-emerald-500/80 to-emerald-400/50" },

    { label: "Accepted quotes", value: forecast.acceptedQuotesValue, color: "from-violet-500/80 to-violet-400/50" },

  ];

  const maxComponent = Math.max(...components.map((c) => c.value), forecast.totalVisibleForecast, 1);



  return (

    <div className="space-y-4">

      <SalesTabHeader

        title="Forecast"

        description={
          forecast.salesStaffCount
            ? `We have forecasted ${money(forecast.weightedForecastTotal)} (weighted) across ${forecast.salesStaffCount} sales staff.`
            : "Forecast built from open pipeline, Won opportunities, and accepted quotes."
        }

      />

      {forecast.horizons?.length ? (
        <WsSection title="Forecast horizons" subtitle="Prorated from current pipeline and committed revenue" className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {forecast.horizons.map((row) => (
              <SalesRegisterCard key={row.months}>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{row.label}</p>
                <p className="mt-2 text-lg font-semibold tabular-nums text-white">{money(row.weightedForecast)}</p>
                <p className="mt-1 text-xs text-white/45">
                  Pipeline {money(row.pipelineValue)} · {row.salesStaffCount} sales staff
                </p>
              </SalesRegisterCard>
            ))}
          </div>
        </WsSection>
      ) : null}

      <SalesKpiGrid>

        <SalesKpiTile label="Open pipeline" value={money(forecast.openPipelineValue)} hint="Full estimated value" />

        <SalesKpiTile label="Weighted pipeline" value={money(forecast.weightedPipelineValue)} hint="Open value × win probability" />

        <SalesKpiTile label="Committed (Won)" value={money(forecast.committedWonValue)} hint="Closed-won opportunities" />

        <SalesKpiTile label="Weighted forecast total" value={money(forecast.weightedForecastTotal)} hint="Weighted open + won + accepted quotes" />

      </SalesKpiGrid>



      <SalesKpiGrid columns={2}>

        <SalesKpiTile label="Accepted quotes" value={money(forecast.acceptedQuotesValue)} hint="Commercially accepted" />

        <SalesKpiTile label="Visible forecast total" value={money(forecast.totalVisibleForecast)} hint="Unweighted sum of components" />

      </SalesKpiGrid>



      <WsSection title="Forecast composition" subtitle="Transparent breakdown of visible revenue components" className="p-4 sm:p-5">

        <div className="grid gap-4 md:grid-cols-3">

          {components.map((item) => (

            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{item.label}</p>

              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{money(item.value)}</p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">

                <div

                  className={`h-full rounded-full bg-gradient-to-r ${item.color}`}

                  style={{ width: `${Math.max((item.value / maxComponent) * 100, item.value > 0 ? 6 : 0)}%` }}

                />

              </div>

            </div>

          ))}

        </div>

      </WsSection>



      <WsSection title="Assumptions" subtitle="How this forecast is calculated" className="p-4 sm:p-5">

        <ul className="grid gap-2 md:grid-cols-2">

          {forecast.assumptions.map((line) => (

            <li key={line} className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-sm leading-relaxed text-white/60">

              {line}

            </li>

          ))}

        </ul>

      </WsSection>

    </div>

  );

}



export function SalesManagementCommissionsTab() {

  const { data, loading, error, reload } = useSalesWorkspaceSection("commissions");
  const [createOpen, setCreateOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftRate, setDraftRate] = useState("8");
  const [draftAppliesTo, setDraftAppliesTo] = useState("won_deal");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreateRule() {
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/sales-management/commission-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName,
          ratePct: Number(draftRate),
          appliesTo: draftAppliesTo,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Unable to create rule.");
      setCreateOpen(false);
      setDraftName("");
      setDraftRate("8");
      setDraftAppliesTo("won_deal");
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to create rule.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!window.confirm("Delete this commission rule?")) return;
    const res = await fetch(`/api/sales-management/commission-rules?id=${encodeURIComponent(ruleId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Unable to delete rule.");
      return;
    }
    await reload();
  }

  async function handleToggleRule(
    rule: { id: string; name: string; ratePct: number; appliesTo: string; isActive: boolean },
  ) {
    const res = await fetch("/api/sales-management/commission-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Unable to update rule.");
      return;
    }
    await reload();
  }

  if (loading) return <SalesManagementLoading label="Loading commissions…" />;

  if (error || !data) return <SalesManagementError message={error ?? "Unable to load commissions."} onRetry={() => void reload()} />;



  const rules = (data.commissionRules ?? []) as Array<{ id: string; name: string; ratePct: number; appliesTo: string; isActive: boolean }>;

  const commissions = (data.commissions ?? []) as Array<{

    id: string;

    userName: string;

    companyName: string | null;

    commissionableValue: number;

    ratePct: number;

    earnedAmount: number;

    status: string;

    ruleName: string | null;

  }>;



  return (

    <div className="space-y-4" data-tutorial-target="sm-commissions-header">

      <SalesTabHeader

        title="Commissions"

        description="Commission rules and earned records. Configured rules are separate from recorded commission entries."

      />



      <div className="grid gap-4 xl:grid-cols-2">

        <div data-tutorial-target="sm-commissions-rules">
        <WsSection title="Commission rules" subtitle="Configured calculation rules" className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-white/45">Add rules for won deals, accepted quotes, or paid invoices.</p>
            <button
              type="button"
              className={WsPrimaryButtonClass()}
              onClick={() => setCreateOpen((open) => !open)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add rule
            </button>
          </div>

          {createOpen ? (
            <div className="mb-4 space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Rule name</span>
                  <input
                    className={WsInputClass()}
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Enterprise won deal"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Rate %</span>
                  <input
                    className={WsInputClass()}
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={draftRate}
                    onChange={(event) => setDraftRate(event.target.value)}
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Applies to</span>
                <select
                  className={WsInputClass()}
                  value={draftAppliesTo}
                  onChange={(event) => setDraftAppliesTo(event.target.value)}
                >
                  <option value="won_deal">Won deal</option>
                  <option value="accepted_quote">Accepted quote</option>
                  <option value="invoice_paid">Invoice paid</option>
                </select>
              </label>
              {formError ? <p className="text-xs text-rose-300">{formError}</p> : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={WsPrimaryButtonClass()} disabled={saving} onClick={() => void handleCreateRule()}>
                  {saving ? "Saving…" : "Save rule"}
                </button>
                <button type="button" className={WsSecondaryButtonClass()} onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {!rules.length ? (

            <SalesEmptyState

              icon={BadgePercent}

              title="Commission rules not configured"

              description="Define rules for Won deals or accepted quotes. Once active, earned commission records can be tracked alongside closed commercial outcomes."

            />

          ) : (

            <div className="space-y-2">

              {rules.map((rule) => (

                <SalesRegisterCard key={rule.id}>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{rule.name}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {rule.ratePct}% · {rule.appliesTo.replaceAll("_", " ")} · {rule.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className={WsSecondaryButtonClass()}
                        onClick={() => void handleToggleRule(rule)}
                        title={rule.isActive ? "Deactivate rule" : "Activate rule"}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={WsSecondaryButtonClass()}
                        onClick={() => void handleDeleteRule(rule.id)}
                        title="Delete rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </SalesRegisterCard>

              ))}

            </div>

          )}

        </WsSection>
        </div>



        <div data-tutorial-target="sm-commissions-earned">
        <WsSection title="Earned commissions" subtitle="Recorded commission entries" className="p-4 sm:p-5">

          {!commissions.length ? (

            <SalesEmptyState

              icon={BadgePercent}

              title="No commission entries yet"

              description="Earned commissions appear here once deals are marked Won or quotes accepted and commission records are created."

            />

          ) : (

            <div className="space-y-2">

              {commissions.map((row) => (

                <SalesRegisterCard key={row.id}>

                  <p className="text-sm font-medium text-white">{row.userName}</p>

                  <p className="text-xs text-white/45">

                    {row.companyName ?? "Deal"} · {row.ruleName ?? "Manual"} · {row.status}

                  </p>

                  <p className="mt-1 text-sm font-semibold tabular-nums text-violet-200">

                    {formatSalesMoney(row.earnedAmount)} on {formatSalesMoney(row.commissionableValue)} @ {row.ratePct}%

                  </p>

                </SalesRegisterCard>

              ))}

            </div>

          )}

        </WsSection>
        </div>

      </div>

    </div>

  );

}



export function SalesManagementReportsTab() {

  const basePath = useInternalOperationsBasePath();
  const { data, loading, error, reload } = useSalesWorkspaceSection("reports");
  const href = (tab: string) => getInternalNavHref("sales-management", basePath, { tab });
  const currency = resolveSalesUiCurrency(data?.context.currency);
  const money = (value: number) => formatSalesMoney(value, currency);

  if (loading) return <SalesManagementLoading label="Loading reports…" />;

  if (error || !data) return <SalesManagementError message={error ?? "Unable to load reports."} onRetry={() => void reload()} />;



  const reports = data.reports as {

    pipelineByStage: Array<{ status: string; count: number; value: number }>;

    pipelineByPerson: Array<{ assignee: string; count: number; value: number }>;

    wonLost: Array<{ label: string; count: number; value: number }>;

    leadTrend: Array<{ month: string; count: number }>;

    conversionPct: number | null;

    activitySummary: { upcoming: number; overdue: number };

  };



  const pieData = reports.pipelineByStage

    .filter((row) => row.value > 0)

    .map((row) => ({

      name: row.status,

      value: row.value,

      fill: STATUS_COLORS[row.status] ?? "#7c3aed",

    }));

  const showPipelinePie = pieData.length >= 2;

  const showLeadTrend = reports.leadTrend.length >= 2;



  return (

    <div className="space-y-4">

      <SalesTabHeader

        title="Reports"

        description="Visual sales reporting from live CRM, quote, and activity data."

      />



      <SalesKpiGrid columns={3}>

        <Link href={href("performance")} className="block rounded-xl transition hover:ring-1 hover:ring-violet-400/30">

          <SalesKpiTile label="Win rate" value={reports.conversionPct == null ? "—" : `${reports.conversionPct}%`} hint="Closed opportunities — open Performance" />

        </Link>

        <Link href={href("activities")} className="block rounded-xl transition hover:ring-1 hover:ring-violet-400/30">

          <SalesKpiTile label="Upcoming activities" value={String(reports.activitySummary.upcoming)} hint="Scheduled follow-ups — open Activities" />

        </Link>

        <Link href={href("activities")} className="block rounded-xl transition hover:ring-1 hover:ring-amber-400/30">

          <SalesKpiTile label="Overdue activities" value={String(reports.activitySummary.overdue)} hint="Needs action — open Activities" />

        </Link>

      </SalesKpiGrid>



      <div

        className={cn(

          "grid gap-4",

          showPipelinePie && showLeadTrend ? "xl:grid-cols-2" : "grid-cols-1",

        )}

      >

        {showPipelinePie ? (

          <WsSection title="Pipeline by stage" subtitle="Open value by CRM status" className="p-4 sm:p-5">

            <SalesChartFrame heightClassName="h-[320px]">

              <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={112} paddingAngle={2}>

                    {pieData.map((entry) => (

                      <Cell key={entry.name} fill={entry.fill} />

                    ))}

                  </Pie>

                  <Tooltip content={<ChartTooltip valueFormatter={(v) => money(Number(v))} />} />

                </PieChart>

              </ResponsiveContainer>

            </SalesChartFrame>

          </WsSection>

        ) : pieData.length === 1 ? (

          <WsSection title="Pipeline by stage" subtitle="Open value by CRM status" className="p-4 sm:p-5">

            <div className="space-y-2">

              {pieData.map((row) => (

                <div key={row.name} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">

                  <span className="text-sm text-white/70">{row.name}</span>

                  <span className="text-base font-semibold tabular-nums text-white">{formatSalesMoney(row.value)}</span>

                </div>

              ))}

            </div>

          </WsSection>

        ) : (

          <WsSection title="Pipeline by stage" subtitle="Open value by CRM status" className="p-4 sm:p-5">

            <SalesCompactEmpty message="Add CRM opportunities to populate stage reporting." />

          </WsSection>

        )}



        {showLeadTrend ? (

          <WsSection title="Lead creation trend" subtitle="New CRM records by month" className="p-4 sm:p-5">

            <SalesChartFrame heightClassName="h-[320px]">

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={reports.leadTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>

                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />

                  <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} width={32} />

                  <Tooltip content={<ChartTooltip />} />

                  <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />

                </LineChart>

              </ResponsiveContainer>

            </SalesChartFrame>

          </WsSection>

        ) : null}

      </div>



      <WsSection title="Won vs lost" subtitle="Closed opportunity outcomes" className="p-4 sm:p-5">

        <div className="grid gap-3 sm:grid-cols-2">

          {reports.wonLost.map((row) => (

            <Link key={row.label} href={href("performance")} className="block rounded-xl transition hover:ring-1 hover:ring-violet-400/30">

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">

              <p className="text-sm font-medium text-white">{row.label}</p>

              <p className="mt-2 text-3xl font-semibold tabular-nums text-violet-200">{row.count}</p>

              <p className="mt-1 text-xs text-white/45">{money(row.value)}</p>

            </div>

            </Link>

          ))}

        </div>

      </WsSection>

    </div>

  );

}


