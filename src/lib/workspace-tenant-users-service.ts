import {
  createBlankUserInput,
  mapInternalOperator,
  normalizeUserDepartments,
  normalizeUserRoles,
  primaryUserDepartment,
  primaryUserRole,
  type ManagedUser,
  type UserDashboardPrefs,
  type UserDepartment,
  type UserRegion,
  type UserRole,
  type UserStatus,
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
import type { InternalOperationsView } from "@/lib/internal-operations-data";

const OPERATOR_SELECT =
  "id, operator_label, full_name, username, email, phone, role, roles, status, region, license_id, notes, department, departments, allowed_views, dashboard_prefs, created_at, updated_at";

function requireTenancySupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  return createTenancyServerClient();
}

export class WorkspaceTenantUserError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "WorkspaceTenantUserError";
    this.status = status;
  }
}

type WorkspaceTenantMembership = {
  id: string;
  role: string;
  is_owner: boolean;
};

type WorkspaceTenantPlatformUser = {
  id: string;
  username: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean | null;
  workspace_id: string | null;
  client_name: string | null;
};

export type WorkspaceTenantUserPatch = Partial<{
  operatorLabel: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  roles: UserRole[];
  department: UserDepartment;
  departments: UserDepartment[];
  status: UserStatus;
  region: UserRegion;
  licenseId: string;
  notes: string;
  allowedViews: InternalOperationsView[] | null;
  dashboardPrefs: UserDashboardPrefs | null;
}>;

function isWorkspaceAdministratorMembership(membership: WorkspaceTenantMembership) {
  if (membership.is_owner) return true;
  const role = String(membership.role ?? "").toLowerCase();
  return role === "owner" || role === "admin";
}

async function loadWorkspaceTenantUserContext(workspaceId: string, userId: string) {
  const supabase = requireTenancySupabase();

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_users")
    .select("id, role, is_owner")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message);
  if (!membership?.id) {
    throw new WorkspaceTenantUserError("User not found in this workspace.", 404);
  }

  const { data: platformUser, error: platformError } = await supabase
    .from("platform_users")
    .select("id, username, email, display_name, is_active, workspace_id, client_name")
    .eq("id", userId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (platformError) throw new Error(platformError.message);
  if (!platformUser?.id) {
    throw new WorkspaceTenantUserError("User not found in this workspace.", 404);
  }

  return {
    supabase,
    membership: membership as WorkspaceTenantMembership,
    platformUser: platformUser as WorkspaceTenantPlatformUser,
  };
}

async function countWorkspaceAdministrators(workspaceId: string) {
  const supabase = requireTenancySupabase();
  const { data, error } = await supabase
    .from("workspace_users")
    .select("user_id, role, is_owner")
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  return (data ?? []).filter((row) =>
    isWorkspaceAdministratorMembership({
      id: String(row.user_id),
      role: String(row.role ?? ""),
      is_owner: Boolean(row.is_owner),
    }),
  ).length;
}

function buildTenantOperatorPatch(patch: WorkspaceTenantUserPatch) {
  const blank = createBlankUserInput();
  const roles = patch.roles
    ? normalizeUserRoles(patch.roles, patch.role ?? primaryUserRole(patch.roles))
    : patch.role
      ? normalizeUserRoles([patch.role], patch.role)
      : undefined;
  const role = roles ? primaryUserRole(roles) : undefined;
  const departments = patch.departments
    ? normalizeUserDepartments(patch.departments, patch.department ?? primaryUserDepartment(patch.departments))
    : patch.department
      ? normalizeUserDepartments([patch.department], patch.department)
      : undefined;
  const department = departments ? primaryUserDepartment(departments) : undefined;

  return {
    operator_label: patch.operatorLabel?.trim(),
    full_name: patch.fullName?.trim(),
    username: patch.username?.trim().toLowerCase() ?? patch.email?.trim().toLowerCase(),
    email: patch.email?.trim().toLowerCase(),
    phone: patch.phone?.trim(),
    role,
    roles,
    department,
    departments,
    status: patch.status,
    region: patch.region !== undefined ? String(patch.region).trim() : undefined,
    license_id: patch.licenseId?.trim(),
    notes: patch.notes?.trim(),
    allowed_views: patch.allowedViews,
    dashboard_prefs: patch.dashboardPrefs,
    updated_at: new Date().toISOString(),
  };
}

