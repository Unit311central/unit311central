/**
 * OnwardAir-only: wipe legacy Unit311 file folders and seed Houston OA trees.
 *
 * Internal: Engineering, Board, Finance, HR, Operations, Legal, Lab Data, …
 * External: Partners, Suppliers, Grants, Investors, Shared Deliverables, …
 *
 * Hard-refuses non-onwardair workspaces.
 *
 *   node scripts/seed-onwardair-files-folders.mjs
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
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
  "abhi",
]);

const INTERNAL_TOP = [
  "Engineering",
  "Board & Governance",
  "Finance",
  "Human Resources",
  "Operations",
  "Legal & Contracts",
  "Lab & Flight Test",
  "Marketing",
  "IT & Security",
];

const INTERNAL_NESTED = [
  { parent: "Engineering", name: "FLEX Pod Design" },
  { parent: "Engineering", name: "Avionics" },
  { parent: "Engineering", name: "Structures" },
  { parent: "Board & Governance", name: "Board Packs" },
  { parent: "Board & Governance", name: "Minutes" },
  { parent: "Finance", name: "Budgets" },
  { parent: "Finance", name: "Investor Reporting" },
  { parent: "Lab & Flight Test", name: "Telemetry" },
  { parent: "Lab & Flight Test", name: "Test Logs" },
  { parent: "Operations", name: "Procurement" },
  { parent: "Operations", name: "Logistics" },
];

const EXTERNAL_TOP = [
  "Partners",
  "Suppliers",
  "Grants & Agencies",
  "Investors",
  "Shared Deliverables",
  "NDAs & Exchanges",
];

const EXTERNAL_NESTED = [
  { parent: "Partners", name: "DFW Vertiport" },
  { parent: "Partners", name: "USTRANSCOM" },
  { parent: "Suppliers", name: "Gulf Coast Battery" },
  { parent: "Suppliers", name: "Toray Composites" },
  { parent: "Grants & Agencies", name: "NASA / FAA" },
  { parent: "Investors", name: "1588 Ventures" },
];

async function ensureFolder(workspaceId, name, parentId, externalScope) {
  let query = admin
    .from("file_folders")
    .select("id, name, parent_id")
    .eq("workspace_id", workspaceId)
    .eq("external_scope", externalScope)
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
      external_scope: externalScope,
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

  // Detach file objects then wipe folders for this workspace only.
  await admin.from("file_objects").update({ folder_id: null }).eq("workspace_id", workspace.id);
  const { error: delErr } = await admin
    .from("file_folders")
    .delete()
    .eq("workspace_id", workspace.id);
  if (delErr) throw new Error(`delete file_folders: ${delErr.message}`);

  const created = [];

  // Internal tree (no single "Internal Files" root — browse roots are top-level folders).
  const internalByName = new Map();
  for (const name of INTERNAL_TOP) {
    const folder = await ensureFolder(workspace.id, name, null, false);
    internalByName.set(name, folder);
    created.push(`internal/${name}`);
  }
  for (const spec of INTERNAL_NESTED) {
    const parent = internalByName.get(spec.parent);
    if (!parent?.id) throw new Error(`Missing internal parent: ${spec.parent}`);
    await ensureFolder(workspace.id, spec.name, parent.id, false);
    created.push(`internal/${spec.parent}/${spec.name}`);
  }

  // External tree under External Files root.
  const externalRoot = await ensureFolder(workspace.id, "External Files", null, true);
  created.push("external/External Files");
  const externalByName = new Map([["External Files", externalRoot]]);
  for (const name of EXTERNAL_TOP) {
    const folder = await ensureFolder(workspace.id, name, externalRoot.id, true);
    externalByName.set(name, folder);
    created.push(`external/${name}`);
  }
  for (const spec of EXTERNAL_NESTED) {
    const parent = externalByName.get(spec.parent);
    if (!parent?.id) throw new Error(`Missing external parent: ${spec.parent}`);
    await ensureFolder(workspace.id, spec.name, parent.id, true);
    created.push(`external/${spec.parent}/${spec.name}`);
  }

  const { count } = await admin
    .from("file_folders")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  console.log(JSON.stringify({ ok: true, workspace: SLUG, folders: count, created }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
