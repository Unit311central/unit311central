/**
 * Green Desert file explorer seed checks.
 * Run: npx tsx src/lib/__tests__/greendesert-files-seed.check.ts
 */
import assert from "node:assert/strict";

import {
  GREENDESERT_INTERNAL_FILES_MARKER,
  GREENDESERT_INTERNAL_FOLDER_TREE,
} from "@/lib/greendesert/files-seed";

assert.equal(GREENDESERT_INTERNAL_FILES_MARKER, "Operations");
assert.ok(GREENDESERT_INTERNAL_FOLDER_TREE.length >= 5);

const rootNames = GREENDESERT_INTERNAL_FOLDER_TREE.map((node) => node.name);
assert.ok(rootNames.includes("Operations"));
assert.ok(rootNames.includes("Engineering"));
assert.ok(rootNames.includes("Client Deliverables"));
assert.ok(rootNames.includes("Board & Governance"));

const operations = GREENDESERT_INTERNAL_FOLDER_TREE.find((node) => node.name === "Operations");
assert.ok(operations?.children?.some((child) => child.name === "Logistics & Shipping"));
assert.ok(
  operations?.children
    ?.find((child) => child.name === "Logistics & Shipping")
    ?.files?.some((file) => file.name.includes("GD7829345612")),
);

const jeddah = GREENDESERT_INTERNAL_FOLDER_TREE.find((node) => node.name === "Client Deliverables")
  ?.children?.find((child) => child.name === "Jeddah Technologies");
assert.ok(jeddah?.files?.some((file) => file.name.includes("SOW")));

console.log("greendesert-files-seed.check.ts — all assertions passed");
