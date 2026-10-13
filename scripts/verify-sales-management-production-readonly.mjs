#!/usr/bin/env node
/**
 * Read-only production verification for Sales Management rollout slice.
 * Uses Supabase Management API (UNIT311_CENTRAL project ref).
 *
 * Usage: SUPABASE_ACCESS_TOKEN=... node scripts/verify-sales-management-production-readonly.mjs
 */
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "kkxtvzxqmbacjatkiupq";
const SLUGS = [
  "unit311",
  "demo",
  "wolf-central",
  "abhi",
  "interfaceworx",
  "greendesert",
  "talantonimpact",
];

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN.");
  process.exit(1);
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data;
}

function hasModule(modules, id) {
  if (!modules) return false;
  const arr = typeof modules === "string" ? JSON.parse(modules) : modules;
  return Array.isArray(arr) && arr.includes(id);
}

async function main() {
  console.log(`project_ref=${PROJECT_REF}\n`);

  const migRows = await query(`
    select version, name
    from supabase_migrations.schema_migrations
    where name in (
      '144_priority_tables_tenant_isolation_rls',
      '219_target_clients_crm_lead_profile',
      '220_wolf_central_sales_management'
    )
    or name like '144_%'
    or name like '219_%'
    or name like '220_%'
    order by version;
  `);
  console.log("=== migrations (144 / 219 / 220 family) ===");
  console.log(JSON.stringify(migRows, null, 2));

  const rls = await query(`
    select pol.polname as policy_name,
           pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
           pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public' and cls.relname = 'crm_leads'
    order by pol.polname;
  `);
  console.log("\n=== crm_leads RLS policies ===");
  console.log(JSON.stringify(rls, null, 2));

  const cols = await query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'crm_leads'
      and column_name in ('workspace_id', 'company_website', 'industry', 'notes')
    order by column_name;
  `);
  console.log("\n=== crm_leads columns (tenancy + target client profile) ===");
  console.log(JSON.stringify(cols, null, 2));

  const workspaces = await query(`
    select w.slug,
           w.id::text as workspace_id,
           m.enabled_modules,
           m.enabled_sub_modules,
           (
             select coalesce(jsonb_agg(jsonb_build_object(
               'module_id', s.module_id,
               'enabled', s.enabled,
               'display_order', s.display_order
             ) order by s.display_order), '[]'::jsonb)
             from public.workspace_sidebar_modules s
             where s.workspace_id = w.id and s.module_id = 'sales-management'
           ) as sales_sidebar
    from public.workspaces w
    left join public.workspace_admin_metadata m on m.workspace_id = w.id
    where w.slug = any(array[${SLUGS.map((s) => `'${s}'`).join(",")}])
    order by w.slug;
  `);
  console.log("\n=== workspace enablement ===");
  for (const row of workspaces) {
    const sm = hasModule(row.enabled_modules, "sales-management");
    const subs = row.enabled_sub_modules;
    const subArr =
      subs == null
        ? []
        : typeof subs === "string"
          ? JSON.parse(subs)
          : subs;
    const smSubCount = Array.isArray(subArr)
      ? subArr.filter((k) => String(k).startsWith("sales-management:")).length
      : 0;
    console.log(
      JSON.stringify({
        slug: row.slug,
        workspace_id: row.workspace_id,
        sales_management_module: sm,
        sales_management_submodule_count: smSubCount,
        sales_sidebar: row.sales_sidebar,
      }),
    );
  }

  const schemaMigCount = await query(
    `select count(*)::int as total from supabase_migrations.schema_migrations;`,
  );
  console.log("\n=== supabase_migrations.schema_migrations row count ===");
  console.log(JSON.stringify(schemaMigCount, null, 2));
  console.log(
    "\n(note) Production uses manual/API applies; empty schema_migrations does not prove 144/219/220 absent — use RLS/columns/metadata signals above.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
