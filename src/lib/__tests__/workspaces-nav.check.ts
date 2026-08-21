/**
 * Phase 1 — Workspaces internal Central module shell.
 */
import assert from "node:assert/strict";

import { INTERNAL_SITE_HOST } from "@/lib/app-domains";
import { injectDemoNavSections } from "@/lib/demo/nav";
import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  ABHI_HIDDEN_VIEWS,
  CORPCENTRE_HIDDEN_VIEWS,
  CUSTOMER_PLATFORM_HIDDEN_VIEWS,
  TALANTON_HIDDEN_VIEWS,
  filterInternalNavSectionsForDemoSurface,
} from "@/lib/internal-role-views";
import {
  WORKSPACES_MODULE_LABEL,
  buildWorkspacesNavSection,
} from "@/lib/workspaces-nav";
import { getInternalNavHref } from "@/lib/internal-operations-data";

function sectionLabels(sections: readonly { label?: string | null }[]): string[] {
  return sections.map((section) => String(section.label ?? ""));
}

function withMockHostname<T>(hostname: string, fn: () => T): T {
  const prior = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: { location: { hostname } },
  });
  try {
    return fn();
  } finally {
    if (prior === undefined) {
      // @ts-expect-error test cleanup
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        writable: true,
        value: prior,
      });
    }
  }
}

const baseLabels = sectionLabels(internalSurveyNavSections);
assert.ok(
  !baseLabels.includes(WORKSPACES_MODULE_LABEL),
  "base internalSurveyNavSections must not include Workspaces (internal host injection only)",
);

const built = buildWorkspacesNavSection();
assert.equal(built.label, WORKSPACES_MODULE_LABEL);
assert.equal(built.items.length, 2);
assert.equal(built.items[0]?.label, "Workspace Overview");
assert.equal(built.items[0]?.view, "workspaces-overview");
assert.equal(built.items[1]?.label, "New Workspace");
assert.equal(built.items[1]?.view, "workspaces-new");

const overviewHref = getInternalNavHref("workspaces-overview", "/internaldashboard");
assert.ok(overviewHref.includes("view=workspaces-overview"));
const newHref = getInternalNavHref("workspaces-new", "/internaldashboard");
assert.ok(newHref.includes("view=workspaces-new"));

for (const hidden of [
  CORPCENTRE_HIDDEN_VIEWS,
  TALANTON_HIDDEN_VIEWS,
  ABHI_HIDDEN_VIEWS,
  CUSTOMER_PLATFORM_HIDDEN_VIEWS,
] as const) {
  assert.ok(hidden.has("workspaces-overview"), "workspaces-overview must be hidden on customer surfaces");
  assert.ok(hidden.has("workspaces-new"), "workspaces-new must be hidden on customer surfaces");
}

const internalNav = withMockHostname(INTERNAL_SITE_HOST, () =>
  filterInternalNavSectionsForDemoSurface(internalSurveyNavSections, {
    allowHostSurfaces: true,
  }),
);
const internalLabels = sectionLabels(internalNav);
const settingsIdx = internalLabels.indexOf("Settings");
const workspacesIdx = internalLabels.indexOf(WORKSPACES_MODULE_LABEL);
assert.ok(settingsIdx >= 0, "internal nav must include Settings");
assert.ok(workspacesIdx >= 0, "internal nav must include Workspaces");
assert.equal(
  workspacesIdx,
  settingsIdx + 1,
  "Workspaces must appear immediately after Settings on internal host",
);

const workspacesSection = internalNav.find((section) => section.label === WORKSPACES_MODULE_LABEL);
assert.ok(workspacesSection, "Workspaces section must exist on internal host");
assert.deepEqual(
  workspacesSection?.items.map((item) => item.view),
  ["workspaces-overview", "workspaces-new"],
);

const demoNav = withMockHostname("demo.unit311central.com", () =>
  injectDemoNavSections(
    filterInternalNavSectionsForDemoSurface(internalSurveyNavSections, {
      allowHostSurfaces: true,
    }),
  ),
);
const demoLabels = sectionLabels(demoNav);
assert.ok(
  !demoLabels.includes(WORKSPACES_MODULE_LABEL),
  "demo nav must not include Workspaces",
);

const onwardAirNav = withMockHostname("onwardair.unit311central.com", () =>
  filterInternalNavSectionsForDemoSurface(internalSurveyNavSections, {
    allowHostSurfaces: true,
  }),
);
assert.ok(
  !sectionLabels(onwardAirNav).includes(WORKSPACES_MODULE_LABEL),
  "OnwardAir nav must not include Workspaces",
);

const catalogueIds = listPlatformModules().map((module) => module.id);
assert.ok(
  !catalogueIds.includes("workspaces-overview") && !catalogueIds.includes("workspaces-new"),
  "EA Application Catalogue must not expose Workspaces views",
);

console.log("ok  workspaces-nav checks passed\n");
