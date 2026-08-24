"use client";



import Link from "next/link";

import {

  Bar,

  BarChart,

  CartesianGrid,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from "recharts";

import { AlertCircle, CalendarClock, FileText, Target, TrendingUp, Users } from "lucide-react";



import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";

import { getInternalNavHref } from "@/lib/internal-operations-data";

import { formatSalesMoney, salesReportingCurrency } from "@/lib/sales-management-insights";

import type { CrmLead } from "@/lib/crm-data";

import { leadStatusClass } from "@/lib/crm-data";

import { cn } from "@/lib/utils";



import { WsSection } from "../domain-workspace-ui";

import {

  ChartTooltip,

  SalesChartFrame,

  SalesEmptyState,

  SalesKpiGrid,

  SalesKpiTile,

  SalesManagementError,

  SalesManagementLoading,

  SalesRegisterCard,

  SalesTabHeader,

  useSalesWorkspaceSection,

} from "./sales-management-ui";



type ActivityRow = {

  id: string;

  title: string;

  subtitle: string;

  whenLabel: string | null;

  status: string;

  companyName: string | null;

};



export function SalesManagementMySalesTab() {

  const basePath = useInternalOperationsBasePath();

  const { data, loading, error, reload } = useSalesWorkspaceSection("my-sales");

  const href = (tab: string) => getInternalNavHref("sales-management", basePath, { tab });



  if (loading) return <SalesManagementLoading label="Loading your sales workspace…" />;

  if (error || !data) return <SalesManagementError message={error ?? "Unable to load My Sales."} onRetry={() => void reload()} />;



  const mySales = data.mySales as {

    prospects: CrmLead[];

    opportunities: CrmLead[];

    pipeline: CrmLead[];

    quotes: Array<{ id: string; quoteNumber: string; companyName: string; totalAmount: number; status: string }>;

    activities: ActivityRow[];

    metrics: { pipelineValue: number; openOpportunities: number; overdueActivities: number; upcomingMeetings: number };

  };

  const currency = salesReportingCurrency();

  const money = (value: number) => formatSalesMoney(value, currency);

  const isManagerView = data.context.isManager && !data.context.isSalesperson;



  return (

    <div className="space-y-4">

      <SalesTabHeader

        title={isManagerView ? "Sales overview" : "My Sales"}

        description={

          isManagerView

            ? "Manager view — records without an assigned owner remain visible here."

            : `Personal pipeline, activities, and quotes for ${data.context.currentUserName}.`

        }

      />



      <SalesKpiGrid>

        <SalesKpiTile label="My pipeline value" value={money(mySales.metrics.pipelineValue)} hint="Open opportunities you own" />

        <SalesKpiTile label="Open opportunities" value={String(mySales.metrics.openOpportunities)} hint="Assigned to you" />

        <SalesKpiTile label="Overdue follow-ups" value={String(mySales.metrics.overdueActivities)} hint="Requires attention" />

        <SalesKpiTile label="Discovery sessions" value={String(mySales.metrics.upcomingMeetings)} hint="Upcoming meetings" />

      </SalesKpiGrid>



      <div className="grid gap-4 xl:grid-cols-2">

        <WsSection title="My pipeline" subtitle="Open opportunities in your name" className="p-4 sm:p-5">

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">

            {mySales.pipeline.slice(0, 8).map((lead) => (

              <SalesRegisterCard key={lead.id}>

                <div className="flex items-center justify-between gap-3">

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium text-white">{lead.companyName}</p>

                    <p className={cn("text-[10px] font-medium uppercase tracking-wide", leadStatusClass(lead.status))}>{lead.status}</p>

                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular-nums text-violet-200">{money(lead.estimatedValue ?? 0)}</p>

                </div>

              </SalesRegisterCard>

            ))}

            {!mySales.pipeline.length ? (

              <SalesEmptyState

                title="No open opportunities assigned to you"

                description="Opportunities appear here when CRM records include you as owner. Unassigned records remain visible to managers."

                compact

              />

            ) : null}

          </div>

        </WsSection>



        <WsSection title="Upcoming & overdue" subtitle="Follow-ups and meetings" className="p-4 sm:p-5">

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">

            {mySales.activities.slice(0, 8).map((activity) => (

              <SalesRegisterCard key={activity.id} highlight={activity.status === "overdue" ? "amber" : "none"}>

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium text-white">{activity.title}</p>

                    <p className="text-xs text-white/50">{activity.subtitle}</p>

                  </div>

                  <div className="shrink-0 text-right text-[11px] text-white/55">

                    {activity.status === "overdue" ? (

                      <AlertCircle className="ml-auto mb-1 h-3.5 w-3.5 text-amber-300" />

                    ) : (

                      <CalendarClock className="ml-auto mb-1 h-3.5 w-3.5 text-violet-300" />

                    )}

                    {activity.whenLabel ?? "—"}

                  </div>

                </div>

              </SalesRegisterCard>

            ))}

            {!mySales.activities.length ? (

              <SalesEmptyState

                title="No scheduled sales activities"

                description="CRM follow-up dates and discovery sessions will appear here as they are scheduled."

                compact

              />

            ) : null}

          </div>

        </WsSection>

      </div>



      <div className="grid gap-3 sm:grid-cols-3">

        <Link href={href("prospects")} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-violet-400/30 hover:bg-violet-500/10">

          <Target className="h-4 w-4 text-violet-300" />

          <p className="mt-2 text-sm font-semibold text-white">Prospects ({mySales.prospects.length})</p>

        </Link>

        <Link href={href("opportunities")} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-violet-400/30 hover:bg-violet-500/10">

          <TrendingUp className="h-4 w-4 text-violet-300" />

          <p className="mt-2 text-sm font-semibold text-white">Opportunities ({mySales.opportunities.length})</p>

        </Link>

        <Link href={href("sales-quotes")} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-violet-400/30 hover:bg-violet-500/10">

          <FileText className="h-4 w-4 text-violet-300" />

          <p className="mt-2 text-sm font-semibold text-white">Sales quotes ({mySales.quotes.length})</p>

        </Link>

      </div>

    </div>

  );

}



export function SalesManagementSalesTeamTab() {

  const { data, loading, error, reload } = useSalesWorkspaceSection("sales-team");



  if (loading) return <SalesManagementLoading label="Loading sales team…" />;

  if (error || !data) return <SalesManagementError message={error ?? "Unable to load Sales Team."} onRetry={() => void reload()} />;



  const rows = data.salesTeam as Array<{

    person: { userId: string; displayName: string; email: string; isManager: boolean };

    openOpportunityCount: number;

    pipelineValue: number;

    wonCount: number;

    activityLoad: number;

    teams: Array<{ id: string; name: string }>;

  }>;



  const chartData = rows

    .filter((row) => row.pipelineValue > 0 || row.openOpportunityCount > 0)

    .map((row) => ({ name: row.person.displayName, value: row.pipelineValue, count: row.openOpportunityCount }));



  return (

    <div className="space-y-4">

      <SalesTabHeader

        title="Sales Team"

        description="Team membership, ownership, and pipeline distribution across workspace salespeople."

      />



      {!rows.length ? (

        <SalesEmptyState

          icon={Users}

          title="Build your sales team"

          description="Internal workspace users with CRM ownership will appear here automatically. Configure teams and assign opportunity owners as your sales organisation scales — no placeholder data is shown."

          dense

        />

      ) : (

        <>

          <WsSection title="Pipeline by salesperson" subtitle="Open opportunity value by owner" className="p-4 sm:p-5">

            <SalesChartFrame>

              {chartData.length ? (

                <ResponsiveContainer width="100%" height="100%">

                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>

                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />

                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />

                    <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} width={56} />

                    <Tooltip content={<ChartTooltip valueFormatter={(v) => formatSalesMoney(Number(v))} />} />

                    <Bar dataKey="value" fill="#7c3aed" radius={[8, 8, 0, 0]} />

                  </BarChart>

                </ResponsiveContainer>

              ) : (

                <SalesEmptyState

                  icon={Users}

                  title="No owned pipeline yet"

                  description="Assign opportunity owners on CRM records to see pipeline distribution by salesperson."

                  compact

                />

              )}

            </SalesChartFrame>

          </WsSection>



          <WsSection title="Team roster" subtitle="People, teams, and workload" className="p-4 sm:p-5">

            <div className="overflow-x-auto rounded-xl border border-white/10">

              <table className="min-w-full text-left text-sm">

                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wide text-white/45">

                  <tr>

                    <th className="px-4 py-3 font-semibold">Person</th>

                    <th className="px-4 py-3 font-semibold">Teams</th>

                    <th className="px-4 py-3 font-semibold">Open deals</th>

                    <th className="px-4 py-3 font-semibold">Pipeline</th>

                    <th className="px-4 py-3 font-semibold">Won</th>

                    <th className="px-4 py-3 font-semibold">Activity load</th>

                  </tr>

                </thead>

                <tbody>

                  {rows.map((row) => (

                    <tr key={row.person.userId} className="border-t border-white/10 text-white/80">

                      <td className="px-4 py-3">

                        <p className="font-medium text-white">{row.person.displayName}</p>

                        <p className="text-xs text-white/45">{row.person.email}</p>

                      </td>

                      <td className="px-4 py-3 text-[13px]">

                        {row.teams.length ? row.teams.map((team) => team.name).join(", ") : "—"}

                      </td>

                      <td className="px-4 py-3 tabular-nums">{row.openOpportunityCount}</td>

                      <td className="px-4 py-3 tabular-nums">{formatSalesMoney(row.pipelineValue)}</td>

                      <td className="px-4 py-3 tabular-nums">{row.wonCount}</td>

                      <td className="px-4 py-3 tabular-nums">{row.activityLoad}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </WsSection>

        </>

      )}

    </div>

  );

}


