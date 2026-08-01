/**
 * Provision / refresh Talanton Impact on shared Unit311 Central stack.
 *
 * Structural clone from Demo: workspace_modules, file_categories, accounts (USD), payroll_settings.
 * Seeds Talanton-only: portfolio clients, HR team, platform users.
 * Clears: partners (DB), ensures no Meridian partner/cap inheritance via app gates.
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal.
 *
 *   node scripts/provision-talantonimpact.mjs
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

const SLUG = "talantonimpact";
const COMPANY = "Talanton Impact";
const WEBSITE = "https://talantonimpact.com/";
const LOGO_PUBLIC_PATH = "/images/workspaces/talantonimpact-t.jpg";
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

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Same 19 companies as src/lib/talanton/portfolio-data.ts */
const PORTFOLIO_COMPANIES = [
  { name: "Ethical Apparel Africa", country: "Ghana", city: "Accra", sector: "Apparel & Manufacturing", contact: "Ama Mensah" },
  { name: "ARC Ride", country: "Kenya", city: "Nairobi", sector: "Mobility & Logistics", contact: "James Kariuki" },
  { name: "Burn Manufacturing", country: "Kenya", city: "Nairobi", sector: "Clean Energy", contact: "Wanjiru Otieno" },
  { name: "Kentegra Biotechnology", country: "Kenya", city: "Nairobi", sector: "Agri-biotech", contact: "Daniel Okello" },
  { name: "Long Miles Coffee", country: "Burundi", city: "Bujumbura", sector: "Agriculture & Food", contact: "Grace Ndayishimiye" },
  { name: "Pharmakina", country: "DRC", city: "Bukavu", sector: "Healthcare & Pharma", contact: "Jean Mukendi" },
  { name: "Moko Home + Living", country: "Kenya", city: "Nairobi", sector: "Consumer Goods", contact: "Faith Wambui" },
  { name: "Power Resources International", country: "Uganda", city: "Kampala", sector: "Energy Infrastructure", contact: "Peter Okello" },
  { name: "Auto Springs East Africa PLC", country: "Ethiopia", city: "Addis Ababa", sector: "Automotive Manufacturing", contact: "Helen Bekele" },
  { name: "BioFarms Limited", country: "Uganda", city: "Kampala", sector: "Agriculture & Food", contact: "Sarah Nalwanga" },
  { name: "Enda Sportswear", country: "Kenya", city: "Eldoret", sector: "Apparel & Manufacturing", contact: "Michael Kiprop" },
  { name: "Kijani Forestry", country: "Kenya", city: "Nairobi", sector: "Forestry & Climate", contact: "Amina Otieno" },
  { name: "Kivu Tilapia Farm Ltd", country: "Rwanda", city: "Rubavu", sector: "Aquaculture", contact: "Eric Habimana" },
  { name: "Masaka Farms", country: "Uganda", city: "Masaka", sector: "Agriculture & Food", contact: "Joseph Ssekandi" },
  { name: "OWP Pharmaceuticals", country: "Kenya", city: "Nairobi", sector: "Healthcare & Pharma", contact: "Fatima Diallo" },
  { name: "Pezesha", country: "Kenya", city: "Nairobi", sector: "Fintech & Inclusion", contact: "Brian Ouma" },
  { name: "poa! Internet", country: "Kenya", city: "Nairobi", sector: "Connectivity & Telecom", contact: "Nancy Wanjiku" },
  { name: "Rabboni Group", country: "Kenya", city: "Nairobi", sector: "Manufacturing & Distribution", contact: "Samuel Mwangi" },
  { name: "Taraji Afrika", country: "Tanzania", city: "Dar es Salaam", sector: "Agriculture & Food", contact: "Asha Juma" },
];

