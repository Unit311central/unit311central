import { NextResponse } from "next/server";

import { requirePlatformSession } from "@/lib/platform-session";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
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
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
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
  const bundle = auth.bundle;
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
      currency: bundle.context.currency,
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
    forecast: buildForecastSummary(bundle.leads, bundle.quotes, bundle.context.people.length),
    commissionRules: bundle.commissionRules,
    commissions: bundle.commissions,
    reports: buildReportsSummary(bundle),
  };
}
