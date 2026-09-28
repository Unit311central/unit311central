/**
 * Set platform password for one Talanton portfolio company portal user.
 *
 *   node scripts/set-talanton-company-portal-password.mjs demo@arcrideglobal.com 'Africa2026$'
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

const usernameArg = process.argv[2];
const passwordArg = process.argv[3];

if (!usernameArg || !passwordArg) {
  console.error("Usage: node scripts/set-talanton-company-portal-password.mjs <username> <password>");
  process.exit(1);
}

if (!SERVICE_KEY && !ACCESS_TOKEN) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const admin =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

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

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verify(password, storedHash) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

async function main() {
  const username = normalizeUsername(usernameArg);
  const passwordHash = hashPlatformPasswordForUser(username, passwordArg);

  let user = null;
  if (admin) {
    const { data, error } = await admin
      .from("platform_users")
      .select("id, username, redirect_path, workspace_id, password_hash")
      .eq("username", username)
      .maybeSingle();
    if (error || !data?.id) {
      console.error("User not found:", username, error?.message);
      process.exit(1);
    }
    user = data;
    const { error: updateErr } = await admin
      .from("platform_users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    if (updateErr) {
      console.error("Update failed:", updateErr.message);
      process.exit(1);
    }
    const { data: check } = await admin
      .from("platform_users")
      .select("password_hash")
      .eq("id", user.id)
      .maybeSingle();
    user.password_hash = check?.password_hash ?? user.password_hash;
  } else {
    const rows = await mgmtQuery(`
      select id, username, redirect_path, workspace_id, password_hash
      from public.platform_users
      where lower(username) = lower(${sqlLiteral(username)})
      limit 1
    `);
    user = rows?.[0];
    if (!user?.id) {
      console.error("User not found:", username);
      process.exit(1);
    }
    await mgmtQuery(`
      update public.platform_users
      set password_hash = ${sqlLiteral(passwordHash)},
          updated_at = now()
      where id = ${sqlLiteral(user.id)}
    `);
    const verifyRows = await mgmtQuery(`
      select password_hash from public.platform_users where id = ${sqlLiteral(user.id)} limit 1
    `);
    user.password_hash = verifyRows?.[0]?.password_hash ?? passwordHash;
  }

  const ok = user.password_hash && verify(passwordArg, user.password_hash);
  console.log(
    JSON.stringify(
      {
        username: user.username,
        redirect_path: user.redirect_path,
        passwordUpdated: ok,
      },
      null,
      2,
    ),
  );
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
