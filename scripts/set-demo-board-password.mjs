/**
 * Set platform password for Northstar demo board portal user.
 *
 *   https://demo.unit311central.com/board
 *   board@unit311central.com / Letmein2026$
 *
 *   node scripts/set-demo-board-password.mjs
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

const DEMO_SLUG = "demo";
const USERNAME = "board@unit311central.com";
const PASSWORD = "Letmein2026$";
const CLIENT_ID = "nst-cli-board";
const PORTAL_PATH = "board";
const PORTAL_URL = `https://demo.unit311central.com/${PORTAL_PATH}`;

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
  const { data: workspace, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();
  if (wsErr || !workspace?.id) {
    console.error("Demo workspace not found", wsErr?.message);
    process.exit(1);
  }

  const username = normalizeUsername(USERNAME);
  const now = new Date().toISOString();
  const passwordHash = hashPlatformPasswordForUser(username, PASSWORD);

  const { data: existingClient } = await admin
    .from("internal_clients")
    .select("id")
    .eq("id", CLIENT_ID)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (!existingClient?.id) {
    const { error: clientErr } = await admin.from("internal_clients").insert({
      id: CLIENT_ID,
      workspace_id: workspace.id,
      company_name: "Northstar Board",
      account_status: "Active",
      industry: "Governance",
      region: "United Kingdom",
      company_country: "United Kingdom",
      company_city: "Manchester",
      contract_type: "Board Access",
      notes: "Northstar demo board portal — external board member access",
      platform_url: PORTAL_URL,
      email: username,
      primary_contact: "Northstar Board Member",
      created_at: now,
      updated_at: now,
    });
    if (clientErr) {
      console.error("Failed to create board client", clientErr.message);
      process.exit(1);
    }
    console.log("Created client", CLIENT_ID);
  }

  const payload = {
    username,
    display_name: "Northstar Board Member",
    user_type: "external",
    workspace_id: workspace.id,
    client_id: CLIENT_ID,
    client_name: "Northstar Board",
    email: username,
    redirect_path: `/${PORTAL_PATH}`,
    password_hash: passwordHash,
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

  const ok = verify(PASSWORD, passwordHash);
  console.log(
    JSON.stringify(
      {
        ok,
        portal: PORTAL_URL,
        username,
        password: PASSWORD,
        workspace: workspace.slug,
        verifies: ok,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