/** From https://www.talantonimpact.com/about/our-team */
const TEAM = [
  { fullName: "David Simms", role: "Managing Partner and Founder", department: "Leadership", manager: "", country: "United States", employmentType: "full_time", isOwner: true },
  { fullName: "Harry Turner", role: "Partner", department: "Leadership", manager: "David Simms", country: "United States", employmentType: "full_time", isOwner: false },
  { fullName: "Jon Halverson", role: "Partner", department: "Leadership", manager: "David Simms", country: "United States", employmentType: "full_time", isOwner: false },
  { fullName: "Iris Liang", role: "Associate Partner", department: "Investments", manager: "David Simms", country: "United States", employmentType: "full_time", isOwner: false },
  { fullName: "Andy Moore", role: "Associate Partner & CFO", department: "Finance", manager: "David Simms", country: "United States", employmentType: "full_time", isOwner: false },
  { fullName: "Michelle Ochieng", role: "VP Investor Relations", department: "Investor Relations", manager: "David Simms", country: "Kenya", employmentType: "full_time", isOwner: false },
  { fullName: "Kenneth Muchina", role: "Senior VP East Africa", department: "East Africa", manager: "David Simms", country: "Kenya", employmentType: "full_time", isOwner: false },
  { fullName: "Desiree Latu", role: "VP Marketing & Administration", department: "Marketing", manager: "David Simms", country: "United States", employmentType: "full_time", isOwner: false },
  { fullName: "Cynthia Omondi", role: "VP Investments", department: "Investments", manager: "Iris Liang", country: "Kenya", employmentType: "full_time", isOwner: false },
  { fullName: "Mercy Nelima", role: "Senior Manager Finance", department: "Finance", manager: "Andy Moore", country: "Kenya", employmentType: "full_time", isOwner: false },
  { fullName: "Carol Rubiro", role: "Manager Fund Operations", department: "Fund Operations", manager: "Andy Moore", country: "Kenya", employmentType: "full_time", isOwner: false },
  { fullName: "Paul Cherry", role: "Business Assessment", department: "Investments", manager: "Cynthia Omondi", country: "United States", employmentType: "full_time", isOwner: false },
  { fullName: "Linda Kiraithe, CFA", role: "Senior Analyst", department: "Investments", manager: "Cynthia Omondi", country: "Kenya", employmentType: "full_time", isOwner: false },
  { fullName: "Julie Turner", role: "Manager, Special Events", department: "Marketing", manager: "Desiree Latu", country: "United States", employmentType: "full_time", isOwner: false },
  { fullName: "Brooke Wyman", role: "Executive Assistant", department: "Administration", manager: "David Simms", country: "United States", employmentType: "full_time", isOwner: false },
  { fullName: "Kathy Drake", role: "Board Chair", department: "Board", manager: "", country: "United States", employmentType: "contractor", isOwner: false },
  { fullName: "Christian Hilliard", role: "Board Vice Chair", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", isOwner: false },
  { fullName: "Dave Tolmie", role: "Board Member, Vice Chair Investment Committee", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", isOwner: false },
  { fullName: "Dana Wichterman", role: "Board Member", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", isOwner: false },
  { fullName: "Herve Sarteau", role: "Board Member, Chair Investment Committee", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", isOwner: false },
  { fullName: "Jeff Meyer", role: "Board Member", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", isOwner: false },
  { fullName: "Peter Thorrington", role: "Founding Board Chair", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", isOwner: false },
  { fullName: "Sam Mwale", role: "Board Member", department: "Board", manager: "Kathy Drake", country: "Kenya", employmentType: "contractor", isOwner: false },
];

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

async function upsertPlatformUser({ email, displayName, workspaceId, role, isOwner }) {
  const username = normalizeUsername(email);
  const passwordHash = hashPlatformPasswordForUser(username, OWNER_PASSWORD);
  const { data: byEmail } = await admin.from("platform_users").select("id").eq("email", email).maybeSingle();
  const { data: byUsername } = await admin.from("platform_users").select("id").eq("username", username).maybeSingle();
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

async function main() {
  if (FORBIDDEN_TARGET_SLUGS.has(SLUG)) throw new Error(`Refusing forbidden slug: ${SLUG}`);

  const { data: demo, error: dErr } = await admin.from("workspaces").select("id, slug").eq("slug", "demo").maybeSingle();
  if (dErr || !demo?.id) throw new Error(`Demo missing: ${dErr?.message || "not found"}`);

  let workspaceId;
  {
    const { data: existingWs } = await admin.from("workspaces").select("id, slug").eq("slug", SLUG).maybeSingle();
    if (existingWs?.id) {
      if (FORBIDDEN_TARGET_SLUGS.has(existingWs.slug)) throw new Error(`Refusing protected: ${existingWs.slug}`);
      workspaceId = existingWs.id;
      console.log("Using existing workspace", SLUG, workspaceId);
    } else {
      workspaceId = await rpc("provision_workspace", { company_name: COMPANY, workspace_slug: SLUG });
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
      timezone: "Africa/Nairobi",
      currency: "USD",
      primary_colour: "#0B3D2E",
      secondary_colour: "#1B8A5A",
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
    WHERE w.id = v_target AND w.slug IN ('demo','unit311','corpcentre','corporatecentre','internal')
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
    gen_random_uuid(), v_target, 'Talanton Impact', 'Talanton Impact',
    'Newtown Square, PA', 'Newtown Square, PA', 'United States',
    '${WEBSITE}', 'demo@talantonimpact.com', '',
    'Impact investment Portfolio Governance Platform supporting portfolio companies across Africa.',
    'Active', now(), now()
  );
END;
$struct$;
`);

  {
    const { data: pay } = await admin.from("payroll_settings").select("*").eq("workspace_id", demo.id).maybeSingle();
    if (pay) {
      const { id: _id, ...rest } = pay;
      await admin.from("payroll_settings").delete().eq("workspace_id", workspaceId);
      await admin.from("payroll_settings").insert({ ...rest, workspace_id: workspaceId, currency: "USD" });
    }
  }

  // Clear Demo/Meridian partner portal rows for this workspace only
  console.log("Clearing partners…");
  {
    const { error } = await admin.from("partners").delete().eq("workspace_id", workspaceId);
    if (error && !/does not exist|Could not find/i.test(error.message)) {
      console.warn("partners delete:", error.message);
    }
  }

  // Seed Client Directory = same 19 portfolio companies
  console.log("Seeding portfolio clients…");
  await admin.from("internal_clients").delete().eq("workspace_id", workspaceId);
  for (const c of PORTFOLIO_COMPANIES) {
    const slug = slugify(c.name);
    const row = {
      id: `ti-cli-${slug}`,
      workspace_id: workspaceId,
      company_name: c.name,
      industry: c.sector,
      primary_contact: c.contact,
      email: `${slugify(c.contact)}@${slug}.impact`,
      phone: "",
      region: c.country,
      account_status: "Client Created",
      contract_type: "Investment",
      tax_id: "",
      billing_address: `${c.city}, ${c.country}`,
      active_projects: 0,
      notes: `Talanton Impact portfolio company · ${c.sector}`,
      company_address: `${c.city}, ${c.country}`,
      company_city: c.city,
      company_country: c.country,
      invoice_email: `${slugify(c.contact)}@${slug}.impact`,
    };
    const { error } = await admin.from("internal_clients").insert(row);
    if (error) console.warn(`client ${c.name}:`, error.message);
  }

  // HR wipe + seed team
  console.log("Seeding HR team…");
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

  const empIdByName = new Map();
  for (const person of TEAM) {
    const id = `ti-emp-${slugify(person.fullName)}`;
    empIdByName.set(person.fullName, id);
    const emailLocal = slugify(person.fullName.replace(/,.*/, ""));
    const row = {
      id,
      workspace_id: workspaceId,
      full_name: person.fullName,
      preferred_name: person.fullName.split(" ")[0],
      email: `${emailLocal}@talantonimpact.com`,
      phone: "",
      date_joined: "2020-01-15",
      employment_status: "active",
      employment_type: person.employmentType,
      role: person.role,
      department: person.department,
      location: person.country,
      manager: person.manager || "",
      currency: "USD",
      address: person.country === "Kenya" ? "Nairobi, Kenya" : "Newtown Square, PA",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
      nationality: person.country === "Kenya" ? "Kenyan" : "American",
    };
    const { error } = await admin.from("hr_employees").insert(row);
    if (error) {
      const { id: _id, ...rest } = row;
      const { error: e2 } = await admin.from("hr_employees").insert(rest);
      if (e2) console.warn(`hr ${person.fullName}:`, error.message, "/", e2.message);
    }
  }

  // Owner logins + team user directory (investment team get workspace membership)
  console.log("Seeding users…");
  await upsertPlatformUser({
    email: "demo@talantonimpact.com",
    displayName: "Talanton Impact Owner",
    workspaceId,
    role: "owner",
    isOwner: true,
  });
  await upsertPlatformUser({
    email: "info@talantonimpact.com",
    displayName: "Talanton Impact",
    workspaceId,
    role: "admin",
    isOwner: false,
  });

  for (const person of TEAM.filter((p) => p.employmentType === "full_time")) {
    const emailLocal = slugify(person.fullName.replace(/,.*/, ""));
    const email = `${emailLocal}@talantonimpact.com`;
    const userId = await upsertPlatformUser({
      email,
      displayName: person.fullName,
      workspaceId,
      role: person.isOwner ? "owner" : "admin",
      isOwner: Boolean(person.isOwner),
    });
    const empId = empIdByName.get(person.fullName);
    if (empId && userId) {
      await admin.from("hr_employees").update({ platform_user_id: userId }).eq("id", empId);
    }
  }

  for (const username of ["paul.fotheringham", "paul@unit311central.com"]) {
    const { data: paul } = await admin.from("platform_users").select("id").eq("username", username).maybeSingle();
    if (paul?.id) await ensureMembership(workspaceId, paul.id, "admin", false);
  }

  const counts = {};
  for (const t of [
    "workspace_modules",
    "file_categories",
    "accounts",
    "company_details",
    "internal_clients",
    "hr_employees",
    "partners",
  ]) {
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
  console.log("Owner: demo@talantonimpact.com /", OWNER_PASSWORD);
  console.log("Demo / Internal / CorpCentre were not modified.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
