import "server-only";

import { isUnit311GlobalAdminUsername } from "@/lib/demo/read-only";
import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { resolveOperatorEntitlementsFromOperatorRow } from "@/lib/operator-entitlements-resolve";
import type { PlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isWorkspaceTenantAdministratorSurface } from "@/lib/customer-workspace-surface";
import type { CurrentWorkspace } from "@/lib/workspace-context";

function isAdminRole(roles: readonly string[] | null | undefined): boolean {
  return (roles ?? []).some((role) => {
    const normalized = String(role).trim().toLowerCase();
    return normalized === "admin" || normalized === "administrator" || normalized === "c-suite";
  });
}

async function isWorkspaceMembershipAdmin(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createTenancyServerClient();
  const { data } = await supabase
    .from("workspace_users")
    .select("role, is_owner")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  if (data.is_owner) return true;
  const role = String(data.role ?? "").trim().toLowerCase();
  return role === "owner" || role === "admin";
}

/** Workspace administrators may change sidebar module visibility and order. */
export async function canManageWorkspaceSidebar(
  session: PlatformSession,
  workspace: CurrentWorkspace | null,
): Promise<boolean> {
  if (!session || !workspace?.id) return false;
  if (isUnit311GlobalAdminUsername(session.username)) return true;

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
      if (isAdminRole(resolved.roles)) return true;
    }
  } catch {
    /* optional operator profile */
  }

  if (isWorkspaceTenantAdministratorSurface(workspace.slug)) {
    return isWorkspaceMembershipAdmin(workspace.id, session.sub);
  }

  return false;
}
