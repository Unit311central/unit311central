/**
 * Preview-only WOLF Central tenancy regression checks.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-preview-tenancy.check.ts
 */
import assert from "node:assert/strict";

import {
  WOLF_CENTRAL_PREVIEW_ENTRY_PATH,
  isWolfCentralPreviewPathname,
  mapWolfCentralPreviewPathToInternal,
  parseWolfCentralPreviewLoginReturnTo,
} from "@/lib/wolf/wolf-preview-tenancy";

assert.equal(WOLF_CENTRAL_PREVIEW_ENTRY_PATH, "/ws/wolf-central");
assert.ok(isWolfCentralPreviewPathname("/ws/wolf-central"));
assert.ok(isWolfCentralPreviewPathname("/ws/wolf"));
assert.ok(isWolfCentralPreviewPathname("/ws/wolf-central/dashboard"));
assert.ok(!isWolfCentralPreviewPathname("/ws/demo"));
assert.ok(!isWolfCentralPreviewPathname("/dashboard"));

assert.equal(mapWolfCentralPreviewPathToInternal("/ws/wolf-central"), "/internaldashboard");
assert.equal(
  mapWolfCentralPreviewPathToInternal("/ws/wolf-central/dashboard"),
  "/internaldashboard",
);

const previewOrigin = "https://unit311central-git-example.vercel.app";
assert.equal(
  parseWolfCentralPreviewLoginReturnTo(
    `${previewOrigin}/ws/wolf-central`,
    previewOrigin,
  ),
  previewOrigin,
);
assert.equal(
  parseWolfCentralPreviewLoginReturnTo(
    "https://evil.example/ws/wolf-central",
    previewOrigin,
  ),
  null,
);
assert.equal(
  parseWolfCentralPreviewLoginReturnTo(
    `${previewOrigin}/dashboard`,
    previewOrigin,
  ),
  null,
);

console.log("wolf-preview-tenancy.check.ts — all assertions passed.");
