/**
 * Read-only marketing table readiness check (production Supabase).
 * Run: node --import tsx src/lib/marketing/__tests__/production-tables.check.ts
 */
import assert from "node:assert/strict";

import { MARKETING_TABLES } from "@/lib/marketing/ensure-marketing-tables";
import { queryScalarViaManagementApi } from "@/lib/internal-db-migrations";

async function main() {
  const missing: string[] = [];

  for (const table of MARKETING_TABLES) {
    const row = await queryScalarViaManagementApi<{ exists: boolean }>(
      `select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = '${table}'
      ) as exists`,
    );
    const exists = Boolean(row?.exists);
    console.log(`[${exists ? "OK" : "MISSING"}] ${table}`);
    if (!exists) missing.push(table);
  }

  if (missing.length) {
    console.error("\nMissing marketing tables:", missing.join(", "));
    console.error("Apply: POST /api/internal/apply-unit311central-pending-migrations");
    console.error("  (141_marketing_events_module.sql is now on the allowlist)");
    process.exit(1);
  }

  assert.equal(missing.length, 0);
  console.log(`\nAll ${MARKETING_TABLES.length} marketing tables exist in production.`);
}

void main();
