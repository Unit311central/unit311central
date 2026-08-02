/**
 * Seed ABHI member-company portal external users (route-based portals).
 * No new workspaces / tenants / subdomains — mirrors
 * scripts/provision-talanton-company-portals.mjs, scoped to ABHI only.
 *
 * Portal home: https://abhi.unit311central.com/{path}
 *   demo@centrak.com          -> /centrak          (Centrak)
 *   demo@gamahealthcare.com   -> /gamahealthcare    (GAMA Healthcare Ltd)
 *   demo@zeumed.com           -> /zeumed            (Zeumed)
 *   demo@ddcdolphin.com       -> /ddcdolphin         (DDC Dolphin Ltd)
 *   demo@wavetec.com          -> /wavetec           (Wavetec)
 *
 *   node scripts/provision-abhi-centrak-portal.mjs
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

const SLUG = "abhi";
const PASSWORD = "London1999$";
const FORBIDDEN_TARGET_SLUGS = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function hashPlatformPasswordForUser(username, password) {
  const salt = `${normalizeUsername(username)}-salt-v1`;
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Matches src/lib/abhi/member-portal-routes.ts */
const PORTAL_USERS = [
  { path: "centrak", clientId: "abhi-cli-centrak", name: "Centrak", username: "demo@centrak.com" },
  {
    path: "gamahealthcare",
    clientId: "abhi-cli-gama-healthcare-ltd",
    name: "GAMA Healthcare Ltd",
    username: "demo@gamahealthcare.com",
  },
  { path: "zeumed", clientId: "abhi-cli-zeumed", name: "Zeumed", username: "demo@zeumed.com" },
  {
    path: "ddcdolphin",
    clientId: "abhi-cli-ddc-dolphin-ltd",
    name: "DDC Dolphin Ltd",
    username: "demo@ddcdolphin.com",
  },
  { path: "wavetec", clientId: "abhi-cli-wavetec", name: "Wavetec", username: "demo@wavetec.com" },
];

async function main() {
  if (FORBIDDEN_TARGET_SLUGS.has(SLUG)) throw new Error(`Refusing forbidden slug: ${SLUG}`);

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws) {
    console.error("ABHI workspace not found", wsErr?.message);
    process.exit(1);
  }
  if (ws.slug !== "abhi") throw new Error("abhi workspace slug mismatch — refusing");

  console.log("Workspace", ws.id, ws.slug);

  let upserted = 0;
  const results = [];
  for (const row of PORTAL_USERS) {
    const { data: client, error: clientErr } = await admin
      .from("internal_clients")
      .select("id, company_name, account_status")
      .eq("id", row.clientId)
      .eq("workspace_id", ws.id)
      .maybeSingle();

    if (clientErr || !client) {
      console.error("Missing client", row.clientId, clientErr?.message);
      continue;
    }

    // Portal demo accounts must never hit the /payment subscription gate —
    // keep the member row's account_status Active (subscription_status stays null).
    // Also store the public member-portal URL on the client record.
    const portalUrl = `https://abhi.unit311central.com/${row.path}`;
    const clientPatch = {
      platform_url: portalUrl,
      updated_at: new Date().toISOString(),
    };
    if (String(client.account_status ?? "").toLowerCase() !== "active") {
      clientPatch.account_status = "Active";
    }
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
    results.push({ username, path: `/${row.path}`, clientId: client.id, company: client.company_name });
    console.log("OK", username, "->", `/${row.path}`, client.id);
  }

  const { count } = await admin
    .from("platform_users")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ws.id)
    .eq("user_type", "external");

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspaceId: ws.id,
        upserted,
        externalUsers: count,
        password: PASSWORD,
        portalOrigin: "https://abhi.unit311central.com",
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
