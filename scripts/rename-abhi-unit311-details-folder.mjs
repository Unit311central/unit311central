/**
 * ABHI-only: rename file_folders root "Unit311 Details" → "ABHI Details".
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact.
 *
 *   node scripts/rename-abhi-unit311-details-folder.mjs
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

const SLUG = "abhi";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);
const FROM_NAME = "Unit311 Details";
const TO_NAME = "ABHI Details";

async function main() {
  const { data: workspace, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr) throw new Error(wsErr.message);
  if (!workspace?.id) throw new Error(`Workspace not found: ${SLUG}`);
  if (FORBIDDEN.has(String(workspace.slug).toLowerCase())) {
    throw new Error(`Refusing to rename on forbidden workspace: ${workspace.slug}`);
  }

  const { data: existingTarget, error: targetErr } = await admin
    .from("file_folders")
    .select("id, name, parent_id")
    .eq("workspace_id", workspace.id)
    .eq("name", TO_NAME)
    .is("parent_id", null)
    .maybeSingle();
  if (targetErr) throw new Error(targetErr.message);

  const { data: source, error: sourceErr } = await admin
    .from("file_folders")
    .select("id, name, parent_id")
    .eq("workspace_id", workspace.id)
    .eq("name", FROM_NAME)
    .is("parent_id", null)
    .maybeSingle();
  if (sourceErr) throw new Error(sourceErr.message);

  if (!source?.id) {
    if (existingTarget?.id) {
      console.log(JSON.stringify({ ok: true, action: "already_renamed", folderId: existingTarget.id }, null, 2));
      return;
    }
    console.log(JSON.stringify({ ok: true, action: "not_found", message: `No root folder "${FROM_NAME}" on ABHI` }, null, 2));
    return;
  }

  if (existingTarget?.id && existingTarget.id !== source.id) {
    throw new Error(`ABHI already has a separate root folder "${TO_NAME}" (${existingTarget.id})`);
  }

  const { data: updated, error: updateErr } = await admin
    .from("file_folders")
    .update({ name: TO_NAME })
    .eq("id", source.id)
    .eq("workspace_id", workspace.id)
    .select("id, name, parent_id")
    .single();
  if (updateErr) throw new Error(updateErr.message);

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: "renamed",
        workspaceId: workspace.id,
        folderId: updated.id,
        from: FROM_NAME,
        to: TO_NAME,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
