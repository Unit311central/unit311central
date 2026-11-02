/**
 * WOLF Sky is a separate WebRTC view for the DJI Neo RTMP publish.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-sky.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildWolfCentralNavSections } from "@/lib/wolf/wolf-nav";
import {
  applyWolfCentralSharkSidebarRows,
  resolveCatalogueModuleIdForNavSection,
} from "@/lib/platform-workspaces/workspace-sidebar-config";
import {
  PROPOSED_WHEP_URL,
  SKY_WHEP_URL,
  WOLF_SKY_RTMP_URL,
  WOLF_SKY_WEBRTC_PATH,
  resolveSkyWhepUrl,
  whepSessionPath,
} from "@/lib/wolf/webrtc-playback";

const nav = buildWolfCentralNavSections();
const sky = nav.find((section) => section.label === "WOLF Sky");
assert.ok(sky?.kind === "workspace");
assert.equal(resolveCatalogueModuleIdForNavSection(sky!), "wolf-sky");
if (sky?.kind === "workspace") {
  assert.equal(sky.items[0]?.label, "Live RGB");
  assert.equal(sky.items[0]?.view, "wolf-sky");
}

const droneAt = nav.findIndex((section) => section.label === "Drone Operations");
const skyAt = nav.findIndex((section) => section.label === "WOLF Sky");
assert.ok(droneAt >= 0 && skyAt === droneAt + 1);

assert.equal(WOLF_SKY_WEBRTC_PATH, "/api/wolf/live/sky/webrtc");
assert.equal(WOLF_SKY_RTMP_URL, "rtmp://38.80.152.147:39908/live/sky");
assert.equal(resolveSkyWhepUrl(undefined), SKY_WHEP_URL);
assert.ok(SKY_WHEP_URL.endsWith("/live/sky/whep"));
assert.ok(PROPOSED_WHEP_URL.endsWith("/live/test/whep"));
assert.notEqual(SKY_WHEP_URL, PROPOSED_WHEP_URL);
assert.equal(whepSessionPath("/live/sky/whep/neo1"), "/live/sky/whep/neo1");
assert.equal(whepSessionPath("/live/test/whep/phone1"), "/live/test/whep/phone1");

const page = fs.readFileSync("src/components/wolf/WolfSkyWorkspace.tsx", "utf8");
assert.match(page, /WOLF Sky/);
assert.match(page, /WOLF_SKY_RTMP_URL/);
assert.match(page, /WOLF_SKY_WEBRTC_PATH/);
assert.match(page, /WolfGroundWebRtcWorkspace/);
assert.doesNotMatch(page, /hls\.js|live\/test/);

const phoneRoute = fs.readFileSync("src/app/api/wolf/live/webrtc/route.ts", "utf8");
const skyRoute = fs.readFileSync("src/app/api/wolf/live/sky/webrtc/route.ts", "utf8");
assert.match(phoneRoute, /resolveWhepUrl/);
assert.doesNotMatch(phoneRoute, /resolveSkyWhepUrl|live\/sky/);
assert.match(skyRoute, /resolveSkyWhepUrl/);
assert.doesNotMatch(skyRoute, /resolveWhepUrl\(/);

const rows = applyWolfCentralSharkSidebarRows(
  [{ moduleId: "wolf-drone-operations", enabled: true, displayOrder: 100 }],
  "wolf-central",
);
const skyRow = rows.find((row) => row.moduleId === "wolf-sky");
assert.ok(skyRow?.enabled);
assert.equal(skyRow?.displayOrder, 105);

console.log("wolf-sky.check.ts — all assertions passed.");
