/**
 * WOLF Veterinary Connection reuses Business Prod Communications call stack.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-vet-evaluation.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { WOLF_VET_EVALUATION_ROOM } from "@/lib/wolf/wolf-vet-evaluation";

assert.equal(WOLF_VET_EVALUATION_ROOM, "wolf-vet-evaluation");

const nav = fs.readFileSync("src/lib/wolf/wolf-nav.ts", "utf8");
assert.match(nav, /Veterinary Connection/);
assert.match(nav, /wolf-veterinary-connection/);

const workspace = fs.readFileSync(
  "src/components/wolf/WolfVeterinaryConnectionWorkspace.tsx",
  "utf8",
);
assert.match(workspace, /MessagingCallRoom/);
assert.match(workspace, /\/api\/messaging\/calls/);
assert.match(workspace, /WOLF_VET_EVALUATION_ROOM/);
assert.match(workspace, /Instant meeting/);

console.log("wolf-vet-evaluation.check.ts — all assertions passed.");
