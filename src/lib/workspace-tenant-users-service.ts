import {
  createBlankUserInput,
  mapInternalOperator,
  normalizeUserDepartments,
  normalizeUserRoles,
  primaryUserDepartment,
  primaryUserRole,
  type ManagedUser,
  type UserRole,
} from "@/lib/user-management-data";
import { ensureInternalOperatorsTable } from "@/lib/internal-db-migrations";
import {
  generatePlatformPassword,
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "@/lib/platform-auth";
import { validatePlatformSignupPassword } from "@/lib/platform-password-validation";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { defaultAllowedViewsForRoles } from "@/lib/access-presets";

const OPERATOR_SELECT =
  "id, operator_label, full_name, username, email, phone, role, roles, status, region, license_id, notes, department, departments, allowed_views, dashboard_prefs, created_at, updated_at";

function requireTenancySupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  return createTenancyServerClient();
}

/** Map Tools → Users role to workspace_users.role for customer tenants. */
export function mapUserRoleToWorkspaceRole(role: UserRole): string {
  switch (role) {
    case "Admin":
      return "admin";
    case "Manager":
      return "manager";
    case "Exec":
      return "exec";
    case "Board":
      return "board";
    default:
      return "member";
  }
}

export function mergeWorkspaceTenantUserRecord(input: {
  platformUserId: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  clientName: string | null;
  workspaceRole: string;
  isOwner: boolean;
  operator: Parameters<typeof mapInternalOperator>[0] | null;
}): ManagedUser {
  if (input.operator) {
    const mapped = mapInternalOperator(input.operator);
    return {
      ...mapped,
      id: input.platformUserId,
      username: input.username,
      email: input.email,
      fullName: mapped.fullName || input.fullName,
      status: input.isActive ? mapped.status : "Inactive",
    };
  }

  const role = mapWorkspaceRoleToUserRole(input.workspaceRole, input.isOwner);
  const roles = [role];
  const departments = ["Operations"] as const;
  return {
    id: input.platformUserId,
    operatorLabel: input.fullName.split(/\s+/)[0] || "User",
    fullName: input.fullName,
    username: input.username,
    email: input.email,
    phone: "",
    role: primaryUserRole(roles),
    roles,
    department: "Operations",
    departments: [...departments],
    status: input.isActive ? "Active" : "Inactive",
    region: "",
    licenseId: "",
    notes: input.clientName ? `Workspace member · ${input.clientName}` : "Workspace member",
    allowedViews: defaultAllowedViewsForRoles(roles, [...departments]),
    dashboardPrefs: null,
  };
}

function mapWorkspaceRoleToUserRole(role: string | null | undefined, isOwner: boolean): UserRole {
  if (isOwner) return "Admin";
  const normalized = String(role ?? "").toLowerCase();
  if (normalized === "owner" || normalized === "admin") return "Admin";
  if (normalized === "manager") return "Manager";
  if (normalized === "exec") return "Exec";
  if (normalized === "board") return "Board";
  return "Associate";
}

export async function findWorkspaceTenantOperatorByUsername(username: string) {
  await ensureInternalOperatorsTable();
  const supabase = requireTenancySupabase();
  const normalized = normalizePlatformUsername(username);
  const { data, error } = await supabase
    .from("internal_operators")
    .select(OPERATOR_SELECT)
    .eq("username", normalized)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Parameters<typeof mapInternalOperator>[0] | null) ?? null;
}

