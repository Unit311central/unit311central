/**
 * CorpCentre-only: fix internal users, AU projects, messaging channels.
 * Does NOT touch Internal or Demo.
 *
 * Usage: node scripts/seed-corpcentre-ops-pass2.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : process.env[k] || "";
}

const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const WID = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const SLUG = "corpcentre";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function main() {
  const { data: ws } = await admin.from("workspaces").select("id, slug").eq("slug", SLUG).maybeSingle();
  if (!ws || ws.id !== WID) throw new Error("corpcentre workspace mismatch");

  // 1) Mark CorpCentre staff as internal platform users (Users + module auth).
  const { data: staff, error: staffErr } = await admin
    .from("platform_users")
    .select("id, email, display_name, username")
    .eq("workspace_id", WID)
    .ilike("email", "%corpcentre@unit311central.com");
  if (staffErr) throw new Error(staffErr.message);

  const { error: typeErr } = await admin
    .from("platform_users")
    .update({ user_type: "internal", updated_at: new Date().toISOString() })
    .eq("workspace_id", WID)
    .ilike("email", "%corpcentre@unit311central.com");
  if (typeErr) throw new Error(`user_type: ${typeErr.message}`);

  // 2) Replace projects with AU client-linked projects.
  const { data: clients } = await admin
    .from("internal_clients")
    .select("id, company_name, region, account_status")
    .eq("workspace_id", WID)
    .order("company_name");
  if (!clients?.length) throw new Error("No corpcentre clients");

  await admin.from("internal_projects").delete().eq("workspace_id", WID);

  const projectRows = [];
  const phases = ["live", "live", "live", "planning", "delivery", "live"];
  clients.forEach((client, index) => {
    if (client.account_status === "Dormant" || client.account_status === "Archived") return;
    const count = index % 3 === 0 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const phase = phases[(index + i) % phases.length];
      projectRows.push({
        id: randomUUID(),
        workspace_id: WID,
        name: `${client.company_name.split(" ")[0]} ${i === 0 ? "Managed IT" : "Network Refresh"}`,
        client_id: client.id,
        client_name: client.company_name,
        site: client.region,
        region: client.region,
        operator: index % 2 === 0 ? "Daniel Sazdanoff" : "John Amoroso",
        phase,
        start_date: new Date(Date.now() - (90 + index * 7) * 86400000).toISOString().slice(0, 10),
        end_date: new Date(Date.now() + (60 + index * 5) * 86400000).toISOString().slice(0, 10),
        progress_pct: phase === "live" ? 35 + ((index * 11) % 55) : 10 + ((index * 7) % 30),
        notes: "CorpCentre AU delivery engagement",
      });
    }
  });

  const { error: projErr } = await admin.from("internal_projects").insert(projectRows);
  if (projErr) throw new Error(`projects: ${projErr.message}`);

  // Align client active_projects counts.
  for (const client of clients) {
    const count = projectRows.filter(
      (p) => p.client_id === client.id && (p.phase === "live" || p.phase === "delivery"),
    ).length;
    await admin
      .from("internal_clients")
      .update({ active_projects: count, updated_at: new Date().toISOString() })
      .eq("id", client.id)
      .eq("workspace_id", WID);
  }

  // 3) Messaging: wipe channels/messages for corpcentre, create internal + client channels.
  const memberIds = (staff ?? []).map((u) => u.id);
  const peter =
    (staff ?? []).find((u) => /peter-corpcentre/i.test(u.email || "")) || (staff ?? [])[0];
  if (!peter) throw new Error("No corpcentre staff for messaging seed");

  const { data: existingChannels } = await admin
    .from("internal_message_channels")
    .select("id, room")
    .eq("workspace_id", WID);

  for (const channel of existingChannels || []) {
    await admin.from("internal_messages").delete().eq("workspace_id", WID).eq("room", channel.room);
  }
  await admin.from("internal_message_channels").delete().eq("workspace_id", WID);

  const internalRoom = `corpcentre-internal-${randomUUID().slice(0, 8)}`;
  const clientRoom = `harbourline-client-${randomUUID().slice(0, 8)}`;
  const harbourline = clients.find((c) => /Harbourline/i.test(c.company_name)) || clients[0];

  const channels = [
    {
      workspace_id: WID,
      room: internalRoom,
      name: "CorpCentre Internal",
      channel_type: "internal",
      client_key: null,
      created_by_operator_id: peter.id,
      created_by_operator_name: peter.display_name || "Peter",
      member_operator_ids: memberIds,
      member_client_usernames: [],
    },
    {
      workspace_id: WID,
      room: clientRoom,
      name: `${harbourline.company_name} · Client`,
      channel_type: "client",
      client_key: harbourline.id,
      created_by_operator_id: peter.id,
      created_by_operator_name: peter.display_name || "Peter",
      member_operator_ids: memberIds,
      member_client_usernames: [harbourline.id],
    },
  ];

  const { error: chErr } = await admin.from("internal_message_channels").insert(channels);
  if (chErr) throw new Error(`channels: ${chErr.message}`);

  const systemMessages = [
    {
      workspace_id: WID,
      room: internalRoom,
      operator_id: "system",
      operator_name: "System",
      username: "system",
      content: "Channel created for internal CorpCentre team collaboration.",
      message_type: "system",
    },
    {
      workspace_id: WID,
      room: clientRoom,
      operator_id: "system",
      operator_name: "System",
      username: "system",
      content: `Channel created for ${harbourline.company_name} client collaboration.`,
      message_type: "system",
    },
  ];
  const { error: msgErr } = await admin.from("internal_messages").insert(systemMessages);
  if (msgErr) {
    // Some schemas use different column names — soft fail with log.
    console.warn("system messages insert:", msgErr.message);
  }

  const { count: projectCount } = await admin
    .from("internal_projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID);
  const { count: liveCount } = await admin
    .from("internal_projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID)
    .eq("phase", "live");
  const { count: activeClients } = await admin
    .from("internal_clients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID)
    .eq("account_status", "Active");
  const { count: channelCount } = await admin
    .from("internal_message_channels")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID);

  // Safety
  for (const slug of ["unit311", "demo"]) {
    const { data: other } = await admin.from("workspaces").select("id").eq("slug", slug).maybeSingle();
    if (!other) continue;
    const { count } = await admin
      .from("internal_clients")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", other.id);
    console.log(`safety ${slug} clients:`, count);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        staffInternal: staff?.length ?? 0,
        projects: projectCount,
        liveProjects: liveCount,
        activeClients,
        channels: channelCount,
        internalRoom,
        clientRoom,
        clientChannel: harbourline.company_name,
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
