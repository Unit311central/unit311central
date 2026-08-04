/**
 * Provision OnwardAir Board Portal external user.
 *
 *   https://onwardair.unit311central.com/board
 *   board@onwardair.tech / boardportal2040$
 *
 *   node scripts/provision-onwardair-board-portal.mjs
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
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLUG = "onwardair";
const PASSWORD = "boardportal2040$";
const CLIENT_ID = "oa-cli-board";
const USERNAME = "board@onwardair.tech";
const PORTAL_PATH = "board";
const PORTAL_URL = `https://onwardair.unit311central.com/${PORTAL_PATH}`;
const FORBIDDEN_TARGET_SLUGS = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
  "abhi",
]);

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  if (FORBIDDEN_TARGET_SLUGS.has(SLUG)) throw new Error(`Refusing forbidden slug: ${SLUG}`);

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws) {
    console.error("OnwardAir workspace not found", wsErr?.message);
    process.exit(1);
  }
  if (ws.slug !== "onwardair") throw new Error("onwardair workspace slug mismatch — refusing");

  const now = new Date().toISOString();
  const { data: existingClient } = await admin
    .from("internal_clients")
    .select("id")
    .eq("id", CLIENT_ID)
    .eq("workspace_id", ws.id)
    .maybeSingle();

  if (!existingClient?.id) {
    const { error: insertClientErr } = await admin.from("internal_clients").insert({
      id: CLIENT_ID,
      workspace_id: ws.id,
      company_name: "OnwardAir Board",
      account_status: "Active",
      industry: "Governance",
      region: "United States",
      company_country: "United States",
      company_city: "Houston",
      contract_type: "Board Access",
      notes: "OnwardAir Board Portal — external board member access (role: Board Member)",
      platform_url: PORTAL_URL,
      email: USERNAME,
      primary_contact: "OnwardAir Board Member",
      created_at: now,
      updated_at: now,
    });
    if (insertClientErr) {
      console.error("Failed to create board client", insertClientErr.message);
      process.exit(1);
    }
    console.log("Created client", CLIENT_ID);
  } else {
    await admin
      .from("internal_clients")
      .update({
        company_name: "OnwardAir Board",
        account_status: "Active",
        platform_url: PORTAL_URL,
        updated_at: now,
      })
      .eq("id", CLIENT_ID)
      .eq("workspace_id", ws.id);
    console.log("Updated client", CLIENT_ID, "->", PORTAL_URL);
  }

  const username = normalizeUsername(USERNAME);
  const payload = {
    username,
    display_name: "OnwardAir Board Member",
    user_type: "external",
    workspace_id: ws.id,
    client_id: CLIENT_ID,
    client_name: "OnwardAir Board",
    email: username,
    redirect_path: `/${PORTAL_PATH}`,
    password_hash: hashPlatformPasswordForUser(username, PASSWORD),
    is_active: true,
    updated_at: now,
  };

  const { data: existingUser } = await admin
    .from("platform_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUser?.id) {
    const { error } = await admin.from("platform_users").update(payload).eq("id", existingUser.id);
    if (error) {
      console.error("update failed", error.message);
      process.exit(1);
    }
    console.log("Updated user", username);
  } else {
    const { error } = await admin.from("platform_users").insert({
      ...payload,
      created_at: now,
    });
    if (error) {
      console.error("insert failed", error.message);
      process.exit(1);
    }
    console.log("Created user", username);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        portal: PORTAL_URL,
        username,
        password: PASSWORD,
        role: "Board Member",
        userType: "external",
        clientId: CLIENT_ID,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