export async function createWorkspaceTenantUser(
  workspaceId: string,
  companyName: string,
  input: Partial<ManagedUser> & { fullName: string; username: string; password?: string },
): Promise<{ user: ManagedUser; temporaryPassword: string }> {
  await ensureInternalOperatorsTable();
  const supabase = requireTenancySupabase();
  const blank = createBlankUserInput();
  const username = normalizePlatformUsername(
    input.username?.trim() || input.email?.trim() || "",
  );
  if (!username) {
    throw new Error("Email address is required.");
  }

  const email = input.email?.trim().toLowerCase() || username;
  const fullName = input.fullName.trim();
  const password = input.password?.trim() || generatePlatformPassword();
  if (input.password?.trim()) {
    const validationError = validatePlatformSignupPassword(password);
    if (validationError) throw new Error(validationError);
  }

  const roles = normalizeUserRoles(input.roles ?? [input.role ?? blank.role], input.role ?? blank.role);
  const role = primaryUserRole(roles);
  const departments = normalizeUserDepartments(
    input.departments ?? [input.department ?? blank.department],
    input.department ?? blank.department,
  );
  const department = primaryUserDepartment(departments);
  const workspaceRole = mapUserRoleToWorkspaceRole(role);
  const isActive = (input.status ?? blank.status) !== "Inactive";
  const passwordHash = hashPlatformPasswordForUser(username, password);

  const { data: existingByEmail } = await supabase
    .from("platform_users")
    .select("id, workspace_id, username")
    .eq("email", email)
    .maybeSingle();

  if (existingByEmail?.id) {
    const existingWorkspaceId = existingByEmail.workspace_id
      ? String(existingByEmail.workspace_id)
      : null;
    if (existingWorkspaceId && existingWorkspaceId !== workspaceId) {
      throw new Error(
        `The email ${email} is already assigned to another workspace. Use a different email.`,
      );
    }
    const { data: existingMembership } = await supabase
      .from("workspace_users")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", existingByEmail.id)
      .maybeSingle();
    if (existingMembership?.id) {
      throw new Error(`A user with email ${email} already exists in this workspace.`);
    }
  }

  const { data: existingByUsername } = await supabase
    .from("platform_users")
    .select("id, workspace_id")
    .eq("username", username)
    .maybeSingle();

  if (existingByUsername?.id) {
    const existingWorkspaceId = existingByUsername.workspace_id
      ? String(existingByUsername.workspace_id)
      : null;
    if (existingWorkspaceId && existingWorkspaceId !== workspaceId) {
      throw new Error(
        `The email ${email} is already assigned to another workspace. Use a different email.`,
      );
    }
    const { data: existingMembership } = await supabase
      .from("workspace_users")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", existingByUsername.id)
      .maybeSingle();
    if (existingMembership?.id) {
      throw new Error(`A user with email ${email} already exists in this workspace.`);
    }
  }

  const platformPatch = {
    username,
    display_name: fullName,
    email,
    password_hash: passwordHash,
    user_type: "internal" as const,
    redirect_path: "/dashboard",
    client_name: companyName.trim() || null,
    is_active: isActive,
    email_verified_at: new Date().toISOString(),
    workspace_id: workspaceId,
    updated_at: new Date().toISOString(),
  };

  let platformUserId: string;
  if (existingByEmail?.id || existingByUsername?.id) {
    platformUserId = String(existingByEmail?.id ?? existingByUsername?.id);
    const { error } = await supabase.from("platform_users").update(platformPatch).eq("id", platformUserId);
    if (error) throw new Error(error.message);
  } else {
    const { data: created, error } = await supabase
      .from("platform_users")
      .insert(platformPatch)
      .select("id")
      .single();
    if (error || !created?.id) {
      throw new Error(error?.message || "Failed to create platform user.");
    }
    platformUserId = String(created.id);
  }

  const { data: existingMembership } = await supabase
    .from("workspace_users")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", platformUserId)
    .maybeSingle();

  if (existingMembership?.id) {
    const { error } = await supabase
      .from("workspace_users")
      .update({
        role: workspaceRole,
        is_owner: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingMembership.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("workspace_users").insert({
      workspace_id: workspaceId,
      user_id: platformUserId,
      role: workspaceRole,
      is_owner: false,
    });
    if (error) throw new Error(error.message);
  }

  const operatorPayload = {
    id: platformUserId,
    operator_label: input.operatorLabel?.trim() || fullName.split(/\s+/)[0] || "Operator",
    full_name: fullName,
    username,
    email,
    phone: input.phone?.trim() || null,
    role,
    roles,
    department,
    departments,
    status: input.status ?? blank.status,
    region: (input.region ?? blank.region).trim(),
    license_id: input.licenseId?.trim() || null,
    notes: input.notes?.trim() || null,
    allowed_views: input.allowedViews ?? blank.allowedViews,
    dashboard_prefs: input.dashboardPrefs ?? blank.dashboardPrefs,
    updated_at: new Date().toISOString(),
  };

  const { data: existingOperatorById } = await supabase
    .from("internal_operators")
    .select("id")
    .eq("id", platformUserId)
    .maybeSingle();

  const { data: existingOperatorByUsername } = existingOperatorById?.id
    ? { data: null }
    : await supabase
        .from("internal_operators")
        .select("id")
        .eq("username", username)
        .maybeSingle();

  const existingOperator = existingOperatorById ?? existingOperatorByUsername;

  if (existingOperator?.id) {
    const { error } = await supabase
      .from("internal_operators")
      .update(operatorPayload)
      .eq("id", existingOperator.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("internal_operators").insert({
      ...operatorPayload,
      created_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  const operator = await findWorkspaceTenantOperatorByUsername(username);
  const user = mergeWorkspaceTenantUserRecord({
    platformUserId,
    username,
    email,
    fullName,
    isActive,
    clientName: companyName.trim() || null,
    workspaceRole,
    isOwner: false,
    operator,
  });

  return { user, temporaryPassword: password };
}
