/**
 * Provision dedicated SAEC client demonstration login (demo@saec.biz).
 * Password is read from SAEC_DEMO_PASSWORD — never commit or log the password.
 *
 *   SAEC_DEMO_PASSWORD='...' node scripts/provision-saec-demo-user.mjs
 */
import { scryptSync, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PROJECT_REF = "kkxtvzxqmbacjatkiupq";
const SAEC_SLUG = "saec";
const EMAIL = "demo@saec.biz";
const DISPLAY = "SAEC Demo";

const FORBIDDEN_EMAILS = new Set([
  "demo@unit311central.com",
  "demo@interfaceworx.com",
  "demo@interfaceworx.co.uk",
]);

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

async function fetchSupabaseCredentials() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch Supabase API keys: ${response.status}`);
  const keys = await response.json();
  const serviceRole = keys.find((key) => key.name === "service_role")?.api_key;
  if (!serviceRole) throw new Error("Supabase service_role API key not found.");
  return {
    url: `https://${PROJECT_REF}.supabase.co`,
    serviceRoleKey: serviceRole,
  };
}

async function ensureSaecMembership(admin, workspaceId, userId) {
  const { data: mem, error: memErr } = await admin
    .from("workspace_users")
    .select("id, role, is_owner, workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memErr) throw new Error(`workspace_users lookup: ${memErr.message}`);

  if (!mem) {
    const { error } = await admin.from("workspace_users").insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: "admin",
      is_owner: false,
    });
    if (error) throw new Error(`workspace_users insert: ${error.message}`);
    console.log("Added SAEC workspace membership (admin, owner=false)");
    return;
  }

  if (mem.role !== "admin" || mem.is_owner !== false) {
    const { error } = await admin
      .from("workspace_users")
      .update({ role: "admin", is_owner: false, updated_at: new Date().toISOString() })
      .eq("id", mem.id);
    if (error) throw new Error(`workspace_users update: ${error.message}`);
    console.log("Updated SAEC workspace membership (admin, owner=false)");
    return;
  }

  console.log("SAEC workspace membership already correct (admin, owner=false)");
}

async function removeOtherWorkspaceMemberships(admin, userId, saecWorkspaceId) {
  const { data: memberships, error } = await admin
    .from("workspace_users")
    .select("id, workspace_id")
    .eq("user_id", userId);
  if (error) throw new Error(`workspace_users list: ${error.message}`);

  const foreign = (memberships ?? []).filter((row) => row.workspace_id !== saecWorkspaceId);
  if (foreign.length === 0) return;

  const { error: deleteErr } = await admin
    .from("workspace_users")
    .delete()
    .eq("user_id", userId)
    .neq("workspace_id", saecWorkspaceId);
  if (deleteErr) throw new Error(`workspace_users cleanup: ${deleteErr.message}`);
  console.log(`Removed ${foreign.length} non-SAEC workspace membership(s)`);
}

async function main() {
  const password = process.env.SAEC_DEMO_PASSWORD?.trim();
  if (!password) {
    throw new Error("SAEC_DEMO_PASSWORD is required (never commit this value).");
  }

  if (FORBIDDEN_EMAILS.has(normalizeUsername(EMAIL))) {
    throw new Error(`Refusing forbidden reuse email: ${EMAIL}`);
  }

  const credentials = await fetchSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name, status")
    .eq("slug", SAEC_SLUG)
    .maybeSingle();
  if (wsErr || !ws?.id) {
    throw new Error(`SAEC workspace missing: ${wsErr?.message || "not found"}`);
  }
  if (ws.slug !== SAEC_SLUG) throw new Error("SAEC workspace slug mismatch — refusing");

  const username = normalizeUsername(EMAIL);
  const passwordHash = hashPlatformPasswordForUser(username, password);
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

  if (userId && byEmail?.id && byUsername?.id && byEmail.id !== byUsername.id) {
    throw new Error("Conflicting platform_users rows for demo@saec.biz — manual cleanup required.");
  }

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
    workspace_id: ws.id,
    updated_at: now,
  };

  if (userId) {
    const existingWorkspaceId = byEmail?.workspace_id || byUsername?.workspace_id;
    if (existingWorkspaceId && existingWorkspaceId !== ws.id) {
      throw new Error(
        `${EMAIL} is assigned to another workspace (${existingWorkspaceId}). Refusing cross-tenant reuse.`,
      );
    }
    const { error } = await admin.from("platform_users").update(patch).eq("id", userId);
    if (error) throw new Error(`platform_users update: ${error.message}`);
    console.log(`Updated platform user ${EMAIL} (${userId})`);
  } else {
    const { data: user, error } = await admin
      .from("platform_users")
      .insert(patch)
      .select("id")
      .single();
    if (error) throw new Error(`platform_users insert: ${error.message}`);
    userId = user.id;
    console.log(`Created platform user ${EMAIL} (${userId})`);
  }

  await ensureSaecMembership(admin, ws.id, userId);
  await removeOtherWorkspaceMemberships(admin, userId, ws.id);

  const { data: stored } = await admin
    .from("platform_users")
    .select("id, email, workspace_id, password_hash, user_type, is_active")
    .eq("id", userId)
    .maybeSingle();
  if (!stored?.password_hash) throw new Error("Password hash missing after provisioning.");

  const passwordVerifies = verifyPassword(password, stored.password_hash);
  if (!passwordVerifies) throw new Error("Password verification failed after provisioning.");

  console.log(
    JSON.stringify(
      {
        status: "ok",
        email: EMAIL,
        userId,
        workspaceId: ws.id,
        workspaceSlug: ws.slug,
        workspaceName: ws.name,
        role: "admin",
        isOwner: false,
        userType: stored.user_type,
        passwordVerifies,
        loginUrl: "https://saec.unit311central.com/login",
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
