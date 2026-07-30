/**
 * CorpCentre-only: seed a few open/closed support tickets for Clients Dashboard metrics.
 * Usage: node scripts/seed-corpcentre-support-tickets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : process.env[k] || "";
}

const WID = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TICKETS = [
  {
    id: "CC-SUP-001",
    name: "Rebecca Tan",
    organisation: "Northside Managed IT Pty Ltd",
    priority: "high",
    description: "WAN outage on primary Sydney link — failover active, need RCA.",
    user_assigned: "John Amoroso",
    archived: false,
    closed: false,
  },
  {
    id: "CC-SUP-002",
    name: "James O'Connor",
    organisation: "Harbourline Logistics",
    priority: "medium",
    description: "New site onboarding checklist — firewall rules pending approval.",
    user_assigned: "Elias Bahbah",
    archived: false,
    closed: false,
  },
  {
    id: "CC-SUP-003",
    name: "Priya Nair",
    organisation: "Alexandria Data Centres",
    priority: "urgent",
    description: "Certificate renewal for client portal SSO expires in 5 days.",
    user_assigned: "Mick Lenton",
    archived: false,
    closed: false,
  },
  {
    id: "CC-SUP-004",
    name: "Tom Bradley",
    organisation: "Adelaide Civic Works",
    priority: "low",
    description: "Request for monthly usage report export in AUD billing format.",
    user_assigned: "Daniel Sazdanoff",
    archived: false,
    closed: true,
  },
  {
    id: "CC-SUP-005",
    name: "Sarah Nguyen",
    organisation: "Brisbane Port Logistics Co",
    priority: "medium",
    description: "Laptop fleet imaging delay for 12 technician devices.",
    user_assigned: "John Amoroso",
    archived: false,
    closed: false,
  },
];

async function main() {
  const { data: ws } = await admin.from("workspaces").select("id, slug").eq("id", WID).maybeSingle();
  if (!ws || ws.slug !== "corpcentre") throw new Error("corpcentre workspace mismatch");

  for (const ticket of TICKETS) {
    await admin.from("support_tickets").delete().eq("id", ticket.id).eq("workspace_id", WID);
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

  console.log(JSON.stringify({ ok: true, tickets: count, open }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
