import assert from "node:assert/strict";
import test from "node:test";

import {
  WORKSPACE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  SAEC_ENABLED_MODULES,
  SAEC_EXCLUDED_SUBMODULE_KEYS,
  saecEnabledSubModules,
} from "@/lib/platform-workspaces/saec-provisioning";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";
import { SAEC_REPORTING_CURRENCY, SAEC_SLUG } from "@/lib/saec-surface";

test("SAEC slug resolves to ZAR reporting currency", () => {
  assert.equal(resolveSlugReportingCurrency(SAEC_SLUG), SAEC_REPORTING_CURRENCY);
});

test("SAEC uses full central catalogue minus Grants submodule", () => {
  assert.equal(SAEC_ENABLED_MODULES.length, 22);
  assert.deepEqual([...SAEC_ENABLED_MODULES], [...WORKSPACE_MODULE_IDS]);

  const fullSubCount = defaultEnabledSubModules(WORKSPACE_MODULE_IDS).length;
  const saecSubs = saecEnabledSubModules();
  assert.equal(fullSubCount, 158);
  assert.equal(saecSubs.length, fullSubCount - SAEC_EXCLUDED_SUBMODULE_KEYS.length);
  assert.equal(SAEC_EXCLUDED_SUBMODULE_KEYS.length, 1);
  assert.equal(SAEC_EXCLUDED_SUBMODULE_KEYS[0], "business-central:grants");
  assert.equal(saecSubs.includes("business-central:grants"), false);

  for (const required of [
    "fundraising",
    "sales-management",
    "business-productivity",
    "support-desk",
    "qms",
    "tools",
    "settings",
  ]) {
    assert.ok(SAEC_ENABLED_MODULES.includes(required as (typeof SAEC_ENABLED_MODULES)[number]));
  }

  assert.ok(saecSubs.includes("business-productivity:internal-work-packages"));
  assert.ok(saecSubs.includes("engineering:engineering-technical-files"));
  assert.ok(saecSubs.includes("business-central:information-repository"));

  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enabledModules: [...SAEC_ENABLED_MODULES],
    enabledSubModules: saecSubs,
  });
  const nav = buildWorkspaceProductNavSections({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enablement,
  });
  const labels = nav.flatMap((section) =>
    section.kind === "pin"
      ? section.items.map((item) => item.label)
      : section.label
        ? [section.label]
        : [],
  );

  assert.equal(labels.length, 22);
  for (const label of [
    "HOME",
    "Sales Management",
    "Fundraising",
    "Business Productivity",
    "Support Desk",
    "QMS",
    "Tools",
    "Settings",
  ]) {
    assert.ok(labels.includes(label), `Missing nav label: ${label}`);
  }

  const bc = nav.find((section) => section.label === "Business Central");
  assert.ok(bc && bc.kind === "workspace");
  assert.equal(
    bc.items.some((item) => item.view === "grants"),
    false,
    "Grants must not appear in SAEC nav",
  );
  assert.ok(
    bc.items.some((item) => item.view === "information-repository"),
    "Information Repository must appear in SAEC Business Central nav",
  );
});
