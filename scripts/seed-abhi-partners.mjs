/**
 * ABHI-only: wipe partners and seed 2 membership acquisition agents.
 *
 *   node scripts/seed-abhi-partners.mjs
 */
import { randomBytes } from "node:crypto";
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
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const AGENTS = [
  {
    first_name: "Helen",
    last_name: "Cartwright",
    company_name: "Cartwright Membership Partners",
    email: "helen.cartwright@cmpartners.co.uk",
    phone_country_code: "+44",
    phone_number: "20 7946 3101",
    city: "London",
    country: "United Kingdom",
    postcode: "EC2A 4BX",
    address_line1: "14 Worship Street",
    notes:
      "Membership acquisition agent — onboard new HealthTech companies into ABHI membership across England & Wales.",
  },
  {
    first_name: "James",
    last_name: "Okafor",
    company_name: "Northbridge Introducers Ltd",
    email: "james.okafor@northbridgeintroducers.co.uk",
    phone_country_code: "+44",
    phone_number: "161 555 0188",
    city: "Manchester",
    country: "United Kingdom",
    postcode: "M1 2HX",
    address_line1: "22 Ducie Street",
    notes:
      "Membership acquisition agent — source and introduce prospective ABHI members across the North & Scotland.",
  },
];

async function main() {
  const { data: ws, error } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", "abhi")
    .maybeSingle();
  if (error || !ws?.id) throw new Error(`ABHI missing: ${error?.message || "not found"}`);
  if (FORBIDDEN.has(ws.slug)) throw new Error(`Refusing ${ws.slug}`);

  const { data: existing } = await admin
    .from("partners")
    .select("id")
    .eq("workspace_id", ws.id);
  if (existing?.length) {
    const ids = existing.map((r) => r.id);
    await admin.from("partner_invoices").delete().in("partner_id", ids);
    await admin.from("partner_jobs").delete().in("partner_id", ids);
    await admin.from("partner_commission_rates").delete().in("partner_id", ids);
    await admin.from("partners").delete().eq("workspace_id", ws.id);
  }

  // Also remove any leftover ABHI agent emails if they landed without workspace_id.
  for (const agent of AGENTS) {
    await admin.from("partners").delete().eq("email", agent.email);
  }

  const rows = AGENTS.map((agent) => {
    const portalToken = randomBytes(24).toString("base64url");
    return {
      ...agent,
      workspace_id: ws.id,
      email: agent.email.toLowerCase(),
      email_verified_at: new Date().toISOString(),
      status: "active",
      intake_step: "complete",
      portal_token: portalToken,
      portal_url: `https://abhi.unit311central.com/partners/portal/${portalToken}`,
      updated_at: new Date().toISOString(),
    };
  });

  const { error: insErr } = await admin.from("partners").insert(rows);
  if (insErr) throw new Error(insErr.message);

  const { count } = await admin
    .from("partners")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ws.id);

  // Isolation: no ABHI agent emails on other workspaces
  for (const slug of ["demo", "corpcentre", "talantonimpact"]) {
    const { data: other } = await admin.from("workspaces").select("id").eq("slug", slug).maybeSingle();
    if (!other?.id) continue;
    const { count: leak } = await admin
      .from("partners")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", other.id)
      .in(
        "email",
        AGENTS.map((a) => a.email),
      );
    if (leak) throw new Error(`Partner leak into ${slug}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: ws.slug,
        partners: count,
        agents: AGENTS.map((a) => `${a.first_name} ${a.last_name} · ${a.company_name}`),
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
