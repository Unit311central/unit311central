/**
 * Provision Talanton Impact customer workspace on shared Unit311 Central stack.
 *
 * Structural / configuration clone from Demo only:
 *   - workspace_modules (enabled set)
 *   - file_categories
 *   - accounts (COA structure; currency forced to USD)
 *   - payroll_settings (defaults only)
 *
 * Creates:
 *   - workspaces (slug=talantonimpact) via provision_workspace when missing
 *   - workspace_settings (Talanton branding, USD, logo)
 *   - company_details (Talanton Impact)
 *   - empty root file folders (from provision_workspace)
 *   - platform_users + workspace_users (owner + Internal ops access)
 *
 * Does NOT copy Demo operational / business data (clients, CRM, projects,
 * HR people, invoices, expenses, tickets, journals, calendar, etc.).
 *
 * Hard-refuses target slugs: demo, unit311, corpcentre, corporatecentre, internal.
 *
 * Usage (from unit311 root, AFTER app deploy + explicit confirmation):
 *   node scripts/provision-talantonimpact.mjs
 *
 * Env sources (first match):
 *   .env.corporatecentre.runtime
 *   .env.unit311central.prod
 *   process.env
 *
 * Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 * Optional for module/accounts SQL sync: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
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
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (run scripts/_recover-unit311-keys.mjs first)",
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLUG = "talantonimpact";
const COMPANY = "Talanton Impact";
const WEBSITE = "https://talantonimpact.com/";
const LOGO_PUBLIC_PATH = "/images/workspaces/talantonimpact-t.jpg";
const OWNER_EMAIL = "demo@talantonimpact.com";
const OWNER_USERNAME = "demo@talantonimpact.com";
const OWNER_DISPLAY = "Talanton Impact Owner";
/** Login credential only — not used for outbound mail / invites / resets by this script. */
const OWNER_PASSWORD = "Africa1999$";
const FORBIDDEN_TARGET_SLUGS = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
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
  if (!ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN required for structural SQL sync");
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`mgmt SQL failed: ${JSON.stringify(data).slice(0, 1200)}`);
  }
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

