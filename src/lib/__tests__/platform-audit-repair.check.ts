/**
 * Platform audit repair regression checks.
 * Run: node --import tsx src/lib/__tests__/platform-audit-repair.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MODULE_GRANT_GROUPS } from "@/lib/access-presets";
import { viewsForWorkspaceEnablement } from "@/lib/workspace-enabled-views";
import { defaultEnabledModules } from "@/lib/platform-workspaces/module-catalogue";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";

const fundraisingGroup = MODULE_GRANT_GROUPS.find((group) => group.id === "fundraising");
assert.ok(fundraisingGroup, "fundraising grant group must exist");
assert.ok(
  fundraisingGroup.views.includes("fundraising-dashboard"),
  "fundraising grant group must include dashboard",
);
assert.ok(
  fundraisingGroup.views.includes("fundraising-cap-table"),
  "fundraising grant group must include cap table",
);

const enabledViews = viewsForWorkspaceEnablement(
  [...defaultEnabledModules(), "fundraising", "engineering", "business-productivity"],
  null,
);
assert.ok(
  enabledViews.includes("fundraising-dashboard"),
  "enabled catalogue must expose fundraising dashboard",
);
assert.ok(
  enabledViews.includes("engineering-technical-files"),
  "enabled catalogue must expose technical files when engineering enabled",
);
assert.ok(
  enabledViews.includes("internal-work-packages"),
  "enabled catalogue must expose internal work packages",
);

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/159_internal_work_packages.sql"),
  "utf8",
);
assert.match(migration, /internal_work_packages/);
assert.match(migration, /workspace_id uuid not null/);
assert.ok(
  UNIT311_PENDING_MIGRATIONS.includes("supabase/migrations/159_internal_work_packages.sql"),
  "migration 159 must be registered",
);

const service = readFileSync(
  join(process.cwd(), "src/lib/internal-work-packages/service.ts"),
  "utf8",
);
assert.match(service, /eq\("workspace_id", ws\)/);
assert.match(service, /WP-\$\{String\(max \+ 1\)/);

const procurement = readFileSync(
  join(process.cwd(), "src/lib/procurement-mock-store.ts"),
  "utf8",
);
assert.match(procurement, /seedCustomerWorkspaceEmptyState/);
assert.match(procurement, /isBrowserCustomerWorkspaceSurface/);

const sidebarNav = readFileSync(
  join(process.cwd(), "src/lib/sidebar-nav-custom.ts"),
  "utf8",
);
assert.match(sidebarNav, /appendNewSectionKeys/);
assert.doesNotMatch(
  sidebarNav,
  /next\.customized\s*\?\s*appendNewSectionKeys\(prev, sections\)\s*:\s*defaultSectionOrder\(sections\)/,
);

const moduleCatalogue = readFileSync(
  join(process.cwd(), "src/lib/platform-workspaces/module-catalogue.ts"),
  "utf8",
);
assert.match(moduleCatalogue, /fundraising: \["fundraising"\]/);
assert.match(moduleCatalogue, /internal-work-packages/);

const dashboard = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InternalOperationsDashboard.tsx"),
  "utf8",
);
assert.match(dashboard, /isViewAllowedForWorkspaceGrants/);
assert.match(dashboard, /internal-work-packages/);
assert.match(dashboard, /InternalWorkPackagesWorkspace/);

console.log("ok  platform-audit-repair checks passed\n");
