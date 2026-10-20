#!/usr/bin/env node
/**
 * Verify wolf-central has sales-management in workspace_admin_metadata (migration 220).
 * Requires SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF (or defaults to production ref).
 *
 * Exit 0 when sales-management is present; exit 1 when missing or query fails.
 */
const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "kkxtvzxqmbacjatkiupq";

if (!token) {
  console.error("SKIP: SUPABASE_ACCESS_TOKEN not set — cannot verify migration 220 in production.");
  process.exit(0);
}

const sql = `
select w.slug,
       m.enabled_modules
from public.workspaces w
join public.workspace_admin_metadata m on m.workspace_id = w.id
where w.slug = 'wolf-central'
limit 1;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
});

const body = await res.json();
if (!res.ok) {
  console.error("Query failed:", body);
  process.exit(1);
}

const row = Array.isArray(body) ? body[0] : body?.[0];
if (!row) {
  console.error("wolf-central workspace or metadata row not found");
  process.exit(1);
}

const modules = row.enabled_modules ?? [];
const hasSales = Array.isArray(modules) && modules.includes("sales-management");
if (!hasSales) {
  console.error(
    "Migration 220 pending: wolf-central enabled_modules missing sales-management.",
    modules,
  );
  process.exit(1);
}

console.log("ok  wolf-central enabled_modules includes sales-management");
