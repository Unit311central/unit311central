import {
  createBlankUserInput,
  mapInternalOperator,
  normalizeUserDepartment,
  normalizeUserDepartments,
  normalizeUserRole,
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
import {
  ensureInternalOperatorsTable,
  withInternalOperatorsTable,
} from "@/lib/internal-db-migrations";
import {
  generatePlatformPassword,
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "@/lib/platform-auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { validatePlatformSignupPassword } from "@/lib/platform-password-validation";

type DbOperator = Parameters<typeof mapInternalOperator>[0];

const OPERATOR_SELECT =
  "id, operator_label, full_name, username, email, phone, role, roles, status, region, license_id, notes, department, departments, allowed_views, dashboard_prefs, created_at, updated_at";

function requireOperatorsSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createTenancyServerClient();
}

function buildOperatorPayload(input: Partial<ManagedUser>) {
  const payload: Record<string, string | null | unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.operatorLabel !== undefined) payload.operator_label = input.operatorLabel.trim();
  if (input.fullName !== undefined) payload.full_name = input.fullName.trim();
  if (input.username !== undefined) payload.username = input.username.trim().toLowerCase();
  if (input.email !== undefined) payload.email = input.email.trim() || null;
  if (input.phone !== undefined) payload.phone = input.phone.trim() || null;
  if (input.roles !== undefined) {
    const roles = normalizeUserRoles(input.roles, input.role);
    payload.roles = roles;
    payload.role = primaryUserRole(roles);
  } else if (input.role !== undefined) {
    const roles = normalizeUserRoles([input.role], input.role);
    payload.roles = roles;
    payload.role = primaryUserRole(roles);
  }
  if (input.departments !== undefined) {
    const departments = normalizeUserDepartments(input.departments, input.department);
    payload.departments = departments;
    payload.department = primaryUserDepartment(departments);
  } else if (input.department !== undefined) {
    const departments = normalizeUserDepartments([input.department], input.department);
    payload.departments = departments;
    payload.department = primaryUserDepartment(departments);
  }
  if (input.status !== undefined) payload.status = input.status;
  if (input.region !== undefined) payload.region = input.region;
  if (input.licenseId !== undefined) payload.license_id = input.licenseId.trim() || null;
  if (input.notes !== undefined) payload.notes = input.notes.trim() || null;
  if (input.allowedViews !== undefined) payload.allowed_views = input.allowedViews;
  if (input.dashboardPrefs !== undefined) payload.dashboard_prefs = input.dashboardPrefs;

  return payload;
}

