/**
 * Target Clients internal rollout — nav injection on internal central host only.
 */
import assert from "node:assert/strict";

import type { InternalNavSection } from "@/lib/internal-operations-data";
import { SALES_MANAGEMENT_MODULE_LABEL } from "@/lib/sales-management-nav";
import {
  TARGET_CLIENTS_TAB,
  isTargetClientsRolloutHost,
  withTargetClientsNav,
} from "@/lib/sales-management-target-clients";

assert.equal(isTargetClientsRolloutHost("internal.unit311central.com"), true);
assert.equal(isTargetClientsRolloutHost("INTERNAL.UNIT311CENTRAL.COM"), true);
assert.equal(isTargetClientsRolloutHost("internal.localhost"), true);
assert.equal(isTargetClientsRolloutHost("demo.unit311central.com"), false);
assert.equal(isTargetClientsRolloutHost("talantonimpact.unit311central.com"), false);
assert.equal(isTargetClientsRolloutHost("abhi.unit311central.com"), false);

const simplifiedSalesSection: InternalNavSection = {
  kind: "workspace",
  label: SALES_MANAGEMENT_MODULE_LABEL,
  icon: "TrendingUp",
  color: "#7C3AED",
  items: [
    {
      label: "Sales",
      icon: "Handshake",
      children: [
        { label: "Opportunities", view: "sales-management", query: { tab: "opportunities" } },
        { label: "Sales Quotes", view: "sales-management", query: { tab: "sales-quotes" } },
        { label: "Partners", view: "sales-management", query: { tab: "partners" } },
      ],
    },
  ],
};

const withTarget = withTargetClientsNav([simplifiedSalesSection]);
const salesGroup = withTarget[0]?.items.find((item) => item.label === "Sales");
assert.ok(salesGroup?.children?.length, "Sales group must remain");
const labels = salesGroup!.children!.map((child) => child.label);
assert.deepEqual(labels, ["Target Clients", "Opportunities", "Sales Quotes", "Partners"]);
assert.equal(salesGroup!.children![0]?.query?.tab, TARGET_CLIENTS_TAB);

const idempotent = withTargetClientsNav(withTarget);
const salesAgain = idempotent[0]?.items.find((item) => item.label === "Sales");
assert.equal(
  salesAgain?.children?.filter((c) => c.label === "Target Clients").length,
  1,
  "withTargetClientsNav must not duplicate Target Clients",
);

/** EnterprisePlatformSidebar uses filterInternalNavSectionsForDemoSurface → injectInternalOnlyNav. */
function assertInternalPipelineIncludesTargetClients() {
  const prevWindow = globalThis.window;
  try {
    // @ts-expect-error minimal browser stub for internal host detection in nav pipeline
    globalThis.window = { location: { hostname: "internal.unit311central.com" } };
    const { internalSurveyNavSections } =
      require("@/lib/internal-operations-data") as typeof import("@/lib/internal-operations-data");
    const { filterInternalNavSectionsForDemoSurface } =
      require("@/lib/internal-role-views") as typeof import("@/lib/internal-role-views");
    const sections = filterInternalNavSectionsForDemoSurface(internalSurveyNavSections, {
      allowHostSurfaces: true,
    });
    const sm = sections.find((section) => section.label === SALES_MANAGEMENT_MODULE_LABEL);
    const sales = sm?.items.find((item) => item.label === "Sales");
    const labels = sales?.children?.map((child) => child.label) ?? [];
    assert.ok(labels.includes("Target Clients"), `missing Target Clients: ${labels.join(", ")}`);
    const tcIdx = labels.indexOf("Target Clients");
    const oppIdx = labels.indexOf("Opportunities");
    assert.ok(
      tcIdx >= 0 && oppIdx >= 0 && tcIdx < oppIdx,
      `Target Clients must precede Opportunities: ${labels.join(", ")}`,
    );
  } finally {
    if (prevWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      globalThis.window = prevWindow;
    }
  }
}

assertInternalPipelineIncludesTargetClients();

console.log("ok  sales-management-target-clients checks passed\n");
