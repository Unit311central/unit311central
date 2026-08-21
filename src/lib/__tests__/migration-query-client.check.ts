/**
 * Migration query client — Management API param binding and fallback helpers.
 */
import assert from "node:assert/strict";

import { bindSqlParams, escapeSqlLiteral } from "@/lib/migration-query-client";

assert.equal(escapeSqlLiteral("verified_skip"), "'verified_skip'");
assert.equal(escapeSqlLiteral("149_sales_management_foundation.sql"), "'149_sales_management_foundation.sql'");
assert.equal(escapeSqlLiteral("O'Brien"), "'O''Brien'");
assert.equal(escapeSqlLiteral(null), "NULL");

assert.equal(
  bindSqlParams(
    `insert into public.unit311_applied_migrations (version, method) values ($1, $2) on conflict (version) do nothing`,
    ["149_sales_management_foundation.sql", "verified_skip"],
  ),
  `insert into public.unit311_applied_migrations (version, method) values ('149_sales_management_foundation.sql', 'verified_skip') on conflict (version) do nothing`,
);

console.log("ok  migration-query-client checks passed\n");
