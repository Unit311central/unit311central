/**
 * Ensure demo@unit311central.com can access OnwardAir workspace.
 *   node scripts/ensure-demo-onwardair-access.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function loadEnvFile(filePath) {
  const out = {};
  try {
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v && !v.startsWith("[SENSITI")) out[k] = v;
    }
  } catch {
    /* optional */
  }
  return out;
}

const merged = { ...loadEnvFile(path.join(root, ".env.corporatecentre.runtime")) };
const admin = createClient(
  merged.SUPABASE_URL || merged.NEXT_PUBLIC_SUPABASE_URL,
  merged.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const EMAIL = "demo@unit311central.com";
const OA_ID = "3b479f90-d063-421b-ae93-542a508129f5";

const { data: user, error } = await admin
  .from("platform_users")
  .select("id, email, username, workspace_id, user_type, is_active, display_name")
  .eq("username", EMAIL)
  .eq("is_active", true)
  .maybeSingle();
if (error) throw new Error(error.message);
if (!user) throw new Error("Canonical demo@ user not found");

const { error: updErr } = await admin
  .from("platform_users")
  .update({
    email: EMAIL,
    workspace_id: OA_ID,
    user_type: "internal",
    is_active: true,
    updated_at: new Date().toISOString(),
  })
  .eq("id", user.id);
if (updErr) throw new Error(updErr.message);

const { data: mem } = await admin
  .from("workspace_users")
  .select("id, role, is_owner")
  .eq("workspace_id", OA_ID)
  .eq("user_id", user.id)
  .maybeSingle();

if (!mem) {
  const { error: memErr } = await admin.from("workspace_users").insert({
    workspace_id: OA_ID,
    user_id: user.id,
    role: "admin",
    is_owner: false,
  });
  if (memErr) throw new Error(memErr.message);
  console.log("Added OnwardAir membership (admin)");
} else if (mem.role !== "admin" && mem.role !== "owner") {
  const { error: roleErr } = await admin
    .from("workspace_users")
    .update({ role: "admin" })
    .eq("id", mem.id);
  if (roleErr) throw new Error(roleErr.message);
  console.log("Upgraded OnwardAir membership to admin");
} else {
  console.log("OnwardAir membership present:", mem.role);
}

const { data: allMem } = await admin
  .from("workspace_users")
  .select("workspace_id, role, is_owner")
  .eq("user_id", user.id);

console.log({
  userId: user.id,
  username: user.username,
  primaryWorkspaceId: OA_ID,
  memberships: allMem,
  access: "ok",
});
