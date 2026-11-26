/**
 * Client Directory UNIT311 / WOLF classification.
 *
 * Run: npx tsx src/lib/__tests__/client-type-classification.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildCreateClientRequestBody, buildUpdateClientRequestBody } from "@/lib/client-create-from-draft";
import {
  clientTypeBadgeLabel,
  createNewClientDraft,
  isClientType,
  mapInternalClient,
} from "@/lib/client-management-data";
import { filterClientDirectoryDisplayRows } from "@/lib/client-directory-filter";
import { MIGRATION_SATISFACTION_PROBES } from "@/lib/migration-satisfaction-probes";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";

const MIGRATION = "supabase/migrations/226_internal_clients_client_type.sql";

assert.equal(isClientType("unit311central"), true);
assert.equal(isClientType("wolf"), true);
assert.equal(isClientType("WOLF"), false);
assert.equal(isClientType(""), false);
assert.equal(isClientType(null), false);
assert.equal(clientTypeBadgeLabel("unit311central"), "UNIT311");
assert.equal(clientTypeBadgeLabel("wolf"), "WOLF");
assert.equal(createNewClientDraft().clientType, undefined);

const mapped = mapInternalClient({
  id: "client-1",
  company_name: "Example",
  industry: "Other",
  primary_contact: "",
  email: "",
  phone: "",
  region: "United Kingdom",
  account_status: "Active",
  contract_type: "Retainer",
  client_type: "wolf",
  tax_id: "",
  billing_address: "",
  job_title: "",
  company_address: "",
  invoice_email: "",
  active_projects: 0,
  notes: "",
  platform_url: null,
  platform_organisation_id: null,
  files_folder_id: null,
  files_folder_name: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
});
assert.equal(mapped.clientType, "wolf");
assert.equal(mapped.id, "client-1");
assert.equal(mapped.companyName, "Example");

const rows = [
  { ...createNewClientDraft(), id: "a", companyName: "Unit Co", clientType: "unit311central" as const },
  { ...createNewClientDraft(), id: "b", companyName: "Wolf Co", clientType: "wolf" as const, industry: "Energy & Utilities" as const },
];
const filters = {
  search: "",
  industry: "all",
  country: "all",
  city: "all",
  status: "all" as const,
  contract: "all",
  clientType: "all" as const,
};
assert.deepEqual(
  filterClientDirectoryDisplayRows(rows, filters).map((row) => row.id),
  ["a", "b"],
);
assert.deepEqual(
  filterClientDirectoryDisplayRows(rows, { ...filters, clientType: "wolf", search: "energy" }).map(
    (row) => row.companyName,
  ),
  ["Wolf Co"],
);
assert.equal(
  filterClientDirectoryDisplayRows(rows, { ...filters, clientType: "unit311central", search: "wolf" })
    .length,
  0,
);

const updateBody = buildUpdateClientRequestBody(rows[1]!);
assert.equal(updateBody.clientType, "wolf");
assert.equal(updateBody.companyName, "Wolf Co");

const omitted = buildCreateClientRequestBody(createNewClientDraft());
assert.equal("clientType" in omitted, false);
const required = buildCreateClientRequestBody(createNewClientDraft(), { requireClientType: true });
assert.equal(required.clientType, null);

const sql = readFileSync(MIGRATION, "utf8");
assert.match(sql, /add column if not exists client_type text/);
assert.match(sql, /set client_type = 'unit311central'/);
assert.match(sql, /where client_type is null/);
assert.match(sql, /alter column client_type set not null/);
assert.match(sql, /client_type in \('unit311central', 'wolf'\)/);
assert.doesNotMatch(sql, /drop table/i);
assert.doesNotMatch(sql, /delete from public\.internal_clients/i);

assert.ok((UNIT311_PENDING_MIGRATIONS as readonly string[]).includes(MIGRATION));
assert.match(MIGRATION_SATISFACTION_PROBES[MIGRATION] ?? "", /client_type/);
assert.match(MIGRATION_SATISFACTION_PROBES[MIGRATION] ?? "", /internal_clients_client_type_check/);

const directory = readFileSync(
  "src/components/testflighthub/ClientManagementClientDirectoryView.tsx",
  "utf8",
);
assert.match(directory, /ClientDirectoryBusinessContextSelector/);
assert.match(directory, /All types/);
assert.match(directory, /clientTypeBadgeLabel/);
assert.match(directory, /requireClientType: true/);
assert.match(directory, /Client type is required/);

const fields = readFileSync(
  "src/components/testflighthub/client-directory/ClientRecordEditableFields.tsx",
  "utf8",
);
assert.match(fields, /Client Type/);
assert.match(fields, /Select client type/);
assert.match(fields, /showClientType/);

console.log("ok  client-type-classification");
