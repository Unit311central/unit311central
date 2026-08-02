import {
  buildPlatformSession,
  createPlatformSessionToken,
  normalizePlatformUsername,
  verifyPlatformPassword,
  type PlatformSession,
  type PlatformUserRecord,
} from "@/lib/platform-auth";
import { canonicalizeStoredRedirectPath } from "@/lib/app-domains";
import { getMemberPortalByPath } from "@/lib/abhi/member-portal-routes";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { resolveWorkspaceOnboardingRedirectForUser } from "@/lib/workspace-customer-onboarding-service";
import { formatWorkspaceDisplayStatus } from "@/lib/workspace-host";
import type { ManagedUser, UserRole } from "@/lib/user-management-data";
import { primaryUserRole } from "@/lib/user-management-data";
import { defaultAllowedViewsForRoles } from "@/lib/access-presets";

function requirePlatformUsersSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  return createSupabaseServerClient();
}

function isActiveSubscriptionStatus(value: unknown) {
  return (
    String(value ?? "")
      .trim()
      .toLowerCase() === "active"
  );
}

function isActiveAccountStatus(value: unknown) {
  return (
    String(value ?? "")
      .trim()
      .toLowerCase() === "active"
  );
}

type SubscriptionGateClient = {
  id: string;
  subscription_status: string | null;
  account_status: string | null;
  workspace_id: string | null;
  platform_organisation_id: string | null;
};

async function findClientForSubscriptionGate(
  user: PlatformUserRecord,
  workspaceSlug?: string | null,
): Promise<{ client: SubscriptionGateClient | null; workspaceStatus: string | null }> {
  const supabase = requirePlatformUsersSupabase();
  const organisationId = user.organisation_id?.trim() || null;
  const userWorkspaceId = user.workspace_id?.trim() || null;
  const slug = workspaceSlug?.trim().toLowerCase() || null;

  let workspaceStatus: string | null = null;
  let workspaceId: string | null = userWorkspaceId;

  if (slug) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, status")
      .eq("slug", slug)
      .maybeSingle();
    if (workspace?.id) {
      workspaceId = String(workspace.id);
      workspaceStatus = workspace.status ? String(workspace.status) : null;
    }
  }

  const selectCols =
    "id, subscription_status, account_status, workspace_id, platform_organisation_id";

  if (organisationId) {
    const { data } = await supabase
      .from("internal_clients")
      .select(selectCols)
      .eq("platform_organisation_id", organisationId)
      .maybeSingle();
    if (data) {
      const client = data as SubscriptionGateClient;
      if (!workspaceId && client.workspace_id) workspaceId = String(client.workspace_id);
      if (workspaceId && workspaceStatus == null) {
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("status")
          .eq("id", workspaceId)
          .maybeSingle();
        workspaceStatus = workspace?.status ? String(workspace.status) : null;
      }
      return { client, workspaceStatus };
    }
  }

  if (workspaceId) {
    const { data } = await supabase
      .from("internal_clients")
      .select(selectCols)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (data) {
      if (workspaceStatus == null) {
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("status")
          .eq("id", workspaceId)
          .maybeSingle();
        workspaceStatus = workspace?.status ? String(workspace.status) : null;
      }
      return { client: data as SubscriptionGateClient, workspaceStatus };
    }
  }

  const { data: membership } = await supabase
    .from("workspace_users")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membership?.workspace_id) {
    const memberWorkspaceId = String(membership.workspace_id);
    const [{ data: client }, { data: workspace }] = await Promise.all([
      supabase
        .from("internal_clients")
        .select(selectCols)
        .eq("workspace_id", memberWorkspaceId)
        .maybeSingle(),
      supabase.from("workspaces").select("status").eq("id", memberWorkspaceId).maybeSingle(),
    ]);
    return {
      client: (client as SubscriptionGateClient | null) ?? null,
      workspaceStatus: workspace?.status ? String(workspace.status) : workspaceStatus,
    };
  }

  return { client: null, workspaceStatus };
}

/**
 * External users must complete payment before workspace access.
 * Gate uses client.subscription_status + workspace.status only —
 * never invoice paid status or organisation.payment_verified_at.
 * Test Activation sets subscription_status=active and workspace.status=Active
 * while leaving the invoice unpaid; that must unlock login the same as Wise.
 */
