import "server-only";

import { defaultHomeTilesForRoles } from "@/lib/access-presets";
import { isCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import {
  resolveOperatorEntitlementsFromOperatorRow,
  type ResolvedOperatorEntitlements,
} from "@/lib/operator-entitlements-resolve";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import {
  mapWorkspaceRoleToUserRole,
  mergeWorkspaceTenantUserRecord,
} from "@/lib/workspace-tenant-users-service";
import type { CurrentWorkspace } from "@/lib/workspace-context";

function isWorkspaceAdministratorMembership(input: {
  role?: string | null;
  is_owner?: boolean | null;
}): boolean {
  if (input.is_owner) return true;
  const role = String(input.role ?? "").trim().toLowerCase();
  return role === "owner" || role === "admin";
}

/**
 * Resolve entitlements for a signed-in user on a customer workspace host.
 * Workspace owner/admin always receives unrestricted Admin access to all enabled modules.
 */
export async function resolveWorkspaceTenantEntitlements(input: {
  userId: string;
  username: string;
  workspace: CurrentWorkspace | null;
}): Promise<ResolvedOperatorEntitlements | null> {
  const workspace = input.workspace;
  if (!workspace?.id || !isCustomerWorkspaceSlug(workspace.slug)) {
    return null;
  }
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createTenancyServerClient();
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_users")
      .select("role, is_owner")
      .eq("workspace_id", workspace.id)
      .eq("user_id", input.userId)
      .maybeSingle();

    if (membershipError || !membership) {
      return null;
    }

    const operator = await getInternalOperatorByUsername(input.username).catch(() => null);
    const workspaceRole = mapWorkspaceRoleToUserRole(
      String(membership.role ?? ""),
      Boolean(membership.is_owner),
    );

    if (isWorkspaceAdministratorMembership(membership)) {
      const roles = operator?.roles?.length
        ? resolveOperatorEntitlementsFromOperatorRow({
            role: "Admin",
            roles: ["Admin"],
            department: operator.department,
            departments: operator.departments,
            allowed_views: null,
            dashboard_prefs: operator.dashboardPrefs,
          }).roles
        : (["Admin"] as const);
      const departments = resolveOperatorEntitlementsFromOperatorRow({
        role: "Admin",
        roles: ["Admin"],
        department: operator?.department,
        departments: operator?.departments,
        allowed_views: null,
        dashboard_prefs: operator?.dashboardPrefs,
      }).departments;

      return {
        role: "Admin",
        roles: [...roles],
        department: departments[0] ?? "Operations",
        departments: [...departments],
        allowedViews: null,
        homeTiles: defaultHomeTilesForRoles(["Admin"], departments),
      };
    }

    const merged = mergeWorkspaceTenantUserRecord({
      platformUserId: input.userId,
      username: input.username,
      email: input.username,
      fullName: input.username,
      isActive: true,
      clientName: workspace.name,
      workspaceRole: String(membership.role ?? workspaceRole),
      isOwner: Boolean(membership.is_owner),
      operator: null,
    });

    if (operator) {
      return resolveOperatorEntitlementsFromOperatorRow({
        role: operator.role,
        roles: operator.roles,
        department: operator.department,
        departments: operator.departments,
        allowed_views: operator.allowedViews,
        dashboard_prefs: operator.dashboardPrefs,
      });
    }

    return resolveOperatorEntitlementsFromOperatorRow({
      role: merged.role,
      roles: merged.roles,
      department: merged.department,
      departments: merged.departments,
      allowed_views: merged.allowedViews,
      dashboard_prefs: merged.dashboardPrefs,
    });
  } catch {
    return null;
  }
}
