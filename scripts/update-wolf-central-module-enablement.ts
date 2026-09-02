/**
 * Update WOLF Central workspace module enablement and provision BCN admin user.
 * Metadata + workspace_modules only — does not import legacy data or seed modules.
 *
 *   SUPABASE_ACCESS_TOKEN=... npx tsx scripts/update-wolf-central-module-enablement.ts
 */
import { scryptSync, timingSafeEqual } from "node:crypto";

import {
  wolfCentralEnabledModules,
  wolfCentralEnabledSubModules,
} from "../src/lib/wolf/wolf-central-provisioning.ts";
import { wolfCentralNavViews } from "../src/lib/wolf/wolf-nav.ts";
import { WOLF_CENTRAL_SLUG, WOLF_DISPLAY_NAME } from "../src/lib/wolf/wolf-surface.ts";
import { defaultHomeTilesForRoles } from "../src/lib/access-presets.ts";
import {
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "../src/lib/platform-auth.ts";
import { validatePlatformSignupPassword } from "../src/lib/platform-password-validation.ts";
import {
  USER_DEPARTMENT_OPTIONS,
  USER_ROLE_OPTIONS,
} from "../src/lib/user-management-data.ts";
import { setWorkspaceAdminRepositoryForTests } from "../src/lib/platform-workspaces/workspace-admin-repository-provider.ts";
import {
  getWorkspaceAdminRecord,
  updateWorkspaceAdminRecord,
} from "../src/lib/platform-workspaces/workspace-admin-service.ts";
import { createTenancyServerClient } from "../src/lib/supabase/tenancy-server.ts";

const PROJECT_REF = "kkxtvzxqmbacjatkiupq";

const BCN_ADMIN_EMAIL = "bcn@wolf.unit311central.com";
const BCN_ADMIN_PASSWORD = "Catalonia 1999$";
const BCN_ADMIN_DISPLAY_NAME = "WOLF BCN Administrator";

async function fetchSupabaseCredentials(): Promise<{
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch Supabase API keys: ${response.status}`);
  const keys = (await response.json()) as Array<{ name: string; api_key: string }>;
  const serviceRole = keys.find((key) => key.name === "service_role")?.api_key;
  const anon = keys.find((key) => key.name === "anon")?.api_key;
  if (!serviceRole || !anon) throw new Error("Supabase anon/service_role API keys not found.");
  return {
    url: `https://${PROJECT_REF}.supabase.co`,
    anonKey: anon,
    serviceRoleKey: serviceRole,
  };
}

async function runSql(query: string): Promise<unknown> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body?.message === "string" ? body.message : JSON.stringify(body));
  }
  return body;
}

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

function assertWolfNav() {
  const views = wolfCentralNavViews();
  if (!views.includes("executive-assistant")) {
    throw new Error("WOLF nav must include executive-assistant.");
  }
  if (!views.includes("users")) {
    throw new Error("WOLF nav must include users under Tools.");
  }
  if (views.includes("files-client") || views.includes("info-email") || views.includes("social")) {
    throw new Error("WOLF nav must not include Client Explorer, Email, or Social.");
  }
  const requiredModules = [
    "project-management",
    "business-productivity",
    "executive-assistant",
    "support-desk",
    "operations",
    "training",
    "tools",
    "settings",
  ];
  const enabled = wolfCentralEnabledModules();
  for (const moduleId of requiredModules) {
    if (!enabled.includes(moduleId)) {
      throw new Error(`WOLF enablement missing module: ${moduleId}`);
    }
  }
}

