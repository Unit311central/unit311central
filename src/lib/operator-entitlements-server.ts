import "server-only";

import { headers } from "next/headers";

import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { resolveOperatorEntitlementsFromOperatorRow } from "@/lib/operator-entitlements-resolve";
import { getPlatformSession } from "@/lib/platform-session";
import { isUnit311GlobalAdminUsername } from "@/lib/demo/read-only";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { getCurrentWorkspace } from "@/lib/workspace-context";
import { resolveWorkspaceTenantEntitlements } from "@/lib/workspace-tenant-entitlements";
import { applyDemoWorkspaceAllowedViews } from "@/lib/workspace-enabled-views";
import type { CommandCentreHomeTileId } from "@/lib/command-centre-home-tiles";
import type { InternalOperationsView } from "@/lib/internal-operations-data";

/**
 * Snapshot for hydrating OperatorEntitlementsProvider on first paint.
 * Avoids the 5-module nav fallback flash before /api/auth/whoami returns.
 */
export type OperatorEntitlementsSnapshot = {
  role?: string | null;
  roles?: string[];
  department?: string | null;
  departments?: string[];
  allowedViews?: InternalOperationsView[] | null;
  homeTiles?: CommandCentreHomeTileId[] | null;
  workspaceSlug?: string | null;
  workspaceType?: string | null;
  workspaceName?: string | null;
  enabledModules?: string[] | null;
  enabledSubModules?: string[] | null;
};

export async function loadOperatorEntitlementsSnapshot(
  requestHost?: string | null,
): Promise<OperatorEntitlementsSnapshot | null> {
  const host =
    requestHost?.trim() ||
    getRequestHost({ headers: await headers() }) ||
    null;
  const hostSlug = host ? parseClientPlatformSubdomainSafe(host) : null;

  const session = await getPlatformSession();
  if (!session) {
    return hostSlug ? { workspaceSlug: hostSlug } : null;
  }

  const workspace = await getCurrentWorkspace().catch(() => null);

  const snapshot: OperatorEntitlementsSnapshot = {
    workspaceSlug: workspace?.slug ?? hostSlug ?? null,
    workspaceType: workspace?.workspaceType ?? null,
    workspaceName: workspace?.name ?? null,
    role: null,
    roles: [],
    department: null,
    departments: [],
    allowedViews: null,
    homeTiles: null,
    enabledModules: null,
    enabledSubModules: null,
  };

  if (isSupabaseConfigured()) {
    try {
      const operator = await getInternalOperatorByUsername(session.username);
      if (operator) {
        const resolved = resolveOperatorEntitlementsFromOperatorRow({
          role: operator.role,
          roles: operator.roles,
          department: operator.department,
          departments: operator.departments,
          allowed_views: operator.allowedViews,
          dashboard_prefs: operator.dashboardPrefs,
        });
        snapshot.role = resolved.role;
        snapshot.roles = resolved.roles;
        snapshot.department = resolved.department;
        snapshot.departments = resolved.departments;
        snapshot.allowedViews = resolved.allowedViews;
        snapshot.homeTiles = resolved.homeTiles;
      }
    } catch {
      /* optional operator profile */
    }
  }

  if (isUnit311GlobalAdminUsername(session.username)) {
    snapshot.role = "Admin";
    snapshot.roles = ["Admin"];
    snapshot.department = snapshot.department ?? "Corporate";
    snapshot.departments = snapshot.departments?.length
      ? snapshot.departments
      : ["Corporate"];
    snapshot.allowedViews = null;
  }

  if (workspace?.id) {
    const tenantEntitlements = await resolveWorkspaceTenantEntitlements({
      userId: session.sub,
      username: session.username,
      workspace,
    });
    if (tenantEntitlements) {
      snapshot.role = tenantEntitlements.role;
      snapshot.roles = tenantEntitlements.roles;
      snapshot.department = tenantEntitlements.department;
      snapshot.departments = tenantEntitlements.departments;
      snapshot.allowedViews = tenantEntitlements.allowedViews;
      snapshot.homeTiles = tenantEntitlements.homeTiles;
    }
  }

  if (workspace?.id && isSupabaseConfigured()) {
    try {
      const supabase = createTenancyServerClient();
      const { data: metadata } = await supabase
        .from("workspace_admin_metadata")
        .select("enabled_modules, enabled_sub_modules")
        .eq("workspace_id", workspace.id)
        .maybeSingle();
      snapshot.enabledModules = metadata?.enabled_modules?.length
        ? [...metadata.enabled_modules]
        : null;
      snapshot.enabledSubModules = metadata?.enabled_sub_modules?.length
        ? [...metadata.enabled_sub_modules]
        : null;

      snapshot.allowedViews = applyDemoWorkspaceAllowedViews(
        snapshot.allowedViews ?? null,
        snapshot.workspaceSlug,
        snapshot.enabledModules,
        snapshot.enabledSubModules,
      );
    } catch {
      /* optional nav enablement */
    }
  }

  return snapshot;
}
