/**
 * Ensure demo@unit311central.com exists for OnwardAir password-reset testing.
 * Also attempts OTP column migration when a working management token is available.
 *
 *   node scripts/fix-onwardair-password-reset.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { scryptSync } from "node:crypto";
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
  ...loadEnvFile(path.join(root, ".env.deploy.pull")),
  ...loadEnvFile(path.join(root, ".env.unit311central.prod")),
  ...loadEnvFile(path.join(root, ".env.vercel.lms")),
  ...loadEnvFile(path.join(root, ".env.corporatecentre.runtime")),
};

function env(k) {
  return String(merged[k] || process.env[k] || "").trim();
}

const SUPABASE_URL = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const ACCESS_TOKEN = env("SUPABASE_ACCESS_TOKEN");
const PROJECT_REF = env("SUPABASE_PROJECT_REF") || "kkxtvzxqmbacjatkiupq";
const SETUP_SECRET = env("INTERNAL_FILES_SETUP_SECRET");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const OA_SLUG = "onwardair";
const OA_WS_ID = "3b479f90-d063-421b-ae93-542a508129f5";
const EMAIL = "demo@unit311central.com";
const PASSWORD = "Houston1999$";
const DISPLAY = "OnwardAir Demo";

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function mgmtQuery(token, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`mgmt SQL ${res.status}: ${JSON.stringify(data).slice(0, 800)}`);
  }
  return data;
}

async function tryApplyOtpColumns() {
  const sql = fs.readFileSync(
    path.join(root, "supabase/migrations/133_platform_password_reset_otp.sql"),
    "utf8",
  );
  const token = ACCESS_TOKEN;
  if (!token || token.length < 20) {
    console.warn("No usable SUPABASE_ACCESS_TOKEN — skipping direct SQL apply");
    return false;
  }
  try {
    await mgmtQuery(token, `${sql}\nnotify pgrst, 'reload schema';`);
    const cols = await mgmtQuery(
      token,
      `select column_name from information_schema.columns
       where table_schema='public' and table_name='platform_password_reset_tokens'
         and column_name in ('otp_hash','otp_verified_at','otp_attempts')
       order by column_name`,
    );
    console.log(
      "OTP columns:",
      (Array.isArray(cols) ? cols : []).map((r) => r.column_name).join(", "),
    );
    return true;
  } catch (err) {
    console.warn("Direct SQL apply failed:", err instanceof Error ? err.message.slice(0, 200) : err);
    return false;
  }
}

async function tryApplyViaInternalApi() {
  if (!SETUP_SECRET || SETUP_SECRET.length < 8) {
    console.warn("No INTERNAL_FILES_SETUP_SECRET — skipping internal apply API");
    return false;
  }
  const url =
    "https://onwardair.unit311central.com/api/internal/apply-unit311central-pending-migrations";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SETUP_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const text = await res.text();
    console.log("Internal apply API:", res.status, text.slice(0, 400));
    return res.ok;
  } catch (err) {
    console.warn("Internal apply API failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

async function upsertDemoUser() {
  const { data: ws } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", OA_SLUG)
    .maybeSingle();
  const workspaceId = ws?.id || OA_WS_ID;
  console.log(`OnwardAir workspace: ${workspaceId}`);

  const username = normalizeUsername(EMAIL);
  const passwordHash = hashPlatformPasswordForUser(username, PASSWORD);
  const now = new Date().toISOString();

  const { data: byEmail } = await admin
    .from("platform_users")
    .select("id, email, username, workspace_id")
    .eq("email", EMAIL)
    .maybeSingle();
  const { data: byUsername } = await admin
    .from("platform_users")
    .select("id, email, username, workspace_id")
    .eq("username", username)
    .maybeSingle();

  let userId = byEmail?.id || byUsername?.id;
  const patch = {
    username,
    display_name: DISPLAY,
    password_hash: passwordHash,
    user_type: "internal",
    redirect_path: "/dashboard",
    client_name: "OnwardAir",
    is_active: true,
    email: EMAIL,
    email_verified_at: now,
    workspace_id: workspaceId,
    updated_at: now,
  };

  if (userId) {
    const { error } = await admin.from("platform_users").update(patch).eq("id", userId);
    if (error) throw new Error(`update user: ${error.message}`);
    console.log(`Updated existing platform user ${EMAIL} (${userId})`);
  } else {
    const { data: user, error } = await admin
      .from("platform_users")
      .insert(patch)
      .select("id")
      .single();
    if (error) throw new Error(`insert user: ${error.message}`);
    userId = user.id;
    console.log(`Created platform user ${EMAIL} (${userId})`);
  }

  const { data: mem } = await admin
    .from("workspace_users")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!mem) {
    const { error } = await admin.from("workspace_users").insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: "admin",
      is_owner: false,
    });
    if (error) throw new Error(`workspace_users: ${error.message}`);
    console.log("Added OnwardAir workspace membership");
  } else {
    console.log("OnwardAir workspace membership already present");
  }
}

async function main() {
  console.log("Ensuring demo user…");
  await upsertDemoUser();

  console.log("Applying OTP columns…");
  const appliedDirect = await tryApplyOtpColumns();
  if (!appliedDirect) {
    await tryApplyViaInternalApi();
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
