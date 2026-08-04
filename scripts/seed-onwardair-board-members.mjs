/**
 * Seed OnwardAir Board Members (Luminary Advisors from onwardair.tech/#team).
 * Soft-deletes any existing active board_directors for the workspace, then inserts 6 advisors.
 *
 *   node scripts/seed-onwardair-board-members.mjs
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

const SLUG = "onwardair";
const WS_ID = "3b479f90-d063-421b-ae93-542a508129f5";

const MEMBERS = [
  {
    full_name: "Dylan Taylor",
    role_title: "Advisor",
    organisation: "Voyager Technologies",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sort_order: 10,
  },
  {
    full_name: "Cameron Burr",
    role_title: "Advisor",
    organisation: "Jet Capital",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sort_order: 20,
  },
  {
    full_name: "Rick Perez",
    role_title: "Advisor",
    organisation: "1588 Ventures",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sort_order: 30,
  },
  {
    full_name: "Chris Tucker",
    role_title: "Advisor",
    organisation: "Yale House Ventures",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sort_order: 40,
  },
  {
    full_name: "Gabe Mena, MD",
    role_title: "Advisor",
    organisation: "MD Anderson",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sort_order: 50,
  },
  {
    full_name: "GEN Duncan McNabb",
    role_title: "Advisor",
    organisation: "USAF (Ret.)",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sort_order: 60,
  },
];

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr) throw new Error(wsErr.message);
  const workspaceId = ws?.id || WS_ID;
  console.log(`Workspace ${SLUG}: ${workspaceId}`);

  const now = new Date().toISOString();
  const { error: softErr } = await admin
    .from("board_directors")
    .update({ is_active: false, updated_at: now })
    .eq("workspace_id", workspaceId)
    .eq("is_active", true);
  if (softErr) throw new Error(`soft-delete: ${softErr.message}`);

  const rows = MEMBERS.map((m) => ({
    workspace_id: workspaceId,
    full_name: m.full_name,
    role_title: m.role_title,
    organisation: m.organisation,
    email: null,
    phone: null,
    notes: m.notes,
    sort_order: m.sort_order,
    is_active: true,
    updated_at: now,
  }));

  const { data, error } = await admin.from("board_directors").insert(rows).select("full_name, role_title, organisation");
  if (error) throw new Error(`insert: ${error.message}`);

  console.log(`Seeded ${data?.length ?? 0} board members:`);
  for (const row of data ?? []) {
    console.log(`  - ${row.full_name} · ${row.role_title} · ${row.organisation}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
