/**
 * Green Desert file explorer persistence checks.
 * Run: npx tsx src/lib/__tests__/greendesert-files-persistence.check.ts
 */
import assert from "node:assert/strict";

import {
  createGreenDesertFolderEntry,
  GREENDESERT_FILES_ROOT_ID,
  normalizeGreenDesertFilesState,
} from "@/lib/greendesert/greendesert-files-persistence";

const seeded = normalizeGreenDesertFilesState(null);
assert.equal(seeded.entries.length, 1);
assert.equal(seeded.entries[0]?.id, GREENDESERT_FILES_ROOT_ID);

const withFolder = createGreenDesertFolderEntry(seeded, "Pilot docs");
assert.equal(withFolder.entries.length, 2);
assert.equal(
  withFolder.entries.find((entry) => entry.name === "Pilot docs")?.parentId,
  GREENDESERT_FILES_ROOT_ID,
);

const unchanged = createGreenDesertFolderEntry(withFolder, "   ");
assert.equal(unchanged.entries.length, withFolder.entries.length);

const normalized = normalizeGreenDesertFilesState({ entries: [] });
assert.equal(normalized.entries[0]?.id, GREENDESERT_FILES_ROOT_ID);

console.log("greendesert-files-persistence.check.ts — all assertions passed");
