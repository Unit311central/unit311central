/**
 * Seed Talanton portfolio company portal external users (route-based portals).
 * No new workspaces / tenants / subdomains.
 *
 *   node scripts/provision-talanton-company-portals.mjs
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

const SLUG = "talantonimpact";
const PASSWORD = "Africa1999$";

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Matches src/lib/talanton/company-portal-routes.ts */
const PORTAL_USERS = [
  { path: "ethicalapparelafrica", clientId: "ti-cli-ethical-apparel-africa", name: "Ethical Apparel Africa", username: "demo@ethicalapparelafrica.com" },
  { path: "arcrideglobal", clientId: "ti-cli-arc-ride", name: "ARC Ride", username: "demo@arcrideglobal.com" },
  { path: "burnstoves", clientId: "ti-cli-burn-manufacturing", name: "Burn Manufacturing", username: "demo@burnmfg.com" },
  { path: "kentegrabiotech", clientId: "ti-cli-kentegra-biotechnology", name: "Kentegra Biotechnology", username: "demo@kentegrabiotech.com" },
  { path: "longmilescoffee", clientId: "ti-cli-long-miles-coffee", name: "Long Miles Coffee", username: "demo@longmilescoffee.com" },
  { path: "pharmakina", clientId: "ti-cli-pharmakina", name: "Pharmakina", username: "demo@pharmakina.com" },
  { path: "moko", clientId: "ti-cli-moko-home-living", name: "Moko Home + Living", username: "demo@moko.co.ke" },
  { path: "pwr", clientId: "ti-cli-power-resources-international", name: "Power Resources International", username: "demo@pwr.ltd" },
  { path: "autosprings", clientId: "ti-cli-auto-springs-east-africa-plc", name: "Auto Springs East Africa PLC", username: "demo@autosprings.net" },
  { path: "biofarms", clientId: "ti-cli-biofarms-limited", name: "BioFarms Limited", username: "demo@biofarms.co.ke" },
  { path: "endasportswear", clientId: "ti-cli-enda-sportswear", name: "Enda Sportswear", username: "demo@endasportswear.com" },
  { path: "kijaniforestry", clientId: "ti-cli-kijani-forestry", name: "Kijani Forestry", username: "demo@kijaniforestry.com" },
  { path: "kivutilapia", clientId: "ti-cli-kivu-tilapia-farm-ltd", name: "Kivu Tilapia Farm Ltd", username: "demo@kivutilapia.com" },
  { path: "masakafarms", clientId: "ti-cli-masaka-farms", name: "Masaka Farms", username: "demo@masakafarms.com" },
  { path: "owppharma", clientId: "ti-cli-owp-pharmaceuticals", name: "OWP Pharmaceuticals", username: "demo@owppharma.com" },
  { path: "pezesha", clientId: "ti-cli-pezesha", name: "Pezesha", username: "demo@pezesha.com" },
  { path: "poa", clientId: "ti-cli-poa-internet", name: "poa! Internet", username: "demo@poa.co.ke" },
  { path: "rabboni", clientId: "ti-cli-rabboni-group", name: "Rabboni Group", username: "demo@rabboni.co.ug" },
  { path: "tarajischools", clientId: "ti-cli-taraji-afrika", name: "Taraji Afrika", username: "demo@tarajischools.com" },
];

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws) {
    console.error("Talanton workspace not found", wsErr?.message);
    process.exit(1);
  }

  console.log("Workspace", ws.id, ws.slug);

  const { error: partnersErr } = await admin.from("partners").delete().eq("workspace_id", ws.id);
  if (partnersErr) console.warn("partners clear:", partnersErr.message);
  else console.log("Cleared partners for Talanton");

  let upserted = 0;
  for (const row of PORTAL_USERS) {
    const { data: client, error: clientErr } = await admin
      .from("internal_clients")
      .select("id, company_name")
      .eq("id", row.clientId)
      .eq("workspace_id", ws.id)
      .maybeSingle();

    if (clientErr || !client) {
      console.error("Missing client", row.clientId, clientErr?.message);
      continue;
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
    console.log("OK", username, "->", `/${row.path}`, client.id);
  }

  const { count } = await admin
    .from("platform_users")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ws.id)
    .eq("user_type", "external");

  console.log(JSON.stringify({ upserted, externalUsers: count }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
