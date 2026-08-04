/**
 * OnwardAir-only: seed support desk tickets (10 desk + 3 assigned to Admin for My Tickets).
 *
 *   node scripts/seed-onwardair-support-tickets.mjs
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

const SLUG = "onwardair";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
  "abhi",
]);

/** 10 desk tickets + ensure 3 assigned to "Admin" for My Tickets. */
const TICKETS = [
  {
    id: "OA-SUP-001",
    name: "Jordan Lee",
    organisation: "OnwardAir HQ",
    priority: "medium",
    description: "M365 licence seat request for new Houston engineering hire.",
    user_assigned: "Justin Dodrill",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-002",
    name: "Elena Vasquez",
    organisation: "Propulsion",
    priority: "high",
    description: "Battery cage access badge not provisioning after HR onboarding.",
    user_assigned: "Dan Wax",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-003",
    name: "Keven Coates",
    organisation: "Houston Lab",
    priority: "urgent",
    description: "Lab NAS backup RPO miss — flight-test telemetry store near capacity.",
    user_assigned: "Admin",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-004",
    name: "Marcus Hale",
    organisation: "Structures",
    priority: "medium",
    description: "SolidWorks licence offline activation failing on Z4 workstation.",
    user_assigned: "Justin Dodrill",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-005",
    name: "Priya Desai",
    organisation: "Avionics",
    priority: "low",
    description: "Request dual-monitor stand for GNC simulation desk.",
    user_assigned: "Dan Wax",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-006",
    name: "Tom Rivera",
    organisation: "Ellington Precision Machine",
    priority: "medium",
    description: "Supplier portal login — cannot upload CNC first-article package.",
    user_assigned: "Brian Whiteside",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-007",
    name: "Anuj Kumar",
    organisation: "Engineering (remote)",
    priority: "high",
    description: "VPN drops every ~20 minutes for remote GNC engineer.",
    user_assigned: "Admin",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-008",
    name: "Carolyn Scott",
    organisation: "Marketing",
    priority: "low",
    description: "Shared drive permissions for Board Packs folder — investor annex.",
    user_assigned: "Monte Mann",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-009",
    name: "DFW Partner Ops",
    organisation: "DFW Airport Vertiport",
    priority: "medium",
    description: "External messaging channel invite bounced for partner contact.",
    user_assigned: "Admin",
    archived: false,
    closed: false,
  },
  {
    id: "OA-SUP-010",
    name: "Mike Teeter",
    organisation: "Mechanical",
    priority: "medium",
    description: "3D printer filament inventory alert — Markforged X7 offline filament sensor.",
    user_assigned: "Keven Coates",
    archived: false,
    closed: true,
  },
];

async function main() {
  const { data: workspace, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr) throw new Error(wsErr.message);
  if (!workspace?.id) throw new Error(`Workspace not found: ${SLUG}`);
  if (FORBIDDEN.has(String(workspace.slug).toLowerCase())) {
    throw new Error(`Refusing to seed forbidden workspace: ${workspace.slug}`);
  }

  const WID = workspace.id;

  // Clear prior OA tickets only (OA-SUP-* ids).
  await admin.from("support_tickets").delete().eq("workspace_id", WID).like("id", "OA-SUP-%");

  for (const ticket of TICKETS) {
    const row = {
      ...ticket,
      workspace_id: WID,
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin.from("support_tickets").insert(row);
    if (error) {
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
  const { count: mine } = await admin
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID)
    .eq("user_assigned", "Admin")
    .eq("archived", false)
    .eq("closed", false);

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: SLUG,
        tickets: count,
        myTicketsForAdmin: mine,
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
