/**
 * Migration query client — Management API param binding and fallback helpers.
 */
import assert from "node:assert/strict";

import { bindSqlParams, escapeSqlLiteral } from "@/lib/migration-query-client";
import { RECORD_MIGRATION_APPLIED_SQL } from "@/lib/migration-ledger";

assert.equal(escapeSqlLiteral("verified_skip"), "'verified_skip'");
assert.equal(escapeSqlLiteral("149_sales_management_foundation.sql"), "'149_sales_management_foundation.sql'");
assert.equal(escapeSqlLiteral("O'Brien"), "'O''Brien'");
assert.equal(escapeSqlLiteral(null), "NULL");

assert.equal(
  bindSqlParams(RECORD_MIGRATION_APPLIED_SQL, [
    "149_sales_management_foundation.sql",
    "management-api",
  ]),
  `insert into public.unit311_applied_migrations (version, method)
     values ('149_sales_management_foundation.sql', 'management-api')
     on conflict (version) do update
     set method = excluded.method,
         applied_at = now()
     where public.unit311_applied_migrations.method = 'verified_skip'
       and excluded.method in ('management-api', 'postgres')`,
);

console.log("ok  migration-query-client checks passed\n");
