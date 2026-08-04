/**
 * Seed OnwardAir client-portal external users (route-based portals).
 *
 * Portal home: https://onwardair.unit311central.com/coastalfreightpartners.com
 *   demo@coastalfreightpartners.com  -> /coastalfreightpartners.com
 *   Password: Coastalfreight1$
 *
 *   node scripts/provision-onwardair-client-portals.mjs
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
const PASSWORD = "Coastalfreight1$";
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

/** Matches src/lib/onwardair/client-portal-routes.ts */
const PORTAL_USERS = [
  {
    path: "coastalfreightpartners.com",
    clientId: "oa-cli-coastal-freight",
    name: "Coastal Freight Partners",
    username: "demo@coastalfreightpartners.com",
  },
];

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

  console.log("Workspace", ws.id, ws.slug);

  let upserted = 0;
  const results = [];
  for (const row of PORTAL_USERS) {
    let { data: client, error: clientErr } = await admin
      .from("internal_clients")
      .select("id, company_name, account_status")
      .eq("id", row.clientId)
      .eq("workspace_id", ws.id)
      .maybeSingle();

    if (clientErr) {
      console.error("client lookup failed", row.clientId, clientErr.message);
      continue;
    }

    if (!client) {
      const insertRow = {
        id: row.clientId,
        workspace_id: ws.id,
        company_name: row.name,
        industry: "Logistics & Ports",
        primary_contact: "Elena Vargas",
        email: row.username,
        phone: "+1 713 555 0176",
        region: "United States",
        company_country: "United States",
        company_city: "Houston",
        company_address: "1200 Port of Houston Blvd, Houston, TX 77029, USA",
        billing_address: "1200 Port of Houston Blvd, Houston, TX 77029, USA",
        account_status: "Active",
        contract_type: "Trial",
        tax_id: "US-26-5588120",
        active_projects: 2,
        notes:
          "Gulf Coast middle-mile cargo operator. Vertex VTOL trial. Client portal active.",
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
        continue;
      }
      client = created;
      console.log("created client", client.id);
    }

    const portalUrl = `https://onwardair.unit311central.com/${row.path}`;
    const clientPatch = {
      platform_url: portalUrl,
      email: row.username,
      account_status: "Active",
      updated_at: new Date().toISOString(),
    };
    {
      const { error: clientUpdateErr } = await admin
        .from("internal_clients")
        .update(clientPatch)
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
      display_name: `${row.name} Portal`,
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
        continue;
      }
    } else {
      const { error } = await admin.from("platform_users").insert({
        ...payload,
        created_at: new Date().toISOString(),
      });
      if (error) {
        console.error("insert failed", username, error.message);
        continue;
      }
    }
    upserted += 1;
    results.push({
      username,
      path: `/${row.path}`,
      clientId: client.id,
      company: client.company_name,
    });
    console.log("OK", username, "->", `/${row.path}`, client.id);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspaceId: ws.id,
        upserted,
        password: PASSWORD,
        portalOrigin: "https://onwardair.unit311central.com",
        results,
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
