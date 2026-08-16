import { NextResponse } from "next/server";

import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { getPlatformSession, type PlatformSession } from "@/lib/platform-session";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import { userHasRole } from "@/lib/user-management-data";
import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import {
  WorkspaceAccessError,
  requireCurrentWorkspace,
  type CurrentWorkspace,
} from "@/lib/workspace-context";

const AUTH_REQUIRED = "Authentication required.";
const INSUFFICIENT_PRIVILEGES = "Insufficient privileges.";
const WORKSPACE_ACCESS_DENIED = "Workspace access denied.";

/**
 * Authenticated internal user with operator role Admin.
 * 401 = no session; 403 = wrong user type or non-Admin role.
 */
export async function requireInternalAdministratorSession(): Promise<
  { error: NextResponse } | { session: PlatformSession }
> {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: AUTH_REQUIRED }, { status: 401 }) };
  }

  if (session.userType !== "internal") {
    return {
      error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  try {
    const operator = await getInternalOperatorByUsername(session.username);
    if (!operator || !userHasRole(operator, "Admin")) {
      return {
        error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
      };
    }
  } catch {
    return {
      error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
    };
  }

  return { session };
}

/**
 * Authenticated internal user with an active workspace context.
 * Used by internal module APIs (e.g. Unit311 Details) that are not Admin-only.
 * 401 = no session / no workspace; 403 = external user.
 */
export async function requireInternalWorkspaceSession(): Promise<
  { error: NextResponse } | { session: PlatformSession; workspace: CurrentWorkspace }
> {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: AUTH_REQUIRED }, { status: 401 }) };
  }

  try {
    const workspace = await requireCurrentWorkspace();

    if (isDemoWorkspaceSlug(workspace.slug)) {
      return { session, workspace };
    }

    if (session.userType === "internal") {
      return { session, workspace };
    }

    // Customer workspace operators: trust live DB when the session cookie is stale
    // (e.g. user_type flipped external→internal) or when an owner/admin was
    // mis-provisioned as external — otherwise Clients Dashboard hides portal metrics.
    if (isCustomerWorkspaceSlug(workspace.slug) && isSupabaseConfigured()) {
      const supabase = isSupabaseServiceRoleConfigured()
        ? createSupabaseServiceRoleClient()
        : createSupabaseServerClient();
      const { data: platformUser } = await supabase
        .from("platform_users")
        .select("user_type, is_active")
        .eq("id", session.sub)
        .maybeSingle();

      if (platformUser && platformUser.is_active !== false) {
        if (platformUser.user_type === "internal") {
          return {
            session: { ...session, userType: "internal" },
            workspace,
          };
        }

        const { data: membership } = await supabase
          .from("workspace_users")
          .select("role, is_owner")
          .eq("workspace_id", workspace.id)
          .eq("user_id", session.sub)
          .maybeSingle();
        const role = String(membership?.role ?? "").toLowerCase();
        const isOperator =
          Boolean(membership?.is_owner) || role === "owner" || role === "admin";
        if (isOperator) {
          return {
            session: { ...session, userType: "internal" },
            workspace,
          };
        }
      }
    }

    return {
      error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
    };
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return {
        error: NextResponse.json(
          { error: error.message || WORKSPACE_ACCESS_DENIED },
          { status: error.status },
        ),
      };
    }
    const message = error instanceof Error ? error.message : AUTH_REQUIRED;
    return { error: NextResponse.json({ error: message }, { status: 401 }) };
  }
}

/**
 * Admin operator on an authorised internal workspace host.
 * Does not change the global operators catalogue — only gates API access.
 */
export async function requireInternalAdministratorWorkspaceSession(): Promise<
  { error: NextResponse } | { session: PlatformSession; workspace: CurrentWorkspace }
> {
  const workspaceAuth = await requireInternalWorkspaceSession();
  if ("error" in workspaceAuth) return workspaceAuth;

  const adminAuth = await requireInternalAdministratorSession();
  if ("error" in adminAuth) return adminAuth;

  return { session: adminAuth.session, workspace: workspaceAuth.workspace };
}

function isCustomerWorkspaceSlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    normalized !== "unit311" &&
    normalized !== "internal" &&
    normalized !== "demo"
  );
}

/**
 * Users module gate:
 * - Unit311 / Demo: require global Admin operator (unchanged).
 * - Customer workspaces (e.g. corpcentre): allow workspace owner/admin members,
 *   including platform users marked internal for that tenant.
 */
export async function requireUsersModuleAdministratorSession(): Promise<
  { error: NextResponse } | { session: PlatformSession; workspace: CurrentWorkspace }
> {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: AUTH_REQUIRED }, { status: 401 }) };
  }

  if (!isSupabaseConfigured()) {
    return {
      error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  let workspace: CurrentWorkspace;
  try {
    workspace = await requireCurrentWorkspace();
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return {
        error: NextResponse.json(
          { error: error.message || WORKSPACE_ACCESS_DENIED },
          { status: error.status },
        ),
      };
    }
    const message = error instanceof Error ? error.message : AUTH_REQUIRED;
    return { error: NextResponse.json({ error: message }, { status: 401 }) };
  }

  if (!isCustomerWorkspaceSlug(workspace.slug)) {
    return requireInternalAdministratorWorkspaceSession();
  }

  // Customer tenant: session user must be an active workspace owner/admin.
  try {
    const supabase = createSupabaseServerClient();
    const username = session.username.trim().toLowerCase();
    // Quote values so emails with @ work in PostgREST `.or(...)` filters.
    const escaped = username.replace(/"/g, '\\"');
    const { data: platformUser } = await supabase
      .from("platform_users")
      .select("id, is_active, workspace_id")
      .eq("workspace_id", workspace.id)
      .or(`username.eq."${escaped}",email.eq."${escaped}"`)
      .maybeSingle();

    if (!platformUser?.id || platformUser.is_active === false) {
      return {
        error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
      };
    }

    const { data: membership } = await supabase
      .from("workspace_users")
      .select("role, is_owner")
      .eq("workspace_id", workspace.id)
      .eq("user_id", platformUser.id)
      .maybeSingle();

    const role = String(membership?.role ?? "").toLowerCase();
    const allowed =
      Boolean(membership?.is_owner) || role === "owner" || role === "admin";

    if (!allowed) {
      return {
        error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
      };
    }

    return { session, workspace };
  } catch {
    return {
      error: NextResponse.json({ error: INSUFFICIENT_PRIVILEGES }, { status: 403 }),
    };
  }
}
