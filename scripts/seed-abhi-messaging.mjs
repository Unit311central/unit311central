/**
 * ABHI-only: messaging operators + channels for demo@abhi.org.uk / staff.
 *
 * Internal: Board, ABHI Mgmt, Staff
 * External (member): Centrak, GAMA Healthcare Ltd
 *
 *   node scripts/seed-abhi-messaging.mjs
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

const SLUG = "abhi";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
  "onwardair",
]);

const OPERATORS = [
  {
    id: "abhi-op-peter",
    operator_label: "Peter",
    full_name: "Peter Ellingworth",
    username: "peter.ellingworth@abhi.org.uk",
    email: "peter.ellingworth@abhi.org.uk",
    role: "Executive",
    roles: ["Executive"],
    department: "Leadership",
    departments: ["Leadership"],
    status: "Active",
    region: "London",
  },
  {
    id: "abhi-op-jane",
    operator_label: "Jane",
    full_name: "Jane Lewis",
    username: "jane.lewis@abhi.org.uk",
    email: "jane.lewis@abhi.org.uk",
    role: "Executive",
    roles: ["Executive"],
    department: "Leadership",
    departments: ["Leadership"],
    status: "Active",
    region: "London",
  },
  {
    id: "abhi-op-judith",
    operator_label: "Judith",
    full_name: "Judith Mellis",
    username: "judith.mellis@abhi.org.uk",
    email: "judith.mellis@abhi.org.uk",
    role: "Manager",
    roles: ["Manager"],
    department: "UK Market Affairs",
    departments: ["UK Market Affairs"],
    status: "Active",
    region: "London",
  },
  {
    id: "abhi-op-jonathan",
    operator_label: "Jonathan",
    full_name: "Jonathan Evans",
    username: "jonathan.evans@abhi.org.uk",
    email: "jonathan.evans@abhi.org.uk",
    role: "Manager",
    roles: ["Manager"],
    department: "Communications",
    departments: ["Communications"],
    status: "Active",
    region: "London",
  },
  {
    id: "abhi-op-charlotte",
    operator_label: "Charlotte",
    full_name: "Charlotte Hart",
    username: "charlotte.hart@abhi.org.uk",
    email: "charlotte.hart@abhi.org.uk",
    role: "Associate",
    roles: ["Associate"],
    department: "Communications",
    departments: ["Communications"],
    status: "Active",
    region: "London",
  },
  {
    id: "abhi-op-michelle",
    operator_label: "Michelle",
    full_name: "Michelle Michelucci",
    username: "michelle.michelucci@abhi.org.uk",
    email: "michelle.michelucci@abhi.org.uk",
    role: "Manager",
    roles: ["Manager"],
    department: "International Events",
    departments: ["International Events"],
    status: "Active",
    region: "London",
  },
  {
    id: "abhi-op-phil",
    operator_label: "Phil",
    full_name: "Phil Brown",
    username: "phil.brown@abhi.org.uk",
    email: "phil.brown@abhi.org.uk",
    role: "Manager",
    roles: ["Manager"],
    department: "Regulatory",
    departments: ["Regulatory"],
    status: "Active",
    region: "London",
  },
  {
    id: "abhi-op-owain",
    operator_label: "Owain",
    full_name: "Owain Prescott",
    username: "owain.prescott@abhi.org.uk",
    email: "owain.prescott@abhi.org.uk",
    role: "Associate",
    roles: ["Associate"],
    department: "Market Access",
    departments: ["Market Access"],
    status: "Active",
    region: "London",
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

  for (const op of OPERATORS) {
    const { error } = await admin.from("internal_operators").upsert(
      {
        ...op,
        notes: "ABHI London seed operator",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(`operator ${op.id}: ${error.message}`);
  }

  const byLabel = Object.fromEntries(OPERATORS.map((op) => [op.operator_label, op.id]));
  const peterId = byLabel.Peter;

  const channels = [
    {
      name: "Board",
      channel_type: "internal",
      client_key: null,
      members: ["Peter", "Jane", "Judith", "Phil"].map((l) => byLabel[l]),
      description: "Board coordination, pack circulation, and governance decisions.",
    },
    {
      name: "ABHI Mgmt",
      channel_type: "internal",
      client_key: null,
      members: ["Peter", "Jane", "Jonathan", "Michelle", "Judith"].map((l) => byLabel[l]),
      description: "Executive and director leadership coordination.",
    },
    {
      name: "Staff",
      channel_type: "internal",
      client_key: null,
      members: ["Peter", "Jane", "Jonathan", "Charlotte", "Owain", "Michelle"].map((l) => byLabel[l]),
      description: "All-staff announcements and operational handoffs.",
    },
    {
      name: "Centrak — WHX pavilion",
      channel_type: "client",
      client_key: "abhi-cli-centrak",
      members: ["Peter", "Jonathan", "Charlotte"].map((l) => byLabel[l]),
      description: "External member channel — Centrak WHX Dubai exhibitor coordination.",
    },
    {
      name: "GAMA Healthcare — member liaison",
      channel_type: "client",
      client_key: "abhi-cli-gama-healthcare-ltd",
      members: ["Peter", "Jonathan", "Michelle"].map((l) => byLabel[l]),
      description: "External member channel — GAMA Healthcare member services.",
    },
  ];

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
        created_by_operator_id: peterId,
        created_by_operator_name: "Peter Ellingworth",
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
          ? `Channel created for ${spec.client_key} member collaboration. ${spec.description}`
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
        joinHint: "Join Messaging as Peter (peter.ellingworth@abhi.org.uk)",
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
