/**
 * Provision a clean OnwardAir workspace on the shared Unit311 Central stack.
 *
 * Structural clone from Demo only (modules, file categories, chart of accounts, payroll settings).
 * Does NOT copy ABHI/Demo/Talanton business data (users, meetings, risks, board packs,
 * documents, training records, clients, HR).
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, abhi, talantonimpact.
 *
 *   node scripts/provision-onwardair.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { scryptSync } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeEnvPath = path.join(root, ".env.corporatecentre.runtime");
const envText = fs.existsSync(runtimeEnvPath)
  ? fs.readFileSync(runtimeEnvPath, "utf8")
  : fs.existsSync(path.join(root, ".env.unit311central.prod"))
    ? fs.readFileSync(path.join(root, ".env.unit311central.prod"), "utf8")
    : "";

function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  if (!m) return process.env[k] || "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const ACCESS_TOKEN = env("SUPABASE_ACCESS_TOKEN");
const PROJECT_REF = env("SUPABASE_PROJECT_REF") || "kkxtvzxqmbacjatkiupq";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLUG = "onwardair";
const COMPANY = "OnwardAir";
const WEBSITE = "https://onwardair.unit311central.com";
const OWNER_EMAIL = "admin@onwardair.tech";
const OWNER_PASSWORD = "Houston1999$";
const FORBIDDEN_TARGET_SLUGS = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "abhi",
  "talantonimpact",
]);

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function mgmtQuery(sql) {
  if (!ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN required");
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`mgmt SQL failed: ${JSON.stringify(data).slice(0, 1200)}`);
  return data;
}

async function rpc(name, args) {
  const { data, error } = await admin.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

async function ensureMembership(workspaceId, userId, role, isOwner) {
  const { data: mem } = await admin
    .from("workspace_users")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (mem) return;
  const { error } = await admin.from("workspace_users").insert({
    workspace_id: workspaceId,
    user_id: userId,
    role,
    is_owner: isOwner,
  });
  if (error) console.warn("workspace_users:", error.message);
}

async function upsertPlatformUser({ email, displayName, workspaceId, role, isOwner, password }) {
  const username = normalizeUsername(email);
  const passwordHash = hashPlatformPasswordForUser(username, password || OWNER_PASSWORD);
  const { data: byEmail } = await admin.from("platform_users").select("id").eq("email", email).maybeSingle();
  const { data: byUsername } = await admin
    .from("platform_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  let userId = byEmail?.id || byUsername?.id;
  const patch = {
    username,
    display_name: displayName,
    password_hash: passwordHash,
    user_type: "internal",
    redirect_path: "/dashboard",
    client_name: COMPANY,
    is_active: true,
    email,
    email_verified_at: new Date().toISOString(),
    workspace_id: workspaceId,
    updated_at: new Date().toISOString(),
  };
  if (userId) {
    const { error } = await admin.from("platform_users").update(patch).eq("id", userId);
    if (error) throw new Error(`platform_users update ${email}: ${error.message}`);
  } else {
    const { data: user, error } = await admin.from("platform_users").insert(patch).select("id").single();
    if (error) throw new Error(`platform_users insert ${email}: ${error.message}`);
    userId = user.id;
  }
  await ensureMembership(workspaceId, userId, role, isOwner);
  return userId;
}

async function softDeleteWorkspaceScoped(table, workspaceId) {
  const { error } = await admin.from(table).delete().eq("workspace_id", workspaceId);
  if (error && !/does not exist|Could not find|schema cache/i.test(error.message)) {
    console.warn(`${table} delete:`, error.message);
  }
}

async function main() {
  if (FORBIDDEN_TARGET_SLUGS.has(SLUG)) throw new Error(`Refusing forbidden slug: ${SLUG}`);

  const { data: demo, error: dErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", "demo")
    .maybeSingle();
  if (dErr || !demo?.id) throw new Error(`Demo missing: ${dErr?.message || "not found"}`);

  let workspaceId;
  {
    const { data: existingWs } = await admin
      .from("workspaces")
      .select("id, slug")
      .eq("slug", SLUG)
      .maybeSingle();
    if (existingWs?.id) {
      if (FORBIDDEN_TARGET_SLUGS.has(existingWs.slug)) {
        throw new Error(`Refusing protected: ${existingWs.slug}`);
      }
      workspaceId = existingWs.id;
      console.log("Using existing workspace", SLUG, workspaceId);
    } else {
      workspaceId = await rpc("provision_workspace", {
        company_name: COMPANY,
        workspace_slug: SLUG,
      });
      console.log("Provisioned workspace", SLUG, workspaceId);
    }
  }
  if (workspaceId === demo.id) throw new Error("Refusing: target equals Demo");

  await admin
    .from("workspaces")
    .update({
      status: "Active",
      onboarding_completed: true,
      name: COMPANY,
      updated_at: new Date().toISOString(),
    })
    .eq("id", workspaceId);

  await admin
    .from("workspace_settings")
    .update({
      timezone: "America/Chicago",
      currency: "USD",
      primary_colour: "#0EA5E9",
      secondary_colour: "#0369A1",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);

  console.log("Syncing structural config from Demo (no customer data)…");
  await mgmtQuery(`
DO $struct$
DECLARE
  v_demo uuid := '${demo.id}'::uuid;
  v_target uuid := '${workspaceId}'::uuid;
BEGIN
  IF v_demo = v_target THEN RAISE EXCEPTION 'Refusing sync onto Demo'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = v_target AND w.slug IN (
      'demo','unit311','corpcentre','corporatecentre','internal','abhi','talantonimpact'
    )
  ) THEN RAISE EXCEPTION 'Refusing protected workspace'; END IF;

  DELETE FROM public.workspace_modules WHERE workspace_id = v_target;
  INSERT INTO public.workspace_modules (workspace_id, module_key, enabled)
  SELECT v_target, m.module_key, m.enabled FROM public.workspace_modules m WHERE m.workspace_id = v_demo;

  DELETE FROM public.file_categories WHERE workspace_id = v_target;
  INSERT INTO public.file_categories (name, color, workspace_id)
  SELECT c.name, c.color, v_target FROM public.file_categories c WHERE c.workspace_id = v_demo ORDER BY c.name;

  DELETE FROM public.accounts WHERE workspace_id = v_target;
  INSERT INTO public.accounts (id, code, name, type, currency, is_active, created_at, updated_at, workspace_id)
  SELECT gen_random_uuid(), code, name, type, 'USD', is_active, now(), now(), v_target
  FROM public.accounts WHERE workspace_id = v_demo;

  DELETE FROM public.company_details WHERE workspace_id = v_target;
  INSERT INTO public.company_details (
    id, workspace_id, legal_company_name, trading_name, registered_office_address,
    principal_business_address, country_of_registration, website, primary_email,
    primary_telephone, general_company_description, company_status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_target, 'OnwardAir', 'OnwardAir',
    'United Kingdom', 'United Kingdom', 'United Kingdom',
    '${WEBSITE}', '${OWNER_EMAIL}', '',
    'OnwardAir workspace on Unit311 Central — clean tenant, no imported customer data.',
    'Active', now(), now()
  );
END;
$struct$;
`);

  {
    const { data: pay } = await admin
      .from("payroll_settings")
      .select("*")
      .eq("workspace_id", demo.id)
      .maybeSingle();
    if (pay) {
      const { id: _id, ...rest } = pay;
      await admin.from("payroll_settings").delete().eq("workspace_id", workspaceId);
      await admin
        .from("payroll_settings")
        .insert({ ...rest, workspace_id: workspaceId, currency: "USD", default_currency: "USD" });
    }
  }

  console.log("Ensuring clean tenant data (no ABHI / Demo business rows)…");
  for (const table of [
    "partners",
    "board_directors",
    "internal_clients",
    "hr_employee_timeline_events",
    "hr_employee_compensation_history",
    "hr_employee_employment_history",
    "hr_employee_notes",
    "hr_employee_documents",
    "hr_employees",
  ]) {
    await softDeleteWorkspaceScoped(table, workspaceId);
  }

  console.log("Creating OnwardAir owner…");
  const ownerId = await upsertPlatformUser({
    email: OWNER_EMAIL,
    displayName: "OnwardAir Admin",
    workspaceId,
    role: "owner",
    isOwner: true,
    password: OWNER_PASSWORD,
  });
  console.log("Owner user:", OWNER_EMAIL, ownerId);

  for (const username of ["paul.fotheringham", "paul@unit311central.com", "admin@unit311central.com"]) {
    const { data: op } = await admin
      .from("platform_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (op?.id) await ensureMembership(workspaceId, op.id, "admin", false);
  }

  const counts = {};
  for (const t of [
    "workspace_modules",
    "file_categories",
    "accounts",
    "company_details",
    "internal_clients",
    "hr_employees",
    "board_directors",
    "partners",
  ]) {
    const { count, error } = await admin
      .from(t)
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);
    counts[t] = error ? `err:${error.message}` : count;
  }

  const { data: wsRow } = await admin
    .from("workspaces")
    .select("id, name, slug, status")
    .eq("id", workspaceId)
    .single();

  console.log("\nOnwardAir provision complete.");
  console.log("Workspace record:", wsRow);
  console.log("Host:", WEBSITE);
  console.log("Counts:", counts);
  console.log("Owner:", OWNER_EMAIL, "/", OWNER_PASSWORD);
  console.log("Demo / Internal / ABHI / CorpCentre / Talanton were not modified.");
  console.log("No legacy Vercel / GitHub / Supabase projects were created or deleted.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
