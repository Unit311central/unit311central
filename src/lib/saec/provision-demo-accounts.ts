import "server-only";

import { scryptSync, timingSafeEqual } from "node:crypto";

import { defaultHomeTilesForRoles } from "@/lib/access-presets";
import {
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "@/lib/platform-auth";
import { validatePlatformSignupPassword } from "@/lib/platform-password-validation";
import { SAEC_SLUG } from "@/lib/saec-surface";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

const FORBIDDEN_EMAILS = new Set([
  "demo@unit311central.com",
  "demo@interfaceworx.com",
  "demo@interfaceworx.co.uk",
]);

export type SaecDemoAccountSpec = {
  email: string;
  displayName: string;
  operatorLabel?: string;
};

export const SAEC_DEMO_ACCOUNT_SPECS: SaecDemoAccountSpec[] = [
  {
    email: "admin@omnitransit.com",
    displayName: "OmniTransit Demo Administrator",
    operatorLabel: "OmniTransit Admin",
  },
  {
    email: "demo@omnitransit.com",
    displayName: "OmniTransit Demo",
    operatorLabel: "OmniTransit Demo",
  },
];

export type ProvisionedSaecDemoAccount = {
  email: string;
  userId: string;
  workspaceRole: "admin";
  workspaceMembership: { role: string; is_owner: boolean };
  operator: {
    role: string;
    roles: string[];
    department: string;
    departments: string[];
    allowedViews: null;
  };
  passwordVerifies: boolean;
  removedForeignMemberships: number;
};

export type ProvisionSaecDemoAccountsResult = {
  ok: true;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  accounts: ProvisionedSaecDemoAccount[];
  loginUrl: string;
};

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

async function removeOtherWorkspaceMemberships(
  supabase: ReturnType<typeof createTenancyServerClient>,
  userId: string,
  saecWorkspaceId: string,
): Promise<number> {
  const { data: memberships, error } = await supabase
    .from("workspace_users")
    .select("id, workspace_id")
    .eq("user_id", userId);
  if (error) throw new Error(`workspace_users list: ${error.message}`);

  const foreign = (memberships ?? []).filter((row) => row.workspace_id !== saecWorkspaceId);
  if (foreign.length === 0) return 0;

  const { error: deleteErr } = await supabase
    .from("workspace_users")
    .delete()
    .eq("user_id", userId)
    .neq("workspace_id", saecWorkspaceId);
  if (deleteErr) throw new Error(`workspace_users cleanup: ${deleteErr.message}`);
  return foreign.length;
}

async function upsertSaecDemoAccount(
  supabase: ReturnType<typeof createTenancyServerClient>,
  workspace: { id: string; slug: string; name: string },
  spec: SaecDemoAccountSpec,
  password: string,
): Promise<ProvisionedSaecDemoAccount> {
  const email = spec.email.trim().toLowerCase();
  if (FORBIDDEN_EMAILS.has(email)) {
    throw new Error(`Refusing forbidden reuse email: ${email}`);
  }

  const username = normalizePlatformUsername(email);
  const passwordHash = hashPlatformPasswordForUser(username, password);
  const now = new Date().toISOString();
  const fullName = spec.displayName.trim();
  const operatorLabel = spec.operatorLabel?.trim() || fullName.split(/\s+/)[0] || "Operator";

  const { data: byEmail } = await supabase
    .from("platform_users")
    .select("id, email, username, workspace_id, user_type")
    .eq("email", email)
    .maybeSingle();
  const { data: byUsername } = await supabase
    .from("platform_users")
    .select("id, email, username, workspace_id, user_type")
    .eq("username", username)
    .maybeSingle();

  let userId = byEmail?.id || byUsername?.id;
  if (userId && byEmail?.id && byUsername?.id && byEmail.id !== byUsername.id) {
    throw new Error(`Conflicting platform_users rows for ${email} — manual cleanup required.`);
  }

  const patch = {
    username,
    display_name: fullName,
    password_hash: passwordHash,
    user_type: "internal" as const,
    redirect_path: "/dashboard",
    client_name: workspace.name,
    is_active: true,
    email,
    email_verified_at: now,
    workspace_id: workspace.id,
    updated_at: now,
  };

  if (userId) {
    const existingWorkspaceId = byEmail?.workspace_id || byUsername?.workspace_id;
    if (existingWorkspaceId && existingWorkspaceId !== workspace.id) {
      throw new Error(
        `${email} is assigned to another workspace (${existingWorkspaceId}). Refusing cross-tenant reuse.`,
      );
    }
    const { error } = await supabase.from("platform_users").update(patch).eq("id", userId);
    if (error) throw new Error(`platform_users update: ${error.message}`);
  } else {
    const { data: user, error } = await supabase
      .from("platform_users")
      .insert(patch)
      .select("id")
      .single();
    if (error) throw new Error(`platform_users insert: ${error.message}`);
    userId = user.id;
  }

  const { data: membership, error: memErr } = await supabase
    .from("workspace_users")
    .select("id, role, is_owner")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (memErr) throw new Error(`workspace_users lookup: ${memErr.message}`);

  if (!membership) {
    const { error } = await supabase.from("workspace_users").insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: "admin",
      is_owner: false,
    });
    if (error) throw new Error(`workspace_users insert: ${error.message}`);
  } else if (membership.role !== "admin" || membership.is_owner !== false) {
    const { error } = await supabase
      .from("workspace_users")
      .update({ role: "admin", is_owner: false, updated_at: now })
      .eq("id", membership.id);
    if (error) throw new Error(`workspace_users update: ${error.message}`);
  }

  const operatorPayload = {
    id: userId,
    operator_label: operatorLabel,
    full_name: fullName,
    username,
    email,
    phone: null,
    role: "Admin",
    roles: ["Admin"],
    department: "Corporate",
    departments: ["Corporate"],
    status: "Active",
    region: "",
    license_id: null,
    notes: `SAEC client demonstration · ${workspace.name}`,
    allowed_views: null,
    dashboard_prefs: { homeTiles: defaultHomeTilesForRoles(["Admin"], ["Corporate"]) },
    updated_at: now,
  };

  const { data: existingOperatorById } = await supabase
    .from("internal_operators")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  const { data: existingOperatorByUsername } = existingOperatorById?.id
    ? { data: null }
    : await supabase.from("internal_operators").select("id").eq("username", username).maybeSingle();
  const existingOperator = existingOperatorById ?? existingOperatorByUsername;

  if (existingOperator?.id) {
    const { error } = await supabase
      .from("internal_operators")
      .update(operatorPayload)
      .eq("id", existingOperator.id);
    if (error) throw new Error(`internal_operators update: ${error.message}`);
  } else {
    const { error } = await supabase.from("internal_operators").insert({
      ...operatorPayload,
      created_at: now,
    });
    if (error) throw new Error(`internal_operators insert: ${error.message}`);
  }

  const removedForeignMemberships = await removeOtherWorkspaceMemberships(
    supabase,
    userId,
    workspace.id,
  );

  const { data: stored } = await supabase
    .from("platform_users")
    .select("id, password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (!stored?.password_hash) throw new Error("Password hash missing after provisioning.");
  const passwordVerifies = verifyPassword(password, stored.password_hash);
  if (!passwordVerifies) throw new Error(`Password verification failed for ${email}.`);

  return {
    email,
    userId,
    workspaceRole: "admin",
    workspaceMembership: { role: "admin", is_owner: false },
    operator: {
      role: "Admin",
      roles: ["Admin"],
      department: "Corporate",
      departments: ["Corporate"],
      allowedViews: null,
    },
    passwordVerifies,
    removedForeignMemberships,
  };
}

