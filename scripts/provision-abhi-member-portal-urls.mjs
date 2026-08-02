/**
 * Rewrite all ABHI member platform_url values to
 * https://abhi.unit311central.com/{slug}
 *
 * Curated portal paths (centrak, abbotdiagnostics, …) win when client id matches.
 * Otherwise slug is derived from company name (Ltd etc stripped).
 *
 *   node scripts/provision-abhi-member-portal-urls.mjs
 */
import fs from "node:fs";
import path from "node:path";
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

const ORIGIN = "https://abhi.unit311central.com";

/** Keep in sync with src/lib/abhi/member-portal-routes.ts (member portals only). */
const CURATED = new Map([
  ["abhi-cli-centrak", "centrak"],
  ["abhi-cli-abbott-diagnostics-ltd", "abbotdiagnostics"],
  ["abhi-cli-gama-healthcare-ltd", "gamahealthcare"],
  ["abhi-cli-zeumed", "zeumed"],
  ["abhi-cli-ddc-dolphin-ltd", "ddcdolphin"],
  ["abhi-cli-wavetec", "wavetec"],
]);

function abhiMemberPortalSlug(companyName) {
  const slug = String(companyName ?? "")
    .toLowerCase()
    .replace(/\b(ltd|limited|llc|inc|plc|gmbh|pty|srl|sa|nv|bv)\b\.?/gi, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);
  return slug || "member";
}

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", "abhi")
    .maybeSingle();
  if (wsErr || !ws) {
    console.error("ABHI workspace not found", wsErr?.message);
    process.exit(1);
  }

  const { data: clients, error } = await admin
    .from("internal_clients")
    .select("id, company_name, platform_url")
    .eq("workspace_id", ws.id);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const used = new Set();
  let updated = 0;
  let unchanged = 0;
  const collisions = [];

  for (const client of clients ?? []) {
    let pathSlug = CURATED.get(client.id) || abhiMemberPortalSlug(client.company_name);
    if (used.has(pathSlug)) {
      const suffix = String(client.id)
        .replace(/^abhi-cli-/, "")
        .replace(/[^a-z0-9]+/g, "")
        .slice(-6);
      const next = `${pathSlug}${suffix}`.slice(0, 48);
      collisions.push({ id: client.id, company: client.company_name, from: pathSlug, to: next });
      pathSlug = next;
    }
    used.add(pathSlug);

    const portalUrl = `${ORIGIN}/${pathSlug}`;
    if (String(client.platform_url ?? "").trim() === portalUrl) {
      unchanged += 1;
      continue;
    }

    const { error: updateErr } = await admin
      .from("internal_clients")
      .update({ platform_url: portalUrl, updated_at: new Date().toISOString() })
      .eq("id", client.id)
      .eq("workspace_id", ws.id);

    if (updateErr) {
      console.error("failed", client.id, updateErr.message);
      continue;
    }
    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        total: clients?.length ?? 0,
        updated,
        unchanged,
        collisions: collisions.length,
        collisionSamples: collisions.slice(0, 10),
        abbott: `${ORIGIN}/abbotdiagnostics`,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
