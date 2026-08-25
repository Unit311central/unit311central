import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";
import {
  CLIENT_PLATFORM_ALWAYS_VIEWS,
  UNIT311_SUPPORT_VIEW,
  UNIT311_PLATFORM_SUPPORT_VIEW,
} from "@/lib/unit311-support/data";
import { isViewAllowedForGrants } from "@/lib/internal-role-views";

const repoRoot = join(__dirname, "..", "..", "..");

function readRepoFile(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

test("unit311 support migration is registered for production apply", () => {
  assert.ok(
    UNIT311_PENDING_MIGRATIONS.includes("supabase/migrations/173_unit311_support.sql"),
    "pending migrations must include 173_unit311_support.sql",
  );
});

test("customer Unit311 Support is a central always-on client tool view", () => {
  assert.ok(CLIENT_PLATFORM_ALWAYS_VIEWS.has(UNIT311_SUPPORT_VIEW));
  assert.equal(isViewAllowedForGrants(UNIT311_SUPPORT_VIEW, []), true);
});

test("internal platform support view is wired in dashboard and nav data", () => {
  const operationsData = readRepoFile("src/lib/internal-operations-data.ts");
  const dashboard = readRepoFile("src/components/testflighthub/InternalOperationsDashboard.tsx");
  const roleViews = readRepoFile("src/lib/internal-role-views.ts");

  assert.match(operationsData, /unit311-support/);
  assert.match(operationsData, /unit311-platform-support/);
  assert.match(dashboard, /Unit311SupportWorkspace/);
  assert.match(dashboard, /Unit311PlatformSupportWorkspace/);
  assert.match(roleViews, /injectInternalUnit311SupportNav/);
  assert.match(roleViews, /ensureClientUnit311SupportToolsNav/);
});

test("unit311 support API routes exist for customer and internal flows", () => {
  const customerTickets = readRepoFile("src/app/api/unit311-support/tickets/route.ts");
  const internalTickets = readRepoFile("src/app/api/internal/unit311-support/tickets/route.ts");

  assert.match(customerTickets, /requireCustomerUnit311SupportApiContext/);
  assert.match(internalTickets, /requireInternalUnit311SupportApiContext/);
  assert.match(customerTickets, /organisationId/);
  assert.doesNotMatch(customerTickets, new RegExp(UNIT311_PLATFORM_SUPPORT_VIEW));
});