/**
 * Provision SAEC-only full-access demonstration accounts (admin@saec.biz, demo@saec.biz).
 * Password is supplied at runtime only — never stored in source control.
 */
export async function provisionSaecDemoAccounts(password: string): Promise<ProvisionSaecDemoAccountsResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured on this deployment.");
  }

  const validationError = validatePlatformSignupPassword(password);
  if (validationError) throw new Error(validationError);

  const supabase = createTenancyServerClient();
  const { data: ws, error: wsErr } = await supabase
    .from("workspaces")
    .select("id, slug, name, status")
    .eq("slug", SAEC_SLUG)
    .maybeSingle();
  if (wsErr || !ws?.id) {
    throw new Error(`SAEC workspace missing: ${wsErr?.message || "not found"}`);
  }
  if (ws.slug !== SAEC_SLUG) throw new Error("SAEC workspace slug mismatch — refusing");

  const accounts: ProvisionedSaecDemoAccount[] = [];
  for (const spec of SAEC_DEMO_ACCOUNT_SPECS) {
    accounts.push(await upsertSaecDemoAccount(supabase, ws, spec, password));
  }

  return {
    ok: true,
    workspaceId: ws.id,
    workspaceSlug: ws.slug,
    workspaceName: ws.name,
    accounts,
    loginUrl: "https://omnitransit.unit311central.com/login",
  };
}
