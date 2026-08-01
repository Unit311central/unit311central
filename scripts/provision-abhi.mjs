/**
 * Provision / refresh ABHI on shared Unit311 Central stack.
 *
 * Structural clone from Demo: workspace_modules, file_categories, accounts (GBP), payroll_settings.
 * Imports Latest ABHI.xlsx:
 *   Sheet1 → internal_clients (~379)
 *   Sheet2 staff → hr_employees + platform_users (~24)
 *   Sheet2 board → board_directors (~26)
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact.
 *
 *   node scripts/provision-abhi.mjs
 */
import { spawnSync } from "node:child_process";
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

const SLUG = "abhi";
const COMPANY = "ABHI";
const WEBSITE = "https://www.abhi.org.uk/";
const LOGO_PUBLIC_PATH = "/images/workspaces/abhi.jpg";
const OWNER_EMAIL = "demo@abhi.org.uk";
const OWNER_PASSWORD = "London1999$";
const XLSX_PATH = path.join(root, "Latest ABHI.xlsx");
const FORBIDDEN_TARGET_SLUGS = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
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

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function parseAbhiWorkbook() {
  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(`Missing workbook: ${XLSX_PATH}`);
  }
  const py = `
import json, re, openpyxl
EMAIL=re.compile(r'^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')
wb=openpyxl.load_workbook(r'''${XLSX_PATH.replace(/\\/g, "\\\\")}''', data_only=True)
clients=[]
for row in wb['Sheet1'].iter_rows(min_row=2, values_only=True):
    if not row or not row[0]: continue
    email=(str(row[3]).strip() if row[3] else '')
    if not EMAIL.match(email): email=''
    phone=str(row[2] or '').strip()
    if phone.lower() in ('email :','website :'): phone=''
    website=str(row[4] or '').strip()
    clients.append({
      'company': str(row[0]).strip(),
      'address': str(row[1] or '').strip(),
      'telephone': phone,
      'email': email,
      'website': website,
    })
staff=[]; board=[]; mode='none'
for row in wb['Sheet2'].iter_rows(min_row=1, values_only=True):
    vals=[v for v in row if v is not None]
    if not vals: continue
    if str(vals[0]).strip().lower()=='board of directors':
        mode='board'; continue
    if row[1]=='Staff first name':
        mode='staff'; continue
    if mode=='staff' and row[1] and row[2]:
        staff.append({
          'first': str(row[1]).strip(),
          'surname': str(row[2]).strip(),
          'role': str(row[3] or '').strip(),
          'email': str(row[4] or '').strip().lower(),
          'password': str(row[5] or 'London1999$').strip() or 'London1999$',
        })
    elif mode=='board' and row[1] and row[2]:
        board.append({
          'first': str(row[1]).strip(),
          'surname': str(row[2]).strip(),
          'role': str(row[3] or '').strip(),
        })
print(json.dumps({'clients': clients, 'staff': staff, 'board': board}))
`;
  const result = spawnSync("python", ["-c", py], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`Excel parse failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout);
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

async function upsertPlatformUser({
  email,
  displayName,
  workspaceId,
  role,
  isOwner,
  password,
}) {
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
    user_type: "external",
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

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  if (FORBIDDEN_TARGET_SLUGS.has(SLUG)) throw new Error(`Refusing forbidden slug: ${SLUG}`);

  console.log("Parsing workbook…");
  const workbook = parseAbhiWorkbook();
  console.log(
    `Parsed clients=${workbook.clients.length} staff=${workbook.staff.length} board=${workbook.board.length}`,
  );
  if (workbook.clients.length < 100) throw new Error("Unexpected client count from Excel");
  if (workbook.staff.length < 10) throw new Error("Unexpected staff count from Excel");
  if (workbook.board.length < 10) throw new Error("Unexpected board count from Excel");

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
      logo_url: LOGO_PUBLIC_PATH,
      timezone: "Europe/London",
      currency: "GBP",
      primary_colour: "#C2185B",
      secondary_colour: "#880E4F",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);

  console.log("Syncing structural config from Demo…");
  await mgmtQuery(`
DO $struct$
DECLARE
  v_demo uuid := '${demo.id}'::uuid;
  v_target uuid := '${workspaceId}'::uuid;
BEGIN
  IF v_demo = v_target THEN RAISE EXCEPTION 'Refusing sync onto Demo'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = v_target AND w.slug IN ('demo','unit311','corpcentre','corporatecentre','internal','talantonimpact')
  ) THEN RAISE EXCEPTION 'Refusing protected workspace'; END IF;

  DELETE FROM public.workspace_modules WHERE workspace_id = v_target;
  INSERT INTO public.workspace_modules (workspace_id, module_key, enabled)
  SELECT v_target, m.module_key, m.enabled FROM public.workspace_modules m WHERE m.workspace_id = v_demo;

  DELETE FROM public.file_categories WHERE workspace_id = v_target;
  INSERT INTO public.file_categories (name, color, workspace_id)
  SELECT c.name, c.color, v_target FROM public.file_categories c WHERE c.workspace_id = v_demo ORDER BY c.name;

  DELETE FROM public.accounts WHERE workspace_id = v_target;
  INSERT INTO public.accounts (id, code, name, type, currency, is_active, created_at, updated_at, workspace_id)
  SELECT gen_random_uuid(), code, name, type, 'GBP', is_active, now(), now(), v_target
  FROM public.accounts WHERE workspace_id = v_demo;

  DELETE FROM public.company_details WHERE workspace_id = v_target;
  INSERT INTO public.company_details (
    id, workspace_id, legal_company_name, trading_name, registered_office_address,
    principal_business_address, country_of_registration, website, primary_email,
    primary_telephone, general_company_description, company_status, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_target,
    'Association of British HealthTech Industries', 'ABHI',
    'United Kingdom', 'United Kingdom', 'United Kingdom',
    '${WEBSITE}', '${OWNER_EMAIL}', '',
    'ABHI is the UK industry association for health technology companies.',
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
        .insert({ ...rest, workspace_id: workspaceId, currency: "GBP" });
    }
  }

  console.log("Clearing ABHI-only business data…");
  {
    const { error } = await admin.from("partners").delete().eq("workspace_id", workspaceId);
    if (error && !/does not exist|Could not find/i.test(error.message)) {
      console.warn("partners delete:", error.message);
    }
  }
  await admin.from("board_directors").delete().eq("workspace_id", workspaceId);
  for (const table of [
    "hr_employee_timeline_events",
    "hr_employee_compensation_history",
    "hr_employee_employment_history",
    "hr_employee_notes",
    "hr_employee_documents",
  ]) {
    await admin.from(table).delete().eq("workspace_id", workspaceId);
  }
  await admin.from("hr_employees").delete().eq("workspace_id", workspaceId);
  await admin.from("internal_clients").delete().eq("workspace_id", workspaceId);

  console.log("Importing clients…");
  const usedClientIds = new Set();
  const clientRows = workbook.clients.map((c, index) => {
    let base = slugify(c.company) || `company-${index + 1}`;
    let id = `abhi-cli-${base}`;
    let n = 2;
    while (usedClientIds.has(id)) {
      id = `abhi-cli-${base}-${n++}`;
    }
    usedClientIds.add(id);
    return {
      id,
      workspace_id: workspaceId,
      company_name: c.company,
      industry: "Other",
      primary_contact: "",
      email: c.email || "",
      phone: c.telephone || "",
      region: "United Kingdom",
      account_status: "Client Created",
      contract_type: "Framework Agreement",
      tax_id: "",
      billing_address: c.address || "",
      active_projects: 0,
      notes: c.website ? `Website: ${c.website}` : "ABHI member organisation",
      company_address: c.address || "",
      company_city: "",
      company_country: "United Kingdom",
      invoice_email: c.email || "",
      platform_url: c.website || null,
    };
  });

  let clientOk = 0;
  for (const batch of chunk(clientRows, 50)) {
    const { error } = await admin.from("internal_clients").insert(batch);
    if (error) {
      for (const row of batch) {
        const { error: e2 } = await admin.from("internal_clients").insert(row);
        if (e2) console.warn(`client ${row.company_name}:`, e2.message);
        else clientOk += 1;
      }
    } else {
      clientOk += batch.length;
    }
  }
  console.log(`Clients imported: ${clientOk}/${clientRows.length}`);

  console.log("Importing HR staff + users…");
  const ownerId = await upsertPlatformUser({
    email: OWNER_EMAIL,
    displayName: "ABHI Owner",
    workspaceId,
    role: "owner",
    isOwner: true,
    password: OWNER_PASSWORD,
  });
  console.log("Owner user:", OWNER_EMAIL, ownerId);

  for (const person of workbook.staff) {
    const fullName = `${person.first} ${person.surname}`.replace(/\s+/g, " ").trim();
    const empId = `abhi-emp-${slugify(fullName)}`;
    const email = person.email || `${slugify(fullName)}@abhi.org.uk`;
    const isCeo = /chief executive/i.test(person.role);
    const row = {
      id: empId,
      workspace_id: workspaceId,
      full_name: fullName,
      preferred_name: person.first,
      email,
      phone: "",
      date_joined: "2020-01-15",
      employment_status: "active",
      employment_type: "full_time",
      role: person.role,
      department: "ABHI",
      location: "United Kingdom",
      manager: isCeo ? "" : "Peter Ellingworth",
      currency: "GBP",
      address: "United Kingdom",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
      nationality: "British",
    };
    const { error } = await admin.from("hr_employees").insert(row);
    if (error) {
      const { id: _id, ...rest } = row;
      const { error: e2 } = await admin.from("hr_employees").insert(rest);
      if (e2) console.warn(`hr ${fullName}:`, error.message, "/", e2.message);
    }

    const userId = await upsertPlatformUser({
      email,
      displayName: fullName,
      workspaceId,
      role: isCeo ? "owner" : "admin",
      isOwner: isCeo,
      password: person.password || OWNER_PASSWORD,
    });
    if (userId) {
      await admin.from("hr_employees").update({ platform_user_id: userId }).eq("id", empId);
    }
  }

  for (const username of ["paul.fotheringham", "paul@unit311central.com"]) {
    const { data: paul } = await admin
      .from("platform_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (paul?.id) await ensureMembership(workspaceId, paul.id, "admin", false);
  }

  console.log("Importing board directors…");
  const boardRows = workbook.board.map((person, index) => {
    const fullName = `${person.first} ${person.surname}`.replace(/\s+/g, " ").trim();
    return {
      workspace_id: workspaceId,
      full_name: fullName,
      role_title: person.role || "",
      organisation: "",
      email: null,
      phone: null,
      sort_order: (index + 1) * 10,
      is_active: true,
      notes: "",
    };
  });
  for (const batch of chunk(boardRows, 50)) {
    const { error } = await admin.from("board_directors").insert(batch);
    if (error) throw new Error(`board_directors insert: ${error.message}`);
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

  // Isolation check — protected tenants untouched by this script's target writes
  const protectedCounts = {};
  for (const slug of ["demo", "internal", "corpcentre", "talantonimpact"]) {
    const { data: ws } = await admin.from("workspaces").select("id").eq("slug", slug).maybeSingle();
    if (!ws?.id) {
      protectedCounts[slug] = "missing";
      continue;
    }
    const { count } = await admin
      .from("internal_clients")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", ws.id);
    protectedCounts[slug] = { clients: count };
  }

  console.log("\nABHI provision complete.");
  console.log("Workspace:", SLUG, workspaceId);
  console.log("Host: https://abhi.unit311central.com");
  console.log("Counts:", counts);
  console.log("Protected tenant client counts (sanity):", protectedCounts);
  console.log("Owner:", OWNER_EMAIL, "/", OWNER_PASSWORD);
  console.log("Staff passwords from Excel (typically London1999$).");
  console.log("Demo / Internal / CorpCentre / Talanton were not targeted.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
