/**
 * Seed Northstar demo Sheffield client-portal external user.
 *
 * Portal: https://demo.unit311central.com/sheffield-precision
 *   demo@sheffieldprecision.com  -> /sheffield-precision
 *   Password: Sheffield2026$
 *
 *   node scripts/provision-northstar-sheffield-portal.mjs
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

const SLUG = "demo";
const PASSWORD = "Sheffield2026$";
const PORTAL_PATH = "sheffield-precision";
const PORTAL_USER = {
  path: PORTAL_PATH,
  clientId: "nst-cli-sheffield",
  name: "Sheffield Precision Engineering",
  username: "demo@sheffieldprecision.com",
};

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws) {
    console.error("Demo workspace not found", wsErr?.message);
    process.exit(1);
  }
  if (ws.slug !== "demo") throw new Error("demo workspace slug mismatch — refusing");

  console.log("Workspace", ws.id, ws.slug);

  const row = PORTAL_USER;
  let { data: client, error: clientErr } = await admin
    .from("internal_clients")
    .select("id, company_name, account_status")
    .eq("id", row.clientId)
    .eq("workspace_id", ws.id)
    .maybeSingle();

  if (clientErr) {
    console.error("client lookup failed", row.clientId, clientErr.message);
    process.exit(1);
  }

  if (!client) {
    const insertRow = {
      id: row.clientId,
      workspace_id: ws.id,
      company_name: row.name,
      industry: "Precision Engineering",
      primary_contact: "Tom Bradley",
      email: row.username,
      phone: "+44 114 555 0192",
      region: "United Kingdom",
      company_country: "United Kingdom",
      company_city: "Sheffield",
      company_address: "Atlas Works, Sheffield S9 1AA, UK",
      billing_address: "Atlas Works, Sheffield S9 1AA, UK",
      account_status: "Active",
      contract_type: "Enterprise",
      tax_id: "GB-482910563",
      active_projects: 1,
      notes: "Atlas Monitoring Platform deployment. Sheffield client portal active.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: created, error: createErr } = await admin
      .from("internal_clients")
      .insert(insertRow)
      .select("id, company_name, account_status")
      .single();
    if (createErr || !created) {
      console.error("client create failed", row.clientId, createErr?.message);
      process.exit(1);
    }
    client = created;
    console.log("created client", client.id);
  }

  const portalUrl = `https://demo.unit311central.com/${row.path}`;
  {
    const { error: clientUpdateErr } = await admin
      .from("internal_clients")
      .update({
        platform_url: portalUrl,
        email: row.username,
        account_status: "Active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id)
      .eq("workspace_id", ws.id);
    if (clientUpdateErr) {
      console.error("client platform_url update failed", row.clientId, clientUpdateErr.message);
    } else {
      console.log("client URL", row.clientId, "->", portalUrl);
    }
  }

  const username = normalizeUsername(row.username);
  const payload = {
    username,
    display_name: "Tom Bradley — Sheffield Portal",
    user_type: "external",
    workspace_id: ws.id,
    client_id: client.id,
    client_name: row.name,
    email: username,
    redirect_path: `/${row.path}`,
    password_hash: hashPlatformPasswordForUser(username, PASSWORD),
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("platform_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin.from("platform_users").update(payload).eq("id", existing.id);
    if (error) {
      console.error("update failed", username, error.message);
      process.exit(1);
    }
  } else {
    const { error } = await admin.from("platform_users").insert({
      ...payload,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error("insert failed", username, error.message);
      process.exit(1);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspaceId: ws.id,
        username,
        password: PASSWORD,
        redirectPath: `/${row.path}`,
        portalUrl,
        clientId: client.id,
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
