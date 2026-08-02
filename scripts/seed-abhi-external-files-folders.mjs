/**
 * ABHI-only: seed External Files folder tree for member/event content.
 *
 * Ensures under External Files:
 *   Members, Events, Working Groups, Accelerators, Partners, Board Papers
 *   Members/Active, Events/WHX 2026
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact.
 *
 *   node scripts/seed-abhi-external-files-folders.mjs
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
const EXTERNAL_ROOT_NAME = "External Files";

const TOP_LEVEL = [
  "Members",
  "Events",
  "Working Groups",
  "Accelerators",
  "Partners",
  "Board Papers",
];

const NESTED = [
  { parent: "Members", name: "Active" },
  { parent: "Events", name: "WHX 2026" },
];

async function ensureExternalFolder(workspaceId, name, parentId) {
  let query = admin
    .from("file_folders")
    .select("id, name, parent_id")
    .eq("workspace_id", workspaceId)
    .eq("external_scope", true)
    .eq("name", name)
    .limit(1);

  query = parentId == null ? query.is("parent_id", null) : query.eq("parent_id", parentId);

  const { data: existing, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (existing) return { ...existing, created: false };

  const { data, error: insertError } = await admin
    .from("file_folders")
    .insert({
      name,
      parent_id: parentId,
      category_id: null,
      external_scope: true,
      workspace_id: workspaceId,
    })
    .select("id, name, parent_id")
    .single();
  if (insertError) throw new Error(insertError.message);
  return { ...data, created: true };
}

async function main() {
  const { data: workspace, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr) throw new Error(wsErr.message);
  if (!workspace?.id) throw new Error(`Workspace not found: ${SLUG}`);
  if (FORBIDDEN.has(String(workspace.slug).toLowerCase())) {
    throw new Error(`Refusing to seed forbidden workspace: ${workspace.slug}`);
  }

  const root = await ensureExternalFolder(workspace.id, EXTERNAL_ROOT_NAME, null);
  const created = [];
  const existing = [];
  const byName = new Map([[EXTERNAL_ROOT_NAME, root]]);

  for (const name of TOP_LEVEL) {
    const folder = await ensureExternalFolder(workspace.id, name, root.id);
    byName.set(name, folder);
    (folder.created ? created : existing).push(`${EXTERNAL_ROOT_NAME}/${name}`);
  }

  for (const spec of NESTED) {
    const parent = byName.get(spec.parent);
    if (!parent?.id) throw new Error(`Missing parent folder: ${spec.parent}`);
    const folder = await ensureExternalFolder(workspace.id, spec.name, parent.id);
    (folder.created ? created : existing).push(`${spec.parent}/${spec.name}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspaceId: workspace.id,
        externalRootId: root.id,
        created,
        alreadyPresent: existing,
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
