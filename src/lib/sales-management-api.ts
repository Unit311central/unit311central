import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarCrmLeads, getNorthstarDiscoveryMeetings } from "@/lib/demo/module-fixtures";
import { listSalesQuotes } from "@/lib/accounting/sales-quotes-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { ensureSalesManagementFoundationTables } from "@/lib/internal-db-migrations";
import {
  buildForecastSummary,
  buildDemoSalesWorkspaceBundle,
  buildMySalesSummary,
  buildPerformanceSummary,
  buildReportsSummary,
  buildSalesActivities,
  buildSalesTeamSummary,
  loadSalesWorkspaceBundle,
  type SalesWorkspaceBundle,
} from "@/lib/sales-management-service";
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
    const bundle = buildDemoSalesWorkspaceBundle({
      currentUserId: "demo-user",
      currentUserName: "Alex Morgan",
      leads,
      quotes,
      meetings,
    });
    return {
      demo: true as const,
      workspace: { id: "demo", slug: "demo", name: "Demo" },
      session: { sub: "demo-user", displayName: "Alex Morgan", username: "client" },
      bundle,
      leads: bundle.leads,
      quotes: bundle.quotes,
      meetings: bundle.meetings,
      displayNameForUserId: bundle.context.displayNameForUserId,
      metrics: bundle.metrics,
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
  const bundle: SalesWorkspaceBundle | null = auth.bundle;
  if (!bundle) {
    throw new Error("Sales workspace bundle is missing.");
  }

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
      people: bundle.context.people.map(({ userId, displayName, email, isManager }) => ({
        userId,
        displayName,
        email,
        isManager,
      })),
      teams: bundle.context.teams.map(({ id, name, managerName, memberCount }) => ({
        id,
        name,
        managerName,
        memberCount,
      })),
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
