/**
 * Demo workspace safety — abort unless slug resolves to demo (never unit311).
 */

const FORBIDDEN_SLUGS = new Set(["unit311", "internal"]);

export async function resolveDemoWorkspace(query, demoSlug = "demo") {
  const slug = String(demoSlug || "demo").trim().toLowerCase();
  if (!slug || FORBIDDEN_SLUGS.has(slug) || slug === "unit311") {
    throw new Error(`Refusing to seed non-Demo slug: ${slug}`);
  }

  const rows = await query(
    `select id::text as id, slug, name from public.workspaces where slug = ${sqlLiteral(slug)} limit 1`,
  );
  const workspace = Array.isArray(rows) ? rows[0] : rows?.rows?.[0];
  if (!workspace?.id) {
    throw new Error(`Demo workspace slug '${slug}' not found. Apply migration 119 first.`);
  }
  if (String(workspace.slug).toLowerCase() !== slug) {
    throw new Error(`Workspace slug mismatch: expected ${slug}, got ${workspace.slug}`);
  }
  if (FORBIDDEN_SLUGS.has(String(workspace.slug).toLowerCase())) {
    throw new Error("Refusing to operate on Internal workspace.");
  }

  const internal = await query(
    `select id::text as id from public.workspaces where slug = 'unit311' limit 1`,
  );
  const internalId = (Array.isArray(internal) ? internal[0] : internal?.rows?.[0])?.id;
  if (internalId && workspace.id === internalId) {
    throw new Error("Fatal: Demo workspace id equals Internal workspace id.");
  }

  return {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    internalId: internalId ?? null,
  };
}

export function assertDemoOnly(workspaceId, demoId, internalId) {
  if (!workspaceId || workspaceId !== demoId) {
    throw new Error("Safety: workspace_id is not Demo.");
  }
  if (internalId && workspaceId === internalId) {
    throw new Error("Safety: attempted Internal workspace mutation.");
  }
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}
