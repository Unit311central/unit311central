/**
 * Business Central → Management context separation.
 * Run: node --import tsx src/lib/__tests__/management-context.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ManagementContextSelector, WolfManagementPlaceholder } from "@/components/central-capabilities/ManagementContextSelector";
import { buildManagementNavItem } from "@/lib/central-capabilities/management-nav";
import {
  MANAGEMENT_CONTEXT_OPTIONS,
  WOLF_MANAGEMENT_PLACEHOLDER,
  applyManagementContextSearchParam,
  isBusinessCentralManagementNav,
  managementContextSelectorEnabled,
  managementNavChildrenForContext,
  resolveManagementNavContext,
  resolveManagementPageContext,
} from "@/lib/central-capabilities/management-context";

const unit311Labels = ["Management Dashboard", "Meetings", "Function Packs", "Actions & Decisions"];

assert.deepEqual(
  MANAGEMENT_CONTEXT_OPTIONS.map((option) => option.label),
  ["UNIT311CENTRAL", "WOLF"],
);
assert.equal(MANAGEMENT_CONTEXT_OPTIONS[0]?.id, "unit311central");
assert.equal(resolveManagementPageContext(new URLSearchParams()), "unit311central");
assert.equal(resolveManagementPageContext(null), "unit311central");
assert.equal(
  resolveManagementPageContext(new URLSearchParams("view=management")),
  "unit311central",
);
assert.equal(
  resolveManagementPageContext(new URLSearchParams("view=management&managementContext=wolf")),
  "wolf",
);
assert.equal(
  resolveManagementPageContext(
    new URLSearchParams("view=management&section=meetings&managementContext=wolf"),
  ),
  "unit311central",
  "A module section stays on Unit311Central Management",
);
assert.equal(
  resolveManagementPageContext(new URLSearchParams("managementContext=unit311central")),
  "unit311central",
);
assert.equal(
  resolveManagementPageContext(new URLSearchParams("managementContext=other")),
  "unit311central",
);
assert.equal(
  resolveManagementPageContext(new URLSearchParams("view=management"), "wolf"),
  "wolf",
  "A bare Management URL keeps the stored WOLF choice",
);
assert.equal(
  resolveManagementPageContext(new URLSearchParams("view=management&section=meetings"), "wolf"),
  "unit311central",
);
assert.equal(
  resolveManagementNavContext({
    activeView: "management",
    searchParams: new URLSearchParams("view=management"),
    stored: "wolf",
  }),
  "wolf",
);

assert.deepEqual(
  managementNavChildrenForContext("unit311central").map((child) => child.label),
  unit311Labels,
);
assert.deepEqual(managementNavChildrenForContext("wolf"), []);
assert.deepEqual(
  buildManagementNavItem().children?.map((child) => child.label),
  unit311Labels,
  "Catalogue Management children stay the existing Unit311Central modules",
);

assert.equal(managementContextSelectorEnabled("/"), true);
assert.equal(managementContextSelectorEnabled("/internaldashboard"), true);
assert.equal(managementContextSelectorEnabled("/dashboard"), false);
assert.equal(managementContextSelectorEnabled("/overview"), false);
assert.equal(isBusinessCentralManagementNav("Business Central", "Management"), true);
assert.equal(isBusinessCentralManagementNav("Sales Management", "Management"), false);
assert.equal(isBusinessCentralManagementNav("Business Productivity", "Management"), false);

assert.equal(
  resolveManagementNavContext({
    activeView: "clients",
    searchParams: new URLSearchParams("view=clients"),
    stored: "wolf",
  }),
  "wolf",
);
assert.equal(
  resolveManagementNavContext({
    activeView: "clients",
    searchParams: new URLSearchParams("view=clients"),
    stored: "unit311central",
  }),
  "unit311central",
);
assert.equal(
  resolveManagementNavContext({
    activeView: "management",
    searchParams: new URLSearchParams("view=management&section=function-packs"),
    stored: "wolf",
  }),
  "unit311central",
);
assert.equal(
  resolveManagementNavContext({
    activeView: "management",
    searchParams: new URLSearchParams("view=management&managementContext=wolf"),
    stored: "unit311central",
  }),
  "wolf",
);

{
  const params = new URLSearchParams("view=management&section=meetings&managementContext=wolf");
  applyManagementContextSearchParam(params, "management", { managementContext: "wolf" });
  assert.equal(params.get("managementContext"), "wolf");
  assert.equal(params.get("section"), "meetings", "Context helper does not rewrite module sections");
}

{
  const params = new URLSearchParams("view=management&managementContext=wolf");
  applyManagementContextSearchParam(params, "management", {});
  assert.equal(params.get("managementContext"), null);
}

{
  const params = new URLSearchParams("view=management&section=actions-decisions");
  applyManagementContextSearchParam(params, "management", { section: "actions-decisions" });
  assert.equal(params.get("managementContext"), null);
  assert.equal(params.get("section"), "actions-decisions");
}

{
  const params = new URLSearchParams("view=clients&managementContext=wolf");
  applyManagementContextSearchParam(params, "clients", null);
  assert.equal(params.get("managementContext"), null);
}

{
  const params = new URLSearchParams("view=management&managementContext=wolf");
  applyManagementContextSearchParam(params, "management", null);
  assert.equal(params.get("managementContext"), "wolf", "In-page links keep the current URL context");
}

{
  const unit311 = renderToStaticMarkup(
    createElement(ManagementContextSelector, { context: "unit311central", onChange: () => {} }),
  );
  assert.match(unit311, /UNIT311CENTRAL/);
  assert.match(unit311, /WOLF/);
  assert.match(unit311, /aria-checked="true"/);
  assert.match(unit311, /data-management-context="unit311central"/);
  assert.match(unit311, /min-h-10/);
  assert.equal(unit311.includes("ml-6"), false);
  assert.equal(unit311.includes("Management Dashboard"), false);
  assert.equal(unit311.includes("Meetings"), false);

  const wolfNav = renderToStaticMarkup(
    createElement(ManagementContextSelector, { context: "wolf", onChange: () => {} }),
  );
  assert.match(wolfNav, /data-management-context="wolf"/);
  assert.equal(wolfNav.includes("Function Packs"), false);
  assert.equal(wolfNav.includes("Actions"), false);

  const placeholder = renderToStaticMarkup(createElement(WolfManagementPlaceholder));
  assert.match(placeholder, /WOLF Management/);
  assert.match(placeholder, /configured separately/);
  assert.equal(placeholder.includes("Management Dashboard"), false);
  assert.equal(placeholder.includes("Function Packs"), false);
  assert.equal(placeholder.includes("Actions &amp; Decisions"), false);
}

{
  const workspace = readFileSync(
    "src/components/central-capabilities/ManagementWorkspace.tsx",
    "utf8",
  );
  const selectorAt = workspace.indexOf("<ManagementContextSelector");
  const tabsAt = workspace.indexOf("<ManagementSectionNav");
  assert.ok(selectorAt > 0 && tabsAt > selectorAt, "Selector renders above the Management tabs");
  assert.equal(workspace.includes("return <WolfManagementPlaceholder />"), false);
  const sidebar = readFileSync(
    "src/components/testflighthub/EnterprisePlatformSidebar.tsx",
    "utf8",
  );
  assert.equal(sidebar.includes("ManagementContextSelector"), false);
}

assert.match(WOLF_MANAGEMENT_PLACEHOLDER.title, /WOLF Management/);
assert.match(WOLF_MANAGEMENT_PLACEHOLDER.message, /configured separately/);
assert.equal(WOLF_MANAGEMENT_PLACEHOLDER.message.includes("Management Dashboard"), false);
assert.equal(WOLF_MANAGEMENT_PLACEHOLDER.message.includes("Function Packs"), false);

console.log("ok  management-context checks passed");
