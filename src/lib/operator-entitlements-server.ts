import "server-only";

import { headers } from "next/headers";

import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { getCurrentWorkspace } from "@/lib/workspace-context";
import { findWorkspaceById } from "@/lib/workspace-host";
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
  const workspaceRecord =
    workspace?.id ? await findWorkspaceById(workspace.id).catch(() => null) : null;

  const snapshot: OperatorEntitlementsSnapshot = {
    workspaceSlug: workspace?.slug ?? hostSlug ?? null,
    workspaceType: workspaceRecord?.workspaceType ?? null,
    role: null,
    roles: [],
    department: null,
    departments: [],
    allowedViews: null,
    homeTiles: null,
    enabledModules: null,
    enabledSubModules: null,
  };

  if (session.userType === "internal" && isSupabaseConfigured()) {
    try {
      const operator = await getInternalOperatorByUsername(session.username);
      if (operator) {
        snapshot.role = operator.role ?? null;
        snapshot.roles = operator.roles ?? (operator.role ? [operator.role] : []);
        snapshot.department = operator.department ?? null;
        snapshot.departments =
          operator.departments ?? (operator.department ? [operator.department] : []);
        snapshot.allowedViews = operator.allowedViews;
        snapshot.homeTiles = operator.dashboardPrefs?.homeTiles ?? null;
      }
    } catch {
      /* optional operator profile */
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
    } catch {
      /* optional nav enablement */
    }
  }

  return snapshot;
}