async function main() {
  if (FORBIDDEN_TARGET_SLUGS.has(SLUG)) {
    throw new Error(`Refusing forbidden target slug: ${SLUG}`);
  }

  const { data: demo, error: dErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", "demo")
    .maybeSingle();
  if (dErr || !demo?.id) throw new Error(`Demo workspace missing: ${dErr?.message || "not found"}`);

  let workspaceId;
  {
    const { data: existingWs } = await admin
      .from("workspaces")
      .select("id, slug")
      .eq("slug", SLUG)
      .maybeSingle();
    if (existingWs?.id) {
      if (FORBIDDEN_TARGET_SLUGS.has(existingWs.slug)) {
        throw new Error(`Refusing to mutate protected workspace: ${existingWs.slug}`);
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

  if (workspaceId === demo.id) {
    throw new Error("Refusing: target workspace equals Demo");
  }

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
      logo_url: LOGO_PUBLIC_PATH,
      timezone: "Africa/Nairobi",
      currency: "USD",
      primary_colour: "#0B3D2E",
      secondary_colour: "#1B8A5A",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);

  // Structural sync from Demo (modules, categories, COA). No operational data.
  console.log("Syncing structural config from Demo →", SLUG, "...");
  await mgmtQuery(`
DO $struct$
DECLARE
  v_demo uuid := '${demo.id}'::uuid;
  v_target uuid := '${workspaceId}'::uuid;
BEGIN
  IF v_demo = v_target THEN
    RAISE EXCEPTION 'Refusing structural sync onto Demo';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = v_target
      AND w.slug IN ('demo', 'unit311', 'corpcentre', 'corporatecentre', 'internal')
  ) THEN
    RAISE EXCEPTION 'Refusing structural sync onto protected workspace';
  END IF;

  -- workspace_modules: mirror Demo enabled set
  DELETE FROM public.workspace_modules WHERE workspace_id = v_target;
  INSERT INTO public.workspace_modules (workspace_id, module_key, enabled)
  SELECT v_target, m.module_key, m.enabled
  FROM public.workspace_modules m
  WHERE m.workspace_id = v_demo;

  -- file_categories: mirror Demo labels (empty folders already from provision_workspace)
  DELETE FROM public.file_categories WHERE workspace_id = v_target;
  INSERT INTO public.file_categories (name, color, workspace_id)
  SELECT c.name, c.color, v_target
  FROM public.file_categories c
  WHERE c.workspace_id = v_demo
  ORDER BY c.name;

  -- accounts: COA structure only, currency USD
  DELETE FROM public.accounts WHERE workspace_id = v_target;
  INSERT INTO public.accounts (id, code, name, type, currency, is_active, created_at, updated_at, workspace_id)
  SELECT gen_random_uuid(), code, name, type, 'USD', is_active, now(), now(), v_target
  FROM public.accounts
  WHERE workspace_id = v_demo;

  -- company_details: Talanton identity (replace any prior row for this workspace)
  DELETE FROM public.company_details WHERE workspace_id = v_target;
  INSERT INTO public.company_details (
    id, workspace_id, legal_company_name, trading_name, registered_office_address,
    principal_business_address, country_of_registration, website, primary_email,
    primary_telephone, general_company_description, company_status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_target,
    'Talanton Impact',
    'Talanton Impact',
    '',
    '',
    'Kenya',
    '${WEBSITE}',
    '${OWNER_EMAIL}',
    '',
    'Impact investment platform supporting portfolio companies across Africa with compliance, training and governance.',
    'Active',
    now(),
    now()
  );
END;
$struct$;
`);

  // payroll_settings defaults from Demo (JS for type safety on workspace_id)
  {
    const { data: pay } = await admin
      .from("payroll_settings")
      .select("*")
      .eq("workspace_id", demo.id)
      .maybeSingle();
    if (pay) {
      const { id: _id, ...rest } = pay;
      await admin.from("payroll_settings").delete().eq("workspace_id", workspaceId);
      const row = {
        ...rest,
        workspace_id: workspaceId,
        currency: rest.currency ? "USD" : rest.currency,
      };
      const { error } = await admin.from("payroll_settings").insert(row);
      if (error) {
        console.warn("payroll_settings insert:", error.message);
        const { error: e2 } = await admin
          .from("payroll_settings")
          .insert({ ...row, workspace_id: String(workspaceId) });
        if (e2) console.warn("payroll_settings retry:", e2.message);
      }
    }
  }

  // Owner login
  const passwordHash = hashPlatformPasswordForUser(OWNER_USERNAME, OWNER_PASSWORD);
  {
    const { data: byEmail } = await admin
      .from("platform_users")
      .select("id")
      .eq("email", OWNER_EMAIL)
      .maybeSingle();
    const { data: byUsername } = await admin
      .from("platform_users")
      .select("id")
      .eq("username", normalizeUsername(OWNER_USERNAME))
      .maybeSingle();
    let userId = byEmail?.id || byUsername?.id;

    const userPatch = {
      username: normalizeUsername(OWNER_USERNAME),
      display_name: OWNER_DISPLAY,
      password_hash: passwordHash,
      user_type: "external",
      redirect_path: "/dashboard",
      client_name: COMPANY,
      is_active: true,
      email: OWNER_EMAIL,
      email_verified_at: new Date().toISOString(),
      workspace_id: workspaceId,
      updated_at: new Date().toISOString(),
    };

    if (userId) {
      const { error } = await admin.from("platform_users").update(userPatch).eq("id", userId);
      if (error) throw new Error(`platform_users update: ${error.message}`);
    } else {
      const { data: user, error } = await admin
        .from("platform_users")
        .insert(userPatch)
        .select("id")
        .single();
      if (error) throw new Error(`platform_users insert: ${error.message}`);
      userId = user.id;
    }

    await ensureMembership(workspaceId, userId, "owner", true);
  }

  // Internal ops access (same pattern as CorpCentre)
  for (const username of ["paul.fotheringham", "paul@unit311central.com"]) {
    const { data: paul } = await admin
      .from("platform_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!paul?.id) continue;
    await ensureMembership(workspaceId, paul.id, "admin", false);
  }

  const counts = {};
  for (const t of ["workspace_modules", "file_categories", "accounts", "company_details"]) {
    const { count, error } = await admin
      .from(t)
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);
    counts[t] = error ? `err:${error.message}` : count;
  }

  console.log("\nTalanton Impact provision complete.");
  console.log("Workspace:", SLUG, workspaceId);
  console.log("Host: https://talantonimpact.unit311central.com");
  console.log("Counts:", counts);
  console.log("Owner login:");
  console.log("  email/username:", OWNER_EMAIL);
  console.log("  password:", OWNER_PASSWORD);
  console.log("\nDemo / Internal / CorpCentre were not modified.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
