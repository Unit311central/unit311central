/**
 * Set platform password for canonical demo@unit311central.com (OnwardAir-capable account).
 *   node scripts/set-demo-onwardair-password.mjs
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

const merged = { ...loadEnvFile(path.join(root, ".env.corporatecentre.runtime")) };
const admin = createClient(
  merged.SUPABASE_URL || merged.NEXT_PUBLIC_SUPABASE_URL,
  merged.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const EMAIL = "demo@unit311central.com";
const PASSWORD = "Franny1999$";
const OA_ID = "3b479f90-d063-421b-ae93-542a508129f5";

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

const { data: user, error } = await admin
  .from("platform_users")
  .select("id, email, username, workspace_id, password_hash, user_type")
  .eq("username", EMAIL)
  .eq("is_active", true)
  .maybeSingle();
if (error) throw new Error(error.message);
if (!user) throw new Error("Canonical demo@ user not found");

const passwordHash = hashPlatformPasswordForUser(user.username, PASSWORD);
const { error: updErr } = await admin
  .from("platform_users")
  .update({
    password_hash: passwordHash,
    email: EMAIL,
    workspace_id: OA_ID,
    user_type: "internal",
    is_active: true,
    updated_at: new Date().toISOString(),
  })
  .eq("id", user.id);
if (updErr) throw new Error(updErr.message);

const { data: mem } = await admin
  .from("workspace_users")
  .select("id, role")
  .eq("workspace_id", OA_ID)
  .eq("user_id", user.id)
  .maybeSingle();
if (!mem) {
  const { error: memErr } = await admin.from("workspace_users").insert({
    workspace_id: OA_ID,
    user_id: user.id,
    role: "admin",
    is_owner: false,
  });
  if (memErr) throw new Error(memErr.message);
  console.log("Added OnwardAir membership");
} else {
  console.log("OnwardAir membership present:", mem.role);
}

const ok = verify(PASSWORD, passwordHash);
console.log({
  userId: user.id,
  username: user.username,
  passwordSetTo: PASSWORD,
  verifies: ok,
  workspaceId: OA_ID,
});
