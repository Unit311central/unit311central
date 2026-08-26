import assert from "node:assert/strict";

import { augmentSaecOperationsNav } from "@/lib/saec/installations-nav";
import { cityStatusSegments } from "@/lib/saec/installations-map-status";
import { assertSaecSeedTotals, buildSaecInstallationSeed } from "@/lib/saec/installations-seed";
import { buildWorkspaceProductNavSections } from "@/lib/platform-workspaces/workspace-product-nav";
import {
  SAEC_ENABLED_MODULES,
  saecEnabledSubModules,
} from "@/lib/platform-workspaces/saec-provisioning";

const workspaceId = "saec-test-workspace";

const seed = buildSaecInstallationSeed(workspaceId);
assertSaecSeedTotals(seed.assets);
assert.equal(seed.assets.length, 800);
assert.equal(seed.maintenance.length > 800, true);

const opsItems = augmentSaecOperationsNav([
  { label: "Dashboard", icon: "LayoutDashboard", view: "operations-dashboard" },
]);
const installations = opsItems.find((item) => item.label === "Installations");
assert.ok(installations?.children?.length === 3);
assert.ok(installations?.children?.some((child) => child.view === "saec-installations-dashboard"));

const nav = buildWorkspaceProductNavSections({
  workspaceSlug: "saec",
  workspaceType: "Customer",
  enablement: {
    enabledModules: [...SAEC_ENABLED_MODULES],
    enabledSubModules: saecEnabledSubModules(),
  },
});
const operations = nav.find((section) => section.label === "Operations");
assert.ok(operations?.items.some((item) => item.label === "Installations"));

const sampleCity = {
  cityId: "johannesburg" as const,
  cityLabel: "Johannesburg",
  latitude: -26.2,
  longitude: 28.04,
  total: 10,
  online: 7,
  offline: 2,
  maintenanceDue: 3,
  overdue: 1,
  engineersAssigned: 2,
  engineersOnRoad: 1,
  sites: [],
  recentAssets: [],
};
const segments = cityStatusSegments(sampleCity);
assert.equal(segments.reduce((sum, row) => sum + row.value, 0), 10);

console.log("saec-installations.check.ts: all assertions passed");
