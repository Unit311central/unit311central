/**
 * Sidebar module reorder helpers — move up/down and drag destination index.
 * Run: node --import tsx src/lib/__tests__/sidebar-nav-reorder.check.ts
 */
import assert from "node:assert/strict";

import { moveSectionKey, reorderSectionKeys } from "@/lib/sidebar-nav-custom";

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