export async function resolveSubscriptionRedirectForUser(
  user: PlatformUserRecord,
  options?: { workspaceSlug?: string | null },
) {
  if (user.user_type !== "external") {
    return null;
  }

  // Talanton portfolio company portal demo accounts — never force /payment.
  if (
    String(user.redirect_path ?? "").match(
      /^\/(ethicalapparelafrica|arcrideglobal|burnstoves|kentegrabiotech|longmilescoffee|pharmakina|moko|pwr|autosprings|biofarms|endasportswear|kijaniforestry|kivutilapia|masakafarms|owppharma|pezesha|poa|rabboni|tarajischools)(\/|$)/i,
    )
  ) {
    return null;
  }

  // ABHI member portal demo accounts — never force /payment.
  if (getMemberPortalByPath(String(user.redirect_path ?? ""))) {
    return null;
  }

  try {
    const { client, workspaceStatus } = await findClientForSubscriptionGate(
      user,
      options?.workspaceSlug,
    );

    if (!client) {
      return "/payment";
    }

    const subscriptionActive = isActiveSubscriptionStatus(client.subscription_status);
    // Legacy rows may lack subscription_status after older CRM Active force-writes.
    const legacyActiveWithoutSubscriptionColumn =
      isActiveAccountStatus(client.account_status) && !client.subscription_status;

    if (!subscriptionActive && !legacyActiveWithoutSubscriptionColumn) {
      return "/payment";
    }

    if (workspaceStatus != null) {
      const display = formatWorkspaceDisplayStatus(workspaceStatus);
      if (display !== "Active") {
        return "/payment";
      }
    }

    return null;
  } catch {
    // Prefer sending external users to payment rather than granting access on errors.
    return "/payment";
  }
}

export async function findPlatformUserById(id: string) {
  const supabase = requirePlatformUsersSupabase();

  const { data, error } = await supabase
    .from("platform_users")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PlatformUserRecord | null) ?? null;
}

export async function findPlatformUsersByEmail(email: string) {
  const supabase = requirePlatformUsersSupabase();
  const normalized = normalizePlatformUsername(email);

  const { data: emailMatches, error: emailError } = await supabase
    .from("platform_users")
    .select("*")
    .eq("is_active", true)
    .eq("email", normalized);

  if (emailError && !emailError.message.includes("email")) {
    throw new Error(emailError.message);
  }

  const users = new Map<string, PlatformUserRecord>();
  for (const row of (emailMatches as PlatformUserRecord[] | null) ?? []) {
    users.set(row.id, row);
  }

  const { data: usernameMatches, error: usernameError } = await supabase
    .from("platform_users")
    .select("*")
    .eq("is_active", true)
    .eq("username", normalized);

  if (usernameError) {
    throw new Error(usernameError.message);
  }

  for (const row of (usernameMatches as PlatformUserRecord[] | null) ?? []) {
    users.set(row.id, row);
  }

  return [...users.values()];
}

export async function findPlatformUserByUsername(username: string) {
  const supabase = requirePlatformUsersSupabase();
  const normalized = normalizePlatformUsername(username);

  const { data, error } = await supabase
    .from("platform_users")
    .select("*")
    .eq("username", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PlatformUserRecord | null) ?? null;
}

export async function authenticatePlatformUser(username: string, password: string) {
  const normalized = normalizePlatformUsername(username);

  // Exact username wins first. Emails can collide across signup-generated
  // usernames (e.g. demo@x / demo@x#abcd); prefer the canonical account.
  const byUsername = await findPlatformUserByUsername(normalized);
  if (byUsername && verifyPlatformPassword(password, byUsername.password_hash)) {
    return byUsername;
  }

  if (!normalized.includes("@")) {
    return null;
  }

  const matches = await findPlatformUsersByEmail(normalized);
  const passwordMatches = matches.filter((user) =>
    verifyPlatformPassword(password, user.password_hash),
  );
  if (passwordMatches.length === 0) {
    return null;
  }

  passwordMatches.sort((a, b) => {
    const aExact = normalizePlatformUsername(a.username) === normalized ? 0 : 1;
    const bExact = normalizePlatformUsername(b.username) === normalized ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;

    const aInternal = a.user_type === "internal" ? 0 : 1;
    const bInternal = b.user_type === "internal" ? 0 : 1;
    if (aInternal !== bInternal) return aInternal - bInternal;

    return String(a.created_at).localeCompare(String(b.created_at));
  });

  return passwordMatches[0] ?? null;
}

export async function createSessionForUser(
  user: PlatformUserRecord,
  workspace?: { id: string; slug: string; name: string } | null,
) {
  const session = buildPlatformSession(user, workspace);
  return {
    session,
    token: await createPlatformSessionToken(session),
    redirectPath: canonicalizeStoredRedirectPath(user.redirect_path),
  };
}

export type LoginPlatformUserResult =
  | {
      session: PlatformSession;
      token: string;
      redirectPath: string;
    }
  | { forbidden: true };

