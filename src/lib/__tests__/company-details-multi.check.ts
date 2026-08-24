/**
 * Multi-company Company Information regression checks.
 * Run: npm run prove:company-details-multi
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createBlankCompanyDetailsFields,
  sanitizeCompanyDetailsFields,
  validateCompanyDetailsFields,
} from "@/lib/company-details-data";

const repoRoot = join(process.cwd());

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

// --- Schema migration drops one-company-per-workspace constraint ---
const migration = readRepoFile("supabase/migrations/156_company_details_multi_entity.sql");
assert.ok(
  migration.includes("drop constraint if exists company_details_workspace_id_key"),
  "migration must drop unique workspace_id constraint",
);
assert.ok(migration.includes("archived_at"), "migration must add archived_at for soft archive");
assert.ok(migration.includes("display_order"), "migration must add display_order");

// --- Service exposes multi-company CRUD ---
const serviceSource = readRepoFile("src/lib/company-details-service.ts");
assert.ok(serviceSource.includes("listCompanyDetails"), "service must list companies per workspace");
assert.ok(serviceSource.includes("getCompanyDetailsById"), "service must fetch by id within workspace");
assert.ok(serviceSource.includes("createCompanyDetails"), "service must create additional companies");
assert.ok(serviceSource.includes("updateCompanyDetails"), "service must update individual companies");
assert.ok(serviceSource.includes("archiveCompanyDetails"), "service must soft-archive companies");
assert.ok(
  serviceSource.includes('.eq("workspace_id", workspaceId)'),
  "service queries must filter by workspace_id",
);
assert.ok(
  serviceSource.includes('.eq("id", companyId)'),
  "service updates must scope by company id",
);

// --- API routes ---
const listRoute = readRepoFile("src/app/api/company-details/route.ts");
assert.ok(listRoute.includes("listCompanyDetails"), "GET must return companies list");
assert.ok(listRoute.includes("export async function POST"), "POST must create companies");

const idRoute = readRepoFile("src/app/api/company-details/[id]/route.ts");
assert.ok(idRoute.includes("updateCompanyDetails"), "PUT [id] must update one company");
assert.ok(idRoute.includes("archiveCompanyDetails"), "DELETE [id] must archive one company");
assert.ok(idRoute.includes("getCompanyDetailsById"), "GET [id] must load one company");

// --- UI multi-company workspace ---
const workspaceUi = readRepoFile("src/components/testflighthub/CompanyDetailsWorkspace.tsx");
assert.ok(workspaceUi.includes("CompanyEntityCard"), "workspace must render company cards");
assert.ok(workspaceUi.includes("Add company"), "workspace must expose add-company action");
assert.ok(workspaceUi.includes("No companies added yet"), "workspace must have empty state");

const cardUi = readRepoFile("src/components/testflighthub/CompanyEntityCard.tsx");
assert.ok(cardUi.includes("/api/company-details/"), "card must call per-company API for updates");
assert.ok(cardUi.includes('"POST"'), "new company uses POST");

// --- Validation: independent companies ---
const companyA = sanitizeCompanyDetailsFields({
  ...createBlankCompanyDetailsFields(),
  legalCompanyName: "Amanah Surgical LLC",
  countryOfRegistration: "United States",
});
const companyB = sanitizeCompanyDetailsFields({
  ...createBlankCompanyDetailsFields(),
  legalCompanyName: "Amanah Surgical Saudi Arabia",
  countryOfRegistration: "Saudi Arabia",
});
assert.equal(validateCompanyDetailsFields(companyA).legalCompanyName, undefined);
assert.equal(validateCompanyDetailsFields(companyB).legalCompanyName, undefined);
assert.notEqual(companyA.legalCompanyName, companyB.legalCompanyName);

// --- Pending migrations include multi-entity migration ---
const pending = readRepoFile("src/lib/unit311-pending-migrations.ts");
assert.ok(
  pending.includes("156_company_details_multi_entity.sql"),
  "pending migrations must include 156",
);

console.log("company-details-multi.check.ts: all assertions passed");
