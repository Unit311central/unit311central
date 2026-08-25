import assert from "node:assert/strict";
import test from "node:test";

import {
  SAEC_ENABLED_MODULES,
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

test("SAEC provisioning selections exclude Grants and include Information Repository", () => {
  assert.equal(SAEC_ENABLED_MODULES.includes("fundraising" as never), false);
  assert.equal(saecEnabledSubModules().includes("business-central:grants"), false);

  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enabledModules: [...SAEC_ENABLED_MODULES],
    enabledSubModules: saecEnabledSubModules(),
  });
  const nav = buildWorkspaceProductNavSections({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enablement,
  });
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