export async function loginPlatformUser(
  username: string,
  password: string,
  options?: { workspaceSlug?: string | null },
): Promise<LoginPlatformUserResult | null> {
  const user = await authenticatePlatformUser(username, password);
  if (!user) {
    return null;
  }

  const { resolveWorkspaceBinding } = await import("@/lib/workspace-context");
  const { authorizeUserForWorkspace } = await import("@/lib/workspace-authorization");

  let workspace = await resolveWorkspaceBinding({
    workspaceSlug: options?.workspaceSlug,
    userWorkspaceId: user.workspace_id ?? null,
    fallbackInternal: user.user_type === "internal",
  });

  if (workspace) {
    const decision = await authorizeUserForWorkspace(user.id, workspace.id, {
      workspace,
      userTypeHint: user.user_type,
    });

    if (!decision.allowed) {
      // Explicit customer return_to host: never bind an unauthorised tenant.
      if (options?.workspaceSlug) {
        return { forbidden: true };
      }

      // No host return_to: fall back to the user's primary workspace when different.
      const primary = user.workspace_id
        ? await resolveWorkspaceBinding({
            userWorkspaceId: user.workspace_id,
            fallbackInternal: false,
          })
        : null;
      if (primary && primary.id !== workspace.id) {
        const primaryDecision = await authorizeUserForWorkspace(user.id, primary.id, {
          workspace: primary,
          userTypeHint: user.user_type,
        });
        workspace = primaryDecision.allowed ? primary : null;
      } else {
        workspace = null;
      }
    }
  }

  const session = await createSessionForUser(user, workspace);
  const subscriptionRedirect = await resolveSubscriptionRedirectForUser(user, {
    workspaceSlug: options?.workspaceSlug,
  });
  if (subscriptionRedirect) {
    return {
      ...session,
      redirectPath: subscriptionRedirect,
    };
  }

  try {
    const onboardingRedirect = await resolveWorkspaceOnboardingRedirectForUser({
      id: user.id,
      organisation_id: user.organisation_id ?? null,
      email: user.email ?? null,
      username: user.username,
    });
    if (onboardingRedirect) {
      return {
        ...session,
        redirectPath: onboardingRedirect,
      };
    }
  } catch {
    // Non-blocking — fall through to default redirect.
  }

  return session;
}

function mapWorkspaceRoleToUserRole(role: string | null | undefined, isOwner: boolean): UserRole {
  if (isOwner) return "Admin";
  const normalized = String(role ?? "").toLowerCase();
  if (normalized === "owner" || normalized === "admin") return "Admin";
  if (normalized === "manager") return "Manager";
  if (normalized === "exec") return "Exec";
  return "Associate";
}

/**
 * Customer-workspace internal users list (platform_users ∩ workspace_users).
 * Used by Tools → Users on corpcentre and other customer tenants — not the global
 * Unit311 `internal_operators` catalogue.
 */
export async function listWorkspaceTenantUsers(workspaceId: string): Promise<ManagedUser[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const supabase = createSupabaseServerClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_users")
    .select("user_id, role, is_owner")
    .eq("workspace_id", workspaceId);
  if (membershipError) throw new Error(membershipError.message);

  const userIds = (memberships ?? [])
    .map((row) => String(row.user_id ?? ""))
    .filter(Boolean);
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from("platform_users")
    .select("id, username, display_name, email, is_active, user_type, client_name")
    .in("id", userIds)
    .eq("workspace_id", workspaceId);
  if (usersError) throw new Error(usersError.message);

  const membershipByUser = new Map(
    (memberships ?? []).map((row) => [String(row.user_id), row] as const),
  );

  return (users ?? [])
    .filter((user) => user.user_type === "internal" || user.user_type === "external")
    .map((user) => {
      const membership = membershipByUser.get(String(user.id));
      const role = mapWorkspaceRoleToUserRole(
        membership?.role as string | undefined,
        Boolean(membership?.is_owner),
      );
      const roles = [role];
      const fullName = String(user.display_name || user.username || "").trim() || "User";
      const email = String(user.email || user.username || "");
      return {
        id: String(user.id),
        operatorLabel: fullName.split(/\s+/)[0] || "User",
        fullName,
        username: String(user.username || email),
        email,
        phone: "",
        role: primaryUserRole(roles),
        roles,
        department: "Operations",
        departments: ["Operations"],
        status: user.is_active === false ? "Inactive" : "Active",
        region: "Multi-site",
        licenseId: "",
        notes: user.client_name ? `Workspace member · ${user.client_name}` : "Workspace member",
        allowedViews: defaultAllowedViewsForRoles(roles, ["Operations"]),
        dashboardPrefs: null,
      } satisfies ManagedUser;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export type { PlatformSession, PlatformUserRecord };