async function assertEmailAvailableForWorkspace(
  workspaceId: string,
  userId: string,
  email: string,
) {
  const supabase = requireTenancySupabase();
  const normalizedEmail = email.trim().toLowerCase();
  const { data: existingByEmail } = await supabase
    .from("platform_users")
    .select("id, workspace_id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingByEmail?.id && String(existingByEmail.id) !== userId) {
    const existingWorkspaceId = existingByEmail.workspace_id
      ? String(existingByEmail.workspace_id)
      : null;
    if (existingWorkspaceId && existingWorkspaceId !== workspaceId) {
      throw new WorkspaceTenantUserError(
        `The email ${normalizedEmail} is already assigned to another workspace.`,
        409,
      );
    }
    throw new WorkspaceTenantUserError(
      `A user with email ${normalizedEmail} already exists in this workspace.`,
      409,
    );
  }

  const username = normalizePlatformUsername(normalizedEmail);
  const { data: existingByUsername } = await supabase
    .from("platform_users")
    .select("id, workspace_id")
    .eq("username", username)
    .maybeSingle();

  if (existingByUsername?.id && String(existingByUsername.id) !== userId) {
    const existingWorkspaceId = existingByUsername.workspace_id
      ? String(existingByUsername.workspace_id)
      : null;
    if (existingWorkspaceId && existingWorkspaceId !== workspaceId) {
      throw new WorkspaceTenantUserError(
        `The email ${normalizedEmail} is already assigned to another workspace.`,
        409,
      );
    }
    throw new WorkspaceTenantUserError(
      `A user with email ${normalizedEmail} already exists in this workspace.`,
      409,
    );
  }
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

export async function updateWorkspaceTenantUser(
  workspaceId: string,
  companyName: string,
  userId: string,
  patch: WorkspaceTenantUserPatch,
): Promise<ManagedUser> {
  await ensureInternalOperatorsTable();
  const { supabase, membership, platformUser } = await loadWorkspaceTenantUserContext(
    workspaceId,
    userId,
  );
  const blank = createBlankUserInput();

  if (membership.is_owner && patch.status === "Inactive") {
    throw new WorkspaceTenantUserError(
      "The workspace owner cannot be deactivated.",
      403,
    );
  }

  const nextEmail = (patch.email?.trim().toLowerCase() ||
    patch.username?.trim().toLowerCase() ||
    platformUser.email ||
    platformUser.username ||
    "").trim();
  if (nextEmail) {
    await assertEmailAvailableForWorkspace(workspaceId, userId, nextEmail);
  }

  const roles = patch.roles
    ? normalizeUserRoles(patch.roles, patch.role ?? blank.role)
    : patch.role
      ? normalizeUserRoles([patch.role], patch.role)
      : undefined;
  const role = roles ? primaryUserRole(roles) : undefined;

  if (membership.is_owner && role && role !== "Admin") {
    throw new WorkspaceTenantUserError(
      "The workspace owner must remain an administrator.",
      403,
    );
  }

  const workspaceRole = role ? mapUserRoleToWorkspaceRole(role) : undefined;
  const isActive =
    patch.status !== undefined ? patch.status !== "Inactive" : platformUser.is_active !== false;
  const fullName = patch.fullName?.trim() || platformUser.display_name || platformUser.username;
  const username = normalizePlatformUsername(
    patch.username?.trim() || patch.email?.trim() || platformUser.username,
  );
  const email = patch.email?.trim().toLowerCase() || platformUser.email || username;

  const platformPatch: Record<string, unknown> = {
    display_name: fullName,
    username,
    email,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };
  if (companyName.trim()) {
    platformPatch.client_name = companyName.trim();
  }

  const { error: platformError } = await supabase
    .from("platform_users")
    .update(platformPatch)
    .eq("id", userId)
    .eq("workspace_id", workspaceId);
  if (platformError) throw new Error(platformError.message);

  if (workspaceRole) {
    const { error: membershipError } = await supabase
      .from("workspace_users")
      .update({
        role: workspaceRole,
        updated_at: new Date().toISOString(),
      })
      .eq("id", membership.id)
      .eq("workspace_id", workspaceId);
    if (membershipError) throw new Error(membershipError.message);
  }

  const operatorPatch = buildTenantOperatorPatch({
    ...patch,
    fullName,
    username,
    email,
    role: membership.is_owner ? "Admin" : role,
    roles: membership.is_owner ? ["Admin"] : roles,
  });

  const operatorPayload = Object.fromEntries(
    Object.entries(operatorPatch).filter(([, value]) => value !== undefined),
  );

  const { data: existingOperator } = await supabase
    .from("internal_operators")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingOperator?.id) {
    const { error } = await supabase
      .from("internal_operators")
      .update(operatorPayload)
      .eq("id", userId);
    if (error) throw new Error(error.message);
  } else {
    const departments = patch.departments
      ? normalizeUserDepartments(patch.departments, patch.department ?? blank.department)
      : normalizeUserDepartments([blank.department], blank.department);
    const effectiveRoles = membership.is_owner
      ? (["Admin"] as UserRole[])
      : roles ?? [mapWorkspaceRoleToUserRole(membership.role, membership.is_owner)];
    const { error } = await supabase.from("internal_operators").insert({
      id: userId,
      operator_label:
        patch.operatorLabel?.trim() || fullName.split(/\s+/)[0] || blank.operatorLabel,
      full_name: fullName,
      username,
      email,
      phone: patch.phone?.trim() || null,
      role: primaryUserRole(effectiveRoles),
      roles: effectiveRoles,
      department: primaryUserDepartment(departments),
      departments,
      status: patch.status ?? blank.status,
      region: (patch.region ?? blank.region).trim(),
      license_id: patch.licenseId?.trim() || null,
      notes: patch.notes?.trim() || null,
      allowed_views: patch.allowedViews ?? defaultAllowedViewsForRoles(effectiveRoles, departments),
      dashboard_prefs: patch.dashboardPrefs ?? blank.dashboardPrefs,
      created_at: new Date().toISOString(),
      ...operatorPayload,
    });
    if (error) throw new Error(error.message);
  }

  const operator = await findWorkspaceTenantOperatorByUsername(username);
  return mergeWorkspaceTenantUserRecord({
    platformUserId: userId,
    username,
    email,
    fullName,
    isActive,
    clientName: companyName.trim() || platformUser.client_name,
    workspaceRole: workspaceRole ?? membership.role,
    isOwner: membership.is_owner,
    operator,
  });
}