export async function listInternalOperators(): Promise<ManagedUser[]> {
  await ensureInternalOperatorsTable();
  return withInternalOperatorsTable(async () => {
    const supabase = requireOperatorsSupabase();
    const { data, error } = await supabase
      .from("internal_operators")
      .select(OPERATOR_SELECT)
      .order("full_name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data as DbOperator[]).map(mapInternalOperator);
  });
}

export async function getInternalOperatorByUsername(
  username: string,
): Promise<ManagedUser | null> {
  const normalized = normalizePlatformUsername(username);
  if (!normalized) return null;

  await ensureInternalOperatorsTable();
  return withInternalOperatorsTable(async () => {
    const supabase = requireOperatorsSupabase();
    const { data, error } = await supabase
      .from("internal_operators")
      .select(OPERATOR_SELECT)
      .eq("username", normalized)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapInternalOperator(data as DbOperator);
  });
}

export async function createInternalOperator(
  input: Partial<ManagedUser> & { fullName: string; username: string; password?: string },
): Promise<{ user: ManagedUser; temporaryPassword: string }> {
  await ensureInternalOperatorsTable();
  return withInternalOperatorsTable(async () => {
    const supabase = requireOperatorsSupabase();
    const blank = createBlankUserInput();
    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const username = normalizePlatformUsername(
      input.username?.trim() || input.email?.trim() || "",
    );
    if (!username) {
      throw new Error("Email address is required for internal users.");
    }
    const password = input.password?.trim() || generatePlatformPassword();
    const passwordHash = hashPlatformPasswordForUser(username, password);
    const roles = normalizeUserRoles(input.roles ?? [input.role ?? blank.role], input.role ?? blank.role);
    const role = primaryUserRole(roles);
    const departments = normalizeUserDepartments(
      input.departments ?? [input.department ?? blank.department],
      input.department ?? blank.department,
    );
    const department = primaryUserDepartment(departments);

    const { data, error } = await supabase
      .from("internal_operators")
      .insert({
        id,
        operator_label: input.operatorLabel?.trim() || blank.operatorLabel,
        full_name: input.fullName.trim(),
        username,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        role,
        roles,
        department,
        departments,
        status: input.status ?? blank.status,
        region: input.region ?? blank.region,
        license_id: input.licenseId?.trim() || null,
        notes: input.notes?.trim() || null,
        allowed_views: input.allowedViews ?? blank.allowedViews,
        dashboard_prefs: input.dashboardPrefs ?? blank.dashboardPrefs,
      })
      .select(OPERATOR_SELECT)
      .single();

    if (error) throw new Error(error.message);

    const { error: platformError } = await supabase.from("platform_users").upsert(
      {
        username,
        display_name: input.fullName.trim(),
        email: input.email?.trim().toLowerCase() || username,
        password_hash: passwordHash,
        user_type: "internal",
        redirect_path: "/",
        client_name: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "username" },
    );

    if (platformError) throw new Error(platformError.message);

    return {
      user: mapInternalOperator(data as DbOperator),
      temporaryPassword: password,
    };
  });
}

export async function updateInternalOperator(
  id: string,
  patch: Partial<{
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
  }>,
): Promise<ManagedUser> {
  return withInternalOperatorsTable(async () => {
    const supabase = requireOperatorsSupabase();

    const normalizedPatch = { ...patch };
    if (normalizedPatch.email?.trim()) {
      normalizedPatch.username = normalizedPatch.email.trim().toLowerCase();
    }

    const { data: existing, error: existingError } = await supabase
      .from("internal_operators")
      .select("username, full_name")
      .eq("id", id)
      .single();

    if (existingError || !existing) {
      throw new Error(existingError?.message ?? "User not found");
    }

    const payload = buildOperatorPayload(normalizedPatch);

    const { data, error } = await supabase
      .from("internal_operators")
      .update(payload)
      .eq("id", id)
      .select(OPERATOR_SELECT)
      .single();

    if (error) throw new Error(error.message);

    const nextUsername =
      typeof payload.username === "string" ? payload.username : existing.username;
    const nextDisplayName =
      typeof payload.full_name === "string" ? payload.full_name : existing.full_name;

    if (nextUsername !== existing.username || nextDisplayName !== existing.full_name) {
      const { error: platformError } = await supabase
        .from("platform_users")
        .update({
          username: nextUsername,
          display_name: nextDisplayName,
          updated_at: new Date().toISOString(),
        })
        .eq("username", existing.username)
        .eq("user_type", "internal");

      if (platformError) throw new Error(platformError.message);
    }

    return mapInternalOperator(data as DbOperator);
  });
}

export async function setInternalOperatorPassword(
  id: string,
  password?: string,
): Promise<{ password: string }> {
  return withInternalOperatorsTable(async () => {
    const supabase = requireOperatorsSupabase();
    const { data: operator, error: loadError } = await supabase
      .from("internal_operators")
      .select("username, full_name")
      .eq("id", id)
      .single();

    if (loadError || !operator) {
      throw new Error(loadError?.message ?? "User not found");
    }

    const newPassword = password?.trim() || generatePlatformPassword();
    if (password?.trim()) {
      const validationError = validatePlatformSignupPassword(newPassword);
      if (validationError) throw new Error(validationError);
    } else if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const username = normalizePlatformUsername(operator.username);
    const passwordHash = hashPlatformPasswordForUser(username, newPassword);

    const { error } = await supabase.from("platform_users").upsert(
      {
        username,
        display_name: operator.full_name,
        email: username.includes("@") ? username : null,
        password_hash: passwordHash,
        user_type: "internal",
        redirect_path: "/",
        client_name: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "username" },
    );

    if (error) throw new Error(error.message);
    return { password: newPassword };
  });
}

export async function deleteInternalOperator(id: string) {
  return withInternalOperatorsTable(async () => {
    const supabase = requireOperatorsSupabase();
    const { error } = await supabase.from("internal_operators").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
}
