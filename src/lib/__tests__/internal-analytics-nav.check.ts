/**
 * Internal Analytics nav must always include SAEC Feedback after System Health ships.
 * Run: node --import tsx src/lib/__tests__/internal-analytics-nav.check.ts
 */
import assert from "node:assert/strict";

import type { InternalNavSection } from "@/lib/internal-operations-data";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  filterInternalNavSectionsByGrants,
  filterInternalNavSectionsForDemoSurface,
  isViewAllowedForGrants,
} from "@/lib/internal-role-views";

function analyticsItemLabels(sections: readonly InternalNavSection[]): string[] {
  const analytics = sections.find((section) => section.label === "Analytics");
  return analytics?.items.map((item) => item.label) ?? [];
}

(globalThis as typeof globalThis & { window?: Window }).window = {
  location: { hostname: "internal.unit311central.com", pathname: "/" },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
} as unknown as Window;

const freshNav = filterInternalNavSectionsForDemoSurface(internalSurveyNavSections, {
  allowHostSurfaces: true,
});

assert.deepEqual(analyticsItemLabels(freshNav), [
  "Platform Analytics",
  "Website Analytics",
  "System Health",
  "SAEC Feedback",
]);

const staleAnalytics: InternalNavSection = {
  kind: "workspace",
  label: "Analytics",
  icon: "BarChart3",
  color: "#38BDF8",
  items: [
    { label: "Platform Analytics", icon: "LayoutDashboard", view: "platform-analytics" },
    { label: "Website Analytics", icon: "Globe", view: "website-analytics" },
    { label: "System Health", icon: "Activity", view: "system-health" },
  ],
};

const eaIdx = internalSurveyNavSections.findIndex(
  (section) =>
    section.kind === "pin" &&
    section.items.some((item) => item.view === "executive-assistant"),
);
const sectionsWithStale = [...internalSurveyNavSections];
sectionsWithStale.splice(eaIdx + 1, 0, staleAnalytics);

const mergedNav = filterInternalNavSectionsForDemoSurface(sectionsWithStale, {
  allowHostSurfaces: true,
});

assert.deepEqual(analyticsItemLabels(mergedNav), [
  "Platform Analytics",
  "Website Analytics",
  "System Health",
  "SAEC Feedback",
]);

const restrictedGrants = filterInternalNavSectionsByGrants(
  filterInternalNavSectionsForDemoSurface(internalSurveyNavSections, {
    allowHostSurfaces: true,
  }),
  ["home", "profile", "platform-analytics", "website-analytics", "system-health"],
);

assert.ok(
  analyticsItemLabels(restrictedGrants).includes("SAEC Feedback"),
  "SAEC Feedback must survive grant filtering via ALWAYS_ALLOWED_VIEWS",
);

assert.equal(isViewAllowedForGrants("saec-feedback", []), true);
assert.equal(isViewAllowedForGrants("system-health", []), true);

console.log("ok  internal-analytics-nav checks passed\n");
