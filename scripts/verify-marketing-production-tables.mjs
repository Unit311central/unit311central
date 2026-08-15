/**
 * Read-only production check for Marketing & Events tables.
 *
 * Uses the same Supabase Management API path as apply-unit311central-pending-migrations.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... node scripts/verify-marketing-production-tables.mjs
 */

const MARKETING_TABLES = [
  "marketing_contacts",
  "marketing_newsletters",
  "marketing_campaigns",
  "marketing_external_events",
  "marketing_managed_events",
  "marketing_media_assets",
  "marketing_stories",
  "marketing_abhi_extensions",
];

const PROJECT_REF = "kkxtvzxqmbacjatkiupq";

async function tableExists(token, tableName) {
  const query = `select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = '${tableName}'
  ) as exists`;

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Management API ${response.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }

  const row = Array.isArray(data) ? data[0] : data?.[0];
  return Boolean(row?.exists);
}

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN to verify production marketing tables.");
  console.error("Approved apply path: POST /api/internal/apply-unit311central-pending-migrations");
  console.error("  (includes supabase/migrations/141_marketing_events_module.sql)");
  process.exit(1);
}

const results = [];
for (const table of MARKETING_TABLES) {
  const exists = await tableExists(token, table);
  results.push({ table, exists });
  console.log(`[${exists ? "OK" : "MISSING"}] ${table}`);
}

const missing = results.filter((row) => !row.exists).map((row) => row.table);
if (missing.length) {
  console.error("\nMarketing tables missing in production:", missing.join(", "));
  console.error("Apply via: POST /api/internal/apply-unit311central-pending-migrations");
  console.error("Fallback: ensureMarketingEventsTables() on first M&E write (requires DB credentials).");
  process.exit(1);
}

console.log(`\nAll ${MARKETING_TABLES.length} marketing tables exist in production (${PROJECT_REF}).`);
