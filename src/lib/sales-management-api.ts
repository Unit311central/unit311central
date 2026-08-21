import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarCrmLeads, getNorthstarDiscoveryMeetings } from "@/lib/demo/module-fixtures";
import { listSalesQuotes } from "@/lib/accounting/sales-quotes-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { ensureSalesManagementFoundationTables } from "@/lib/internal-db-migrations";
import {
  buildForecastSummary,
  buildMySalesSummary,
  buildPerformanceSummary,
  buildReportsSummary,
  buildSalesActivities,
  buildSalesTeamSummary,
  loadSalesWorkspaceBundle,
} from "@/lib/sales-management-service";
import { buildSalesDashboardMetrics } from "@/lib/sales-management-insights";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export type SalesManagementSection =
  | "dashboard"
  | "my-sales"
  | "sales-team"
  | "activities"
  | "targets"
  | "performance"
  | "forecast"
  | "commissions"
  | "reports";

export async function resolveSalesManagementAuth() {
  if (await isDemoApiRequest()) {
    const leads = getNorthstarCrmLeads();
    const quotes = await listSalesQuotes({ workspaceSlug: "demo" });
    const meetings = getNorthstarDiscoveryMeetings().map((meeting) => ({
      id: meeting.id,
      organization: meeting.organization,
      name: meeting.name,
      formattedWhen: meeting.formattedWhenGmt,
      status: meeting.status,
    }));
    const displayNameForUserId = () => "Demo Rep";
    return {
      demo: true as const,
      workspace: { id: "demo", slug: "demo", name: "Demo" },
      session: { sub: "demo-user", displayName: "Demo Rep", username: "client" },
      bundle: null,
      leads,
      quotes,
      meetings,
      displayNameForUserId,
      metrics: buildSalesDashboardMetrics({ leads, quotes, meetings, displayNameForUserId }),
    };
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  await ensureSalesManagementFoundationTables();

  const session = await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();
  const bundle = await loadSalesWorkspaceBundle({
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    currentUserId: session.sub,
    currentUserName: session.displayName,
  });

  return {
    demo: false as const,
    workspace,
    session,
    bundle,
    leads: bundle.leads,
    quotes: bundle.quotes,
    meetings: bundle.meetings,
    displayNameForUserId: bundle.context.displayNameForUserId,
    metrics: bundle.metrics,
  };
}

export function salesManagementErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to load sales data.";
  const status =
    message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
  return NextResponse.json({ error: message }, { status });
}

export function buildSectionPayload(section: SalesManagementSection, auth: Awaited<ReturnType<typeof resolveSalesManagementAuth>>) {
  if (auth.demo) {
    const activities = buildSalesActivities({
      leads: auth.leads,
      meetings: auth.meetings,
      crmActivities: [],
      displayNameForUserId: auth.displayNameForUserId,
    });
    const forecast = buildForecastSummary(auth.leads, auth.quotes);
    const performance = buildPerformanceSummary(auth.leads, [], auth.displayNameForUserId);
    return {
      section,
      workspace: auth.workspace,
      context: {
        currentUserId: auth.session.sub,
        currentUserName: auth.session.displayName,
        isManager: true,
        isSalesperson: true,
        people: [],
        teams: [],
      },
      metrics: auth.metrics,
      mySales: {
        prospects: auth.leads.filter((l) => l.status === "Cold" || l.status === "Warm"),
        opportunities: auth.leads.filter((l) => ["Warm", "Hot", "Won", "Active Customer"].includes(l.status)),
        pipeline: auth.leads.filter((l) => ["Cold", "Warm", "Hot"].includes(l.status)),
        quotes: auth.quotes,
        activities,
        metrics: {
          pipelineValue: auth.metrics.pipelineValue,
          openOpportunities: auth.metrics.openOpportunityCount,
          overdueActivities: activities.filter((a) => a.status === "overdue").length,
          upcomingMeetings: auth.metrics.upcomingMeetingsCount,
        },
      },
      salesTeam: [],
      activities,
      targets: [],
      performance,
      forecast,
      commissionRules: [],
      commissions: [],
      reports: {
        pipelineByStage: auth.metrics.byStatus,
        pipelineByPerson: auth.metrics.pipelineByAssignee,
        wonLost: [
          { label: "Won", count: auth.metrics.wonCount, value: 0 },
          { label: "Lost", count: auth.metrics.lostCount, value: 0 },
        ],
        leadTrend: auth.metrics.leadsCreatedByMonth,
        forecast,
        targetProgress: [],
        activitySummary: { upcoming: activities.filter((a) => a.status === "upcoming").length, overdue: activities.filter((a) => a.status === "overdue").length },
        conversionPct: auth.metrics.winRatePct,
      },
    };
  }

  const bundle = auth.bundle!;
  const activities = buildSalesActivities({
    leads: bundle.leads,
    meetings: bundle.meetings,
    crmActivities: bundle.activities,
    displayNameForUserId: bundle.context.displayNameForUserId,
  });

  return {
    section,
    workspace: auth.workspace,
    context: {
      currentUserId: bundle.context.currentUserId,
      currentUserName: bundle.context.currentUserName,
      isManager: bundle.context.isManager,
      isSalesperson: bundle.context.isSalesperson,
      people: bundle.context.people,
      teams: bundle.context.teams,
    },
    metrics: bundle.metrics,
    mySales: buildMySalesSummary(bundle),
    salesTeam: buildSalesTeamSummary(bundle),
    activities,
    targets: bundle.targets,
    performance: buildPerformanceSummary(
      bundle.leads,
      bundle.targets,
      bundle.context.displayNameForUserId,
    ),
    forecast: buildForecastSummary(bundle.leads, bundle.quotes),
    commissionRules: bundle.commissionRules,
    commissions: bundle.commissions,
    reports: buildReportsSummary(bundle),
  };
}