async function provisionBcnAdmin(workspaceId: string): Promise<{ userId: string; passwordVerifies: boolean }> {
  const passwordError = validatePlatformSignupPassword(BCN_ADMIN_PASSWORD);
  if (passwordError) throw new Error(passwordError);

  const username = normalizePlatformUsername(BCN_ADMIN_EMAIL);
  const passwordHash = hashPlatformPasswordForUser(username, BCN_ADMIN_PASSWORD);
  const roles = [...USER_ROLE_OPTIONS];
  const departments = [...USER_DEPARTMENT_OPTIONS];
  const now = new Date().toISOString();
  const supabase = createTenancyServerClient();

  const { data: existing } = await supabase
    .from("platform_users")
    .select("id, workspace_id")
    .eq("username", username)
    .maybeSingle();

  let userId: string;
  if (existing?.id) {
    userId = String(existing.id);
    const existingWorkspaceId = existing.workspace_id ? String(existing.workspace_id) : null;
    if (existingWorkspaceId && existingWorkspaceId !== workspaceId) {
      throw new Error(`${BCN_ADMIN_EMAIL} is assigned to another workspace.`);
    }
    const { error } = await supabase
      .from("platform_users")
      .update({
        workspace_id: workspaceId,
        email: BCN_ADMIN_EMAIL,
        display_name: BCN_ADMIN_DISPLAY_NAME,
        password_hash: passwordHash,
        user_type: "internal",
        is_active: true,
        email_verified_at: now,
        redirect_path: "/dashboard",
        client_name: WOLF_DISPLAY_NAME,
        updated_at: now,
      })
      .eq("id", userId);
    if (error) throw new Error(error.message);
  } else {
    const { data: created, error } = await supabase
      .from("platform_users")
      .insert({
        workspace_id: workspaceId,
        username,
        email: BCN_ADMIN_EMAIL,
        display_name: BCN_ADMIN_DISPLAY_NAME,
        password_hash: passwordHash,
        user_type: "internal",
        is_active: true,
        email_verified_at: now,
        redirect_path: "/dashboard",
        client_name: WOLF_DISPLAY_NAME,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();
    if (error || !created?.id) {
      throw new Error(error?.message || "Failed to create BCN admin platform user.");
    }
    userId = String(created.id);
  }

  const { data: membership } = await supabase
    .from("workspace_users")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membership?.id) {
    const { error } = await supabase
      .from("workspace_users")
      .update({ role: "admin", is_owner: false, updated_at: now })
      .eq("id", membership.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("workspace_users").insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: "admin",
      is_owner: false,
      created_at: now,
      updated_at: now,
    });
    if (error) throw new Error(error.message);
  }

  const dashboardPrefs = {
    homeTiles: defaultHomeTilesForRoles(["Admin"], departments),
  };

  const { error: operatorError } = await supabase.from("internal_operators").upsert(
    {
      id: userId,
      operator_label: "BCN Admin",
      full_name: BCN_ADMIN_DISPLAY_NAME,
      username,
      email: BCN_ADMIN_EMAIL,
      phone: null,
      role: "Admin",
      roles,
      department: "Corporate",
      departments,
      status: "Active",
      region: "",
      license_id: null,
      notes: "WOLF Central full-access administrator",
      allowed_views: null,
      dashboard_prefs: dashboardPrefs,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (operatorError) throw new Error(operatorError.message);

  const { data: userRow, error: readError } = await supabase
    .from("platform_users")
    .select("password_hash")
    .eq("id", userId)
    .single();
  if (readError) throw new Error(readError.message);

  return {
    userId,
    passwordVerifies: verifyPassword(BCN_ADMIN_PASSWORD, String(userRow?.password_hash ?? "")),
  };
}

async function main() {
  assertWolfNav();

  const credentials = await fetchSupabaseCredentials();
  process.env.SUPABASE_URL = credentials.url;
  process.env.SUPABASE_ANON_KEY = credentials.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = credentials.serviceRoleKey;
  process.env.WORKSPACE_ADMIN_REPOSITORY = "supabase";
  setWorkspaceAdminRepositoryForTests(null);

  const workspaceRows = (await runSql(
    `select id, slug from public.workspaces where slug = '${WOLF_CENTRAL_SLUG}' limit 1`,
  )) as Array<{ id: string; slug: string }>;
  const workspaceId = workspaceRows[0]?.id;
  if (!workspaceId) throw new Error("WOLF Central workspace not found.");

  const enabledModules = wolfCentralEnabledModules();
  const enabledSubModules = wolfCentralEnabledSubModules();

  const before = await getWorkspaceAdminRecord(workspaceId);
  if (!before) throw new Error("WOLF Central workspace admin record not found.");

  console.log("Updating WOLF Central module enablement (no legacy data import)...");
  console.log(
    `Before: ${before.enabledModules.length} modules, ${before.enabledSubModules.length} submodules`,
  );

  const updated = await updateWorkspaceAdminRecord(workspaceId, {
    enabledModules,
    enabledSubModules,
  });

  console.log(
    `After: ${updated.enabledModules.length} modules, ${updated.enabledSubModules.length} submodules`,
  );

  console.log("Provisioning BCN admin user...");
  const admin = await provisionBcnAdmin(workspaceId);

  console.log(
    JSON.stringify(
      {
        workspaceId,
        slug: WOLF_CENTRAL_SLUG,
        enabledModules: updated.enabledModules.length,
        enabledSubModules: updated.enabledSubModules.length,
        bcnAdminEmail: BCN_ADMIN_EMAIL,
        bcnAdminUserId: admin.userId,
        passwordVerifies: admin.passwordVerifies,
        bpExcluded: [
          "business-productivity:files-client",
          "business-productivity:info-email",
          "business-productivity:social",
        ].every((key) => !updated.enabledSubModules.includes(key)),
      },
      null,
      2,
    ),
  );

  if (!admin.passwordVerifies) {
    throw new Error("BCN admin password verification failed after provisioning.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