export async function removeWorkspaceTenantUser(
  workspaceId: string,
  userId: string,
  actorUserId?: string | null,
): Promise<void> {
  await ensureInternalOperatorsTable();
  const { supabase, membership } = await loadWorkspaceTenantUserContext(workspaceId, userId);

  if (membership.is_owner) {
    throw new WorkspaceTenantUserError(
      "The workspace owner cannot be removed.",
      403,
    );
  }

  if (actorUserId && actorUserId === userId) {
    const adminCount = await countWorkspaceAdministrators(workspaceId);
    if (adminCount <= 1) {
      throw new WorkspaceTenantUserError(
        "You cannot remove the only workspace administrator.",
        403,
      );
    }
  }

  if (isWorkspaceAdministratorMembership(membership)) {
    const adminCount = await countWorkspaceAdministrators(workspaceId);
    if (adminCount <= 1) {
      throw new WorkspaceTenantUserError(
        "You cannot remove the only workspace administrator.",
        403,
      );
    }
  }

  const { error: membershipError } = await supabase
    .from("workspace_users")
    .delete()
    .eq("id", membership.id)
    .eq("workspace_id", workspaceId);
  if (membershipError) throw new Error(membershipError.message);

  const { error: platformError } = await supabase
    .from("platform_users")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("workspace_id", workspaceId);
  if (platformError) throw new Error(platformError.message);

  const { error: operatorError } = await supabase
    .from("internal_operators")
    .delete()
    .eq("id", userId);
  if (operatorError) throw new Error(operatorError.message);
}

export async function setWorkspaceTenantUserPassword(
  workspaceId: string,
  userId: string,
  password?: string,
): Promise<{ password: string }> {
  await ensureInternalOperatorsTable();
  const { supabase, membership, platformUser } = await loadWorkspaceTenantUserContext(
    workspaceId,
    userId,
  );

  if (membership.is_owner === false && platformUser.is_active === false) {
    throw new WorkspaceTenantUserError("Inactive users cannot receive password resets.", 400);
  }

  const newPassword = password?.trim() || generatePlatformPassword();
  if (password?.trim()) {
    const validationError = validatePlatformSignupPassword(newPassword);
    if (validationError) throw new Error(validationError);
  } else if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const username = normalizePlatformUsername(platformUser.username);
  const passwordHash = hashPlatformPasswordForUser(username, newPassword);
  const displayName = platformUser.display_name || platformUser.username;

  const { error } = await supabase
    .from("platform_users")
    .update({
      password_hash: passwordHash,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);

  const { data: existingOperator } = await supabase
    .from("internal_operators")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!existingOperator?.id) {
    const role = mapWorkspaceRoleToUserRole(membership.role, membership.is_owner);
    const roles = [role];
    const departments = ["Operations"] as UserDepartment[];
    const { error: insertError } = await supabase.from("internal_operators").insert({
      id: userId,
      operator_label: displayName.split(/\s+/)[0] || "Operator",
      full_name: displayName,
      username,
      email: platformUser.email || username,
      role,
      roles,
      department: "Operations",
      departments,
      status: "Active",
      region: "",
      allowed_views: defaultAllowedViewsForRoles(roles, departments),
      dashboard_prefs: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertError) throw new Error(insertError.message);
  }

  return { password: newPassword };
}
