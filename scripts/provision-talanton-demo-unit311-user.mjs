/**
 * Provision demo@unit311central.com on Talanton Impact for login + password-reset testing.
 * Does not reseed Talanton data or change the user's primary workspace when already set.
 *
 *   node scripts/provision-talanton-demo-unit311-user.mjs
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
};

const SUPABASE_URL = merged.SUPABASE_URL || merged.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = merged.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TALANTON_SLUG = "talantonimpact";
const EMAIL = "demo@unit311central.com";
const PASSWORD = "Franny1999$";
const DISPLAY = "Talanton Demo";

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

async function ensureMembership(workspaceId, userId, role, isOwner) {
  const { data: mem } = await admin
    .from("workspace_users")
    .select("id, role, is_owner")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!mem) {
    const { error } = await admin.from("workspace_users").insert({
      workspace_id: workspaceId,
      user_id: userId,
      role,
      is_owner: isOwner,
    });
    if (error) throw new Error(`workspace_users insert: ${error.message}`);
    console.log(`Added Talanton membership (${role}, owner=${isOwner})`);
    return;
  }

  if (mem.role !== role || mem.is_owner !== isOwner) {
    const { error } = await admin
      .from("workspace_users")
      .update({ role, is_owner: isOwner })
      .eq("id", mem.id);
    if (error) throw new Error(`workspace_users update: ${error.message}`);
    console.log(`Updated Talanton membership to ${role}, owner=${isOwner}`);
    return;
  }

  console.log("Talanton membership already present (owner)");
}

async function ensureInternalOperator(username, email, displayName) {
  const { data: existing } = await admin
    .from("internal_operators")
    .select("id, allowed_views, role, status")
    .eq("username", username)
    .maybeSingle();

  const patch = {
    operator_label: "Talanton Demo",
    full_name: displayName,
    username,
    email,
    role: "Admin",
    roles: ["Admin"],
    status: "Active",
    region: "Multi-site",
    allowed_views: null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin.from("internal_operators").update(patch).eq("id", existing.id);
    if (error) throw new Error(`internal_operators update: ${error.message}`);
    console.log("Updated internal_operators row (full access)");
    return;
  }

  const { error } = await admin.from("internal_operators").insert({
    id: "user-talanton-demo-unit311",
    ...patch,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error(`internal_operators insert: ${error.message}`);
  console.log("Created internal_operators row (full access)");
}

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", TALANTON_SLUG)
    .maybeSingle();
  if (wsErr || !ws?.id) {
    throw new Error(`Talanton workspace missing: ${wsErr?.message || "not found"}`);
  }

  const username = normalizeUsername(EMAIL);
  const passwordHash = hashPlatformPasswordForUser(username, PASSWORD);
  const now = new Date().toISOString();

  const { data: byEmail } = await admin
    .from("platform_users")
    .select("id, email, username, workspace_id, user_type")
    .eq("email", EMAIL)
    .maybeSingle();
  const { data: byUsername } = await admin
    .from("platform_users")
    .select("id, email, username, workspace_id, user_type")
    .eq("username", username)
    .maybeSingle();

  let userId = byEmail?.id || byUsername?.id;
  const patch = {
    username,
    display_name: DISPLAY,
    password_hash: passwordHash,
    user_type: "internal",
    redirect_path: "/dashboard",
    client_name: ws.name,
    is_active: true,
    email: EMAIL,
    email_verified_at: now,
    updated_at: now,
  };

  if (userId) {
    if (!byEmail?.workspace_id && !byUsername?.workspace_id) {
      patch.workspace_id = ws.id;
    }
    const { error } = await admin.from("platform_users").update(patch).eq("id", userId);
    if (error) throw new Error(`platform_users update: ${error.message}`);
    console.log(`Updated platform user ${EMAIL} (${userId})`);
  } else {
    patch.workspace_id = ws.id;
    const { data: user, error } = await admin
      .from("platform_users")
      .insert(patch)
      .select("id")
      .single();
    if (error) throw new Error(`platform_users insert: ${error.message}`);
    userId = user.id;
    console.log(`Created platform user ${EMAIL} (${userId})`);
  }

  await ensureMembership(ws.id, userId, "owner", true);
  await ensureInternalOperator(username, EMAIL, DISPLAY);

  const ok = verify(PASSWORD, passwordHash);
  console.log({
    email: EMAIL,
    password: PASSWORD,
    userId,
    talantonWorkspaceId: ws.id,
    passwordVerifies: ok,
    loginHost: "https://talantonimpact.unit311central.com/login",
    resetHost: "https://talantonimpact.unit311central.com/resetpassword",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
