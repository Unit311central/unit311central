/**
 * Idempotent MAM workspace admin (admin@mam.me).
 * Password: MAM_ADMIN_PLATFORM_PASSWORD env (never log).
 *
 *   MAM_ADMIN_PLATFORM_PASSWORD='...' node scripts/provision-mam-admin-user.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  const out = {};
  try {
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v && !v.startsWith("[SENSITI")) out[k] = v;
    }
  } catch {
    /* optional */
  }
  return out;
}

const merged = {
  ...loadEnvFile(path.join(root, ".env.unit311central.prod")),
  ...loadEnvFile(path.join(root, ".env.corporatecentre.runtime")),
  ...process.env,
};

const SUPABASE_URL = merged.SUPABASE_URL || merged.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = merged.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_TOKEN = merged.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = merged.SUPABASE_PROJECT_REF || "kkxtvzxqmbacjatkiupq";

const MAM_SLUG = "mam";
const EMAIL = "admin@mam.me";
const DISPLAY_NAME = "MAM Administrator";
const COMPANY = "Moroccan Advanced Manufacturing";
const PLATFORM_PASSWORD = merged.MAM_ADMIN_PLATFORM_PASSWORD?.trim();
const FULL_MODULES = [
  "home",
  "executive-assistant",
  "intelligence",
  "business-central",
  "sales-management",
  "financials",
  "fundraising",
  "board",
  "corporate-information",
  "operations",
  "marketing-events",
  "technology-management",
  "human-resources",
  "business-productivity",
  "support-desk",
  "project-management",
  "engineering",
  "training",
  "qms",
  "tools",
  "external-client-access",
  "settings",
];

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

async function mgmtQuery(sql) {
  if (!ACCESS_TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN required for management API fallback");
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
    throw new Error(`mgmt SQL failed ${res.status}: ${JSON.stringify(data).slice(0, 800)}`);
  }
  return data;
}

async function main() {
  if (!PLATFORM_PASSWORD) {
    throw new Error("MAM_ADMIN_PLATFORM_PASSWORD is required");
  }

  const username = normalizeUsername(EMAIL);
  const passwordHash = hashPlatformPasswordForUser(username, PLATFORM_PASSWORD);
  const now = new Date().toISOString();

  if (!SERVICE_KEY || !SUPABASE_URL) {
    console.log("No Supabase service role — applying migration SQL via management API");
    await mgmtQuery(fs.readFileSync(path.join(root, "supabase/migrations/216_mam_admin_user.sql"), "utf8"));
    console.log(JSON.stringify({ ok: true, method: "migration-sql", email: EMAIL }, null, 2));
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", MAM_SLUG)
    .maybeSingle();
  if (wsErr || !ws?.id) {
    throw new Error(`MAM workspace missing: ${wsErr?.message || "not found"}`);
  }

  await admin
    .from("workspace_admin_metadata")
    .update({
      contact_email: EMAIL,
      contact_name: DISPLAY_NAME,
      enabled_modules: FULL_MODULES,
      updated_at: now,
    })
    .eq("workspace_id", ws.id);

  const { data: byEmail } = await admin
    .from("platform_users")
    .select("id, password_hash")
    .eq("email", EMAIL)
    .maybeSingle();
  const { data: byUsername } = await admin
    .from("platform_users")
    .select("id, password_hash")
    .eq("username", username)
    .maybeSingle();

  let userId = byEmail?.id ?? byUsername?.id ?? null;
  let action = "unchanged";

  const patch = {
    username,
    display_name: DISPLAY_NAME,
    password_hash: passwordHash,
    user_type: "internal",
    redirect_path: "/dashboard",
    client_name: COMPANY,
    is_active: true,
    email: EMAIL,
    email_verified_at: now,
    workspace_id: ws.id,
    updated_at: now,
  };

  if (userId) {
    const { error } = await admin.from("platform_users").update(patch).eq("id", userId);
    if (error) throw new Error(`platform_users update: ${error.message}`);
    action = "updated";
  } else {
    const { data: user, error } = await admin.from("platform_users").insert(patch).select("id").single();
    if (error) throw new Error(`platform_users insert: ${error.message}`);
    userId = user.id;
    action = "inserted";
  }

  const { data: mem } = await admin
    .from("workspace_users")
    .select("id, role, is_owner")
    .eq("workspace_id", ws.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!mem) {
    const { error } = await admin.from("workspace_users").insert({
      workspace_id: ws.id,
      user_id: userId,
      role: "admin",
      is_owner: true,
    });
    if (error) throw new Error(`workspace_users insert: ${error.message}`);
  } else if (mem.role !== "admin" || !mem.is_owner) {
    const { error } = await admin
      .from("workspace_users")
      .update({ role: "admin", is_owner: true, updated_at: now })
      .eq("id", mem.id);
    if (error) throw new Error(`workspace_users update: ${error.message}`);
  }

  const operatorPatch = {
    operator_label: "MAM Admin",
    full_name: DISPLAY_NAME,
    username,
    email: EMAIL,
    role: "Admin",
    roles: ["Board", "Exec", "Manager", "Associate", "Admin"],
    department: "Corporate",
    departments: ["Board", "Exec", "Manager", "Engineering", "Sales", "Finance", "Operations", "HR", "Corporate", "Technology"],
    status: "Active",
    region: "Morocco",
    notes: "MAM full-access administrator",
    allowed_views: null,
    updated_at: now,
  };

  const { data: op } = await admin
    .from("internal_operators")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (op?.id) {
    const { error } = await admin.from("internal_operators").update(operatorPatch).eq("id", op.id);
    if (error) throw new Error(`internal_operators update: ${error.message}`);
  } else {
    const { error } = await admin.from("internal_operators").insert({
      id: userId,
      ...operatorPatch,
      created_at: now,
    });
    if (error) throw new Error(`internal_operators insert: ${error.message}`);
  }

  const { data: verifyUser } = await admin
    .from("platform_users")
    .select("password_hash")
    .eq("id", userId)
    .single();

  const passwordOk = verifyUser?.password_hash
    ? verifyPassword(PLATFORM_PASSWORD, verifyUser.password_hash)
    : false;

  console.log(
    JSON.stringify(
      {
        ok: true,
        email: EMAIL,
        platformUserAction: action,
        userId,
        workspaceId: ws.id,
        workspaceSlug: MAM_SLUG,
        passwordVerified: passwordOk,
        loginUrl: "https://mam.unit311central.com/login",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
