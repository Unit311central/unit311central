/**
 * PAILEX navigation label and structure regression checks.
 *
 * Run: npx tsx src/lib/pailex/__tests__/pailex-nav.check.ts
 */
import assert from "node:assert/strict";

import {
  buildPailexNavSections,
  PAILEX_NAV_SECTION_LABELS,
} from "@/lib/pailex/pailex-nav";
import { PAILEX_OPERATIONAL_VIEWS } from "@/lib/pailex/pailex-views";

const nav = buildPailexNavSections();

const pin = nav.find((section) => section.kind === "pin");
assert.ok(pin, "PAILEX pin section required");
assert.equal(pin.items[0]?.label, "Dashboard");
assert.equal(pin.items[0]?.view, "pailex-dashboard");

const workspaceLabels = nav
  .filter((section) => section.kind === "workspace")
  .map((section) => section.label);
assert.deepEqual(workspaceLabels, [...PAILEX_NAV_SECTION_LABELS]);

const allLabels = nav.flatMap((section) =>
  section.items.flatMap((item) => [item.label, ...(item.children?.map((c) => c.label) ?? [])]),
);
for (const label of allLabels) {
  assert.ok(!/coming soon/i.test(label), `PAILEX nav must not include Coming soon: ${label}`);
  assert.ok(!/business central|finances|sales|procurement|crm/i.test(label), `Generic OS leak: ${label}`);
}

assert.deepEqual(
  nav.find((s) => s.label === "Animals")?.items.map((item) => item.label),
  ["Registry", "Monitoring", "Census", "Health"],
);
assert.deepEqual(
  nav.find((s) => s.label === "Support")?.items.map((item) => item.label),
  ["Requests", "Maintenance"],
);
assert.deepEqual(
  nav.find((s) => s.label === "Settings")?.items.map((item) => item.label),
  ["Settings", "Users"],
);

const navViews = nav.flatMap((section) => section.items.map((item) => item.view));
for (const view of PAILEX_OPERATIONAL_VIEWS) {
  assert.ok(navViews.includes(view), `PAILEX nav missing view: ${view}`);
}
assert.ok(navViews.includes("settings"));
assert.ok(navViews.includes("users"));
assert.equal(navViews.filter((view) => view === "settings").length, 1);

console.log("pailex-nav.check.ts — all assertions passed.");
