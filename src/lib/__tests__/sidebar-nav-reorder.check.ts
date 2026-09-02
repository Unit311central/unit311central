/**
 * Sidebar module reorder helpers — move up/down and drag destination index.
 * Run: node --import tsx src/lib/__tests__/sidebar-nav-reorder.check.ts
 */
import assert from "node:assert/strict";

import { moveSectionKey, reorderSectionKeys, sidebarNavCustomStorageKey } from "@/lib/sidebar-nav-custom";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

assert.equal(sidebarNavCustomStorageKey("wolf"), `unit311-nav-custom:${WOLF_CENTRAL_SLUG}`);
assert.equal(sidebarNavCustomStorageKey(WOLF_CENTRAL_SLUG), `unit311-nav-custom:${WOLF_CENTRAL_SLUG}`);

const keys = ["a", "b", "c", "d", "e"];

assert.deepEqual(reorderSectionKeys(keys, "e", "d"), ["a", "b", "c", "e", "d"]);
assert.deepEqual(reorderSectionKeys(keys, "b", "a"), ["b", "a", "c", "d", "e"]);
assert.deepEqual(reorderSectionKeys(keys, "c", "c"), null);
assert.equal(reorderSectionKeys(keys, "missing", "a"), null);

assert.deepEqual(moveSectionKey(keys, "c", "up"), ["a", "c", "b", "d", "e"]);
assert.deepEqual(moveSectionKey(keys, "c", "down"), ["a", "b", "d", "c", "e"]);
assert.equal(moveSectionKey(keys, "a", "up"), null);
assert.equal(moveSectionKey(keys, "e", "down"), null);
assert.equal(moveSectionKey(keys, "missing", "up"), null);

console.log("sidebar-nav-reorder.check.ts: all assertions passed");
