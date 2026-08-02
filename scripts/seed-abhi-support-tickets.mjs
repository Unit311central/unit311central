/**
 * ABHI-only: seed a small set of fake support tickets (2 active + 3 closed) for the
 * Support Desk / Clients Dashboard metrics. Mirrors scripts/seed-corpcentre-support-tickets.mjs.
 *
 * Hard-refuses any workspace other than the ABHI ("abhi") tenant.
 *
 * Usage: node scripts/seed-abhi-support-tickets.mjs
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
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : process.env[k] || "";
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
const FORBIDDEN_TARGET_SLUGS = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

const TICKETS = [
  {
    id: "ABHI-SUP-001",
    name: "Fiona Kiernan",
    organisation: "Zeumed",
    priority: "high",
    description:
      "Member portal SSO login failing intermittently for returning members — SAML assertion timeout on abhi.org.uk portal.",
    user_assigned: "Angela Jeffrey",
    archived: false,
    closed: false,
  },
  {
    id: "ABHI-SUP-002",
    name: "Demo User",
    organisation: "Centrak",
    priority: "urgent",
    description:
      "WHX Dubai 2027 UK Pavilion stand — contractor site access passes and electrics sign-off needed before build week.",
    user_assigned: "Michelle Michelucci",
    archived: false,
    closed: false,
  },
  {
    id: "ABHI-SUP-003",
    name: "Laura Friedl-Hirst",
    organisation: "LFH Regulatory Ltd",
    priority: "medium",
    description:
      "CRM discovery call sync — Working Group calendar invite links returning 404 after the HubSpot sync job.",
    user_assigned: "Jonathan Evans",
    archived: false,
    closed: true,
  },
  {
    id: "ABHI-SUP-004",
    name: "Membership Desk",
    organisation: "B. Braun Medical",
    priority: "low",
    description:
      "Mailing list unsubscribe requests not processing — members still receiving Working Group digest emails.",
    user_assigned: "Charlotte Hart",
    archived: false,
    closed: true,
  },
  {
    id: "ABHI-SUP-005",
    name: "Info Desk",
    organisation: "GAMA Healthcare Ltd",
    priority: "medium",
    description:
      "Events microsite registration form validation error blocking overseas delegate sign-ups.",
    user_assigned: "Charlotte Hart",
    archived: false,
    closed: true,
  },
];

async function main() {
  if (FORBIDDEN_TARGET_SLUGS.has(SLUG)) {
    throw new Error(`Refusing forbidden slug: ${SLUG}`);
  }

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws) throw new Error(`ABHI workspace not found: ${wsErr?.message ?? "no row"}`);
  if (ws.slug !== "abhi") throw new Error("abhi workspace slug mismatch — refusing");
  if (FORBIDDEN_TARGET_SLUGS.has(ws.slug)) throw new Error(`Refusing protected workspace: ${ws.slug}`);
  const WID = ws.id;

  console.log("Deleting previous ABHI-tagged support tickets…");
  const { error: deleteError } = await admin.from("support_tickets").delete().eq("workspace_id", WID);
  if (deleteError) throw new Error(`delete existing tickets: ${deleteError.message}`);

  for (const ticket of TICKETS) {
    const row = {
      ...ticket,
      workspace_id: WID,
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from("support_tickets").insert(row);
    if (error) {
      // Retry without closed if column missing on older schemas.
      if (error.message.includes("closed")) {
        const { closed: _c, ...rest } = row;
        const retry = await admin.from("support_tickets").insert(rest);
        if (retry.error) throw new Error(`${ticket.id}: ${retry.error.message}`);
      } else {
        throw new Error(`${ticket.id}: ${error.message}`);
      }
    }
  }

  const { count } = await admin
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID)
    .eq("archived", false);
  const { count: open } = await admin
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID)
    .eq("archived", false)
    .eq("closed", false);
  const { count: closed } = await admin
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID)
    .eq("archived", false)
    .eq("closed", true);

  console.log(JSON.stringify({ ok: true, workspaceId: WID, tickets: count, open, closed }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
