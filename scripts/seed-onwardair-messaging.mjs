/**
 * OnwardAir-only: messaging operators + channels for admin@onwardair.tech.
 *
 * Internal: Management, Engineering, Support
 * External (client): USTRANSCOM, DFW Vertiport, Etihad Cargo
 *
 *   node scripts/seed-onwardair-messaging.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

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
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
  "abhi",
]);

const OPERATORS = [
  {
    id: "oa-op-admin",
    operator_label: "Admin",
    full_name: "OnwardAir Admin",
    username: "admin@onwardair.tech",
    email: "admin@onwardair.tech",
    role: "Admin",
    roles: ["Admin"],
    department: "Leadership",
    departments: ["Leadership"],
    status: "Active",
    region: "Houston",
  },
  {
    id: "oa-op-scott",
    operator_label: "Scott",
    full_name: "Scott Parazynski, MD",
    username: "scott.parazynski@onwardair.tech",
    email: "scott.parazynski@onwardair.tech",
    role: "Executive",
    roles: ["Executive"],
    department: "Leadership",
    departments: ["Leadership"],
    status: "Active",
    region: "Houston",
  },
  {
    id: "oa-op-brian",
    operator_label: "Brian",
    full_name: "Brian Whiteside",
    username: "brian.whiteside@onwardair.tech",
    email: "brian.whiteside@onwardair.tech",
    role: "Executive",
    roles: ["Executive"],
    department: "Leadership",
    departments: ["Leadership"],
    status: "Active",
    region: "Houston",
  },
  {
    id: "oa-op-monte",
    operator_label: "Monte",
    full_name: "Monte Mann",
    username: "monte.mann@onwardair.tech",
    email: "monte.mann@onwardair.tech",
    role: "Finance",
    roles: ["Finance"],
    department: "Finance",
    departments: ["Finance"],
    status: "Active",
    region: "Houston",
  },
  {
    id: "oa-op-justin",
    operator_label: "Justin",
    full_name: "Justin Dodrill",
    username: "justin.dodrill@onwardair.tech",
    email: "justin.dodrill@onwardair.tech",
    role: "Engineer",
    roles: ["Engineer"],
    department: "Engineering",
    departments: ["Engineering"],
    status: "Active",
    region: "Houston",
  },
  {
    id: "oa-op-mike",
    operator_label: "Mike",
    full_name: "Mike Teeter",
    username: "mike.teeter@onwardair.tech",
    email: "mike.teeter@onwardair.tech",
    role: "Engineer",
    roles: ["Engineer"],
    department: "Engineering",
    departments: ["Engineering"],
    status: "Active",
    region: "Houston",
  },
  {
    id: "oa-op-keven",
    operator_label: "Keven",
    full_name: "Keven Coates",
    username: "keven.coates@onwardair.tech",
    email: "keven.coates@onwardair.tech",
    role: "Engineer",
    roles: ["Engineer"],
    department: "Engineering",
    departments: ["Engineering"],
    status: "Active",
    region: "Houston",
  },
  {
    id: "oa-op-dan",
    operator_label: "Dan",
    full_name: "Dan Wax",
    username: "dan.wax@onwardair.tech",
    email: "dan.wax@onwardair.tech",
    role: "Operations",
    roles: ["Operations"],
    department: "Operations",
    departments: ["Operations"],
    status: "Active",
    region: "Houston",
  },
  {
    id: "oa-op-carolyn",
    operator_label: "Carolyn",
    full_name: "Carolyn Scott",
    username: "carolyn.scott@onwardair.tech",
    email: "carolyn.scott@onwardair.tech",
    role: "Marketing",
    roles: ["Marketing"],
    department: "Marketing",
    departments: ["Marketing"],
    status: "Active",
    region: "Houston",
  },
];

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

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

  // Upsert operators (global table — OA-prefixed ids only).
  for (const op of OPERATORS) {
    const { error } = await admin.from("internal_operators").upsert(
      {
        ...op,
        notes: "OnwardAir Houston seed operator",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(`operator ${op.id}: ${error.message}`);
  }

  const byLabel = Object.fromEntries(OPERATORS.map((op) => [op.operator_label, op.id]));
  const adminId = byLabel.Admin;

  const channels = [
    {
      name: "Management",
      channel_type: "internal",
      client_key: null,
      members: ["Admin", "Scott", "Brian", "Monte", "Carolyn"].map((l) => byLabel[l]),
      description: "Leadership, finance, and board coordination.",
    },
    {
      name: "Engineering",
      channel_type: "internal",
      client_key: null,
      members: ["Admin", "Justin", "Mike", "Keven", "Brian"].map((l) => byLabel[l]),
      description: "FLEX Pod design, avionics, and lab ops.",
    },
    {
      name: "Support",
      channel_type: "internal",
      client_key: null,
      members: ["Admin", "Brian", "Justin", "Dan"].map((l) => byLabel[l]),
      description: "Internal support triage and ticket handoffs.",
    },
    {
      name: "USTRANSCOM Contested Logistics",
      channel_type: "client",
      client_key: "ustranscom",
      members: ["Admin", "Brian", "Dan"].map((l) => byLabel[l]),
      description: "External partner channel — contested logistics cell.",
    },
    {
      name: "DFW Vertiport Ops",
      channel_type: "client",
      client_key: "dfw-vertiport",
      members: ["Admin", "Brian", "Carolyn"].map((l) => byLabel[l]),
      description: "External partner channel — DFW airport vertiport.",
    },
    {
      name: "Etihad Cargo AAM",
      channel_type: "client",
      client_key: "etihad-cargo",
      members: ["Admin", "Scott", "Carolyn"].map((l) => byLabel[l]),
      description: "External partner channel — Etihad Cargo AAM corridor.",
    },
  ];

  // Remove prior OA-seeded channels (keep default internal-ops if present).
  const { data: existing } = await admin
    .from("internal_message_channels")
    .select("id, name, room")
    .eq("workspace_id", workspace.id);

  for (const ch of existing ?? []) {
    if (ch.room === "internal-ops" || ch.room === "support-desk") continue;
    await admin.from("internal_messages").delete().eq("workspace_id", workspace.id).eq("room", ch.room);
    await admin
      .from("internal_message_channels")
      .delete()
      .eq("id", ch.id)
      .eq("workspace_id", workspace.id);
  }

  const created = [];
  for (const spec of channels) {
    const room = `${slugify(spec.name)}-${randomUUID().slice(0, 8)}`;
    const { data, error } = await admin
      .from("internal_message_channels")
      .insert({
        workspace_id: workspace.id,
        room,
        name: spec.name,
        channel_type: spec.channel_type,
        client_key: spec.client_key,
        created_by_operator_id: adminId,
        created_by_operator_name: "OnwardAir Admin",
        member_operator_ids: spec.members,
        member_client_usernames: spec.channel_type === "client" ? [spec.client_key] : [],
      })
      .select("id, name, channel_type")
      .single();
    if (error) throw new Error(`${spec.name}: ${error.message}`);
    created.push(data);

    await admin.from("internal_messages").insert({
      workspace_id: workspace.id,
      room,
      operator_id: "system",
      operator_name: "System",
      username: "system",
      content:
        spec.channel_type === "client"
          ? `Channel created for ${spec.client_key} client collaboration. ${spec.description}`
          : `Channel created for internal team collaboration. ${spec.description}`,
      message_type: "system",
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: SLUG,
        operators: OPERATORS.length,
        channels: created,
        joinHint: "Join Messaging as Admin (admin@onwardair.tech)",
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
