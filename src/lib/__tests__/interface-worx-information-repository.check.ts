import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE,
  groupRepositoryCategoriesIntoRows,
  isReservedRepositoryFolderName,
  UNIT311_DETAILS_REPOSITORY_PROFILE,
} from "@/lib/information-repository-profile";
import { isInterfaceWorxSlug } from "@/lib/interface-worx-surface";
import { buildWorkspaceProductNavSections } from "@/lib/platform-workspaces/workspace-product-nav";
import { WORKSPACE_MODULE_IDS, defaultEnabledSubModules } from "@/lib/platform-workspaces/module-catalogue";

assert.equal(INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE.builtinCategories.length, 0);
assert.equal(INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE.rootFolderName, "Information Repository");
assert.equal(
  isReservedRepositoryFolderName("Information Repository", INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE),
  true,
);
assert.equal(
  isReservedRepositoryFolderName("Company Structure", INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE),
  false,
);

const iwRows = groupRepositoryCategoriesIntoRows(
  [
    {
      id: "custom-company-structure",
      label: "Company Structure",
      folderName: "Company Structure",
    },
  ],
  INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE,
);
assert.equal(iwRows.length, 1);
assert.equal(iwRows[0]?.[0]?.label, "Company Structure");

const unit311Rows = groupRepositoryCategoriesIntoRows(
  UNIT311_DETAILS_REPOSITORY_PROFILE.builtinCategories.slice(0, 2),
  UNIT311_DETAILS_REPOSITORY_PROFILE,
);
assert.ok(unit311Rows.length > 0);

const iwNav = buildWorkspaceProductNavSections({
  workspaceSlug: "interfaceworx",
  workspaceType: "Customer",
  enablement: {
    enabledModules: [...WORKSPACE_MODULE_IDS],
    enabledSubModules: defaultEnabledSubModules([...WORKSPACE_MODULE_IDS]),
  },
});
const bc = iwNav.find((section) => section.label === "Business Central");
assert.ok(bc && bc.kind === "workspace");
const infoRepo = bc.items.find((item) => item.view === "information-repository");
assert.ok(infoRepo, "Interface Worx Business Central must include Information Repository");
assert.equal(infoRepo?.label, "Information Repository");
assert.equal(
  bc.items.some((item) => item.label === "Information Repository" && item.children?.length),
  false,
  "Information Repository must be a direct leaf without a Dashboard child",
);

const demoNav = buildWorkspaceProductNavSections({
  workspaceSlug: "demo",
  workspaceType: "Demo",
  enablement: {
    enabledModules: [...WORKSPACE_MODULE_IDS],
    enabledSubModules: defaultEnabledSubModules([...WORKSPACE_MODULE_IDS]),
  },
});
const demoBc = demoNav.find((section) => section.label === "Business Central");
assert.ok(demoBc && demoBc.kind === "workspace");
assert.ok(
  demoBc.items.some((item) => item.view === "information-repository"),
  "Demo Business Central must include Information Repository from central catalogue",
);
const demoLabels = demoBc.items.map((item) => item.label);
assert.equal(
  demoLabels.indexOf("Information Repository"),
  demoLabels.indexOf("Grants") + 1,
  "Information Repository must follow Grants in Business Central",
);

const authSource = readFileSync(
  join(process.cwd(), "src/lib/interface-worx-information-repository-auth.ts"),
  "utf8",
);
assert.match(authSource, /viewsForWorkspaceEnablement/);
assert.doesNotMatch(authSource, /isInterfaceWorxSlug/);

const apiSource = readFileSync(
  join(process.cwd(), "src/app/api/information-repository/route.ts"),
  "utf8",
);
assert.match(apiSource, /requireInterfaceWorxWorkspaceSession/);
assert.match(apiSource, /resolveInformationRepositoryProfile/);
assert.match(apiSource, /workspaceId: auth\.workspace\.id/);

assert.ok(isInterfaceWorxSlug("interfaceworx"));
assert.equal(isInterfaceWorxSlug("greendesert"), false);

console.log("interface-worx-information-repository.check.ts: all assertions passed");
