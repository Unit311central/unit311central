/**
 * CorpCentre-only: ensure all platform staff are members of messaging channels
 * (so External contacts / client channels appear for owner@ and the whole team).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}

const WID = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: ws } = await admin.from("workspaces").select("id, slug").eq("id", WID).maybeSingle();
if (!ws || !["corpcentre", "corporatecentre"].includes(String(ws.slug).toLowerCase())) {
  throw new Error("corpcentre workspace mismatch");
}

const { data: users, error: uErr } = await admin
  .from("platform_users")
  .select("id, email")
  .eq("workspace_id", WID)
  .eq("is_active", true);
if (uErr) throw new Error(uErr.message);

const memberIds = [...new Set((users ?? []).map((u) => u.id).filter(Boolean))];
if (memberIds.length === 0) throw new Error("no platform users");

const { data: channels, error: cErr } = await admin
  .from("internal_message_channels")
  .select("id, name, channel_type, member_operator_ids")
  .eq("workspace_id", WID);
if (cErr) throw new Error(cErr.message);

for (const channel of channels ?? []) {
  const { error } = await admin
    .from("internal_message_channels")
    .update({
      member_operator_ids: memberIds,
    })
    .eq("id", channel.id)
    .eq("workspace_id", WID);
  if (error) throw new Error(`${channel.name}: ${error.message}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      members: memberIds.length,
      channels: (channels ?? []).map((c) => ({ name: c.name, type: c.channel_type })),
    },
    null,
    2,
  ),
);
