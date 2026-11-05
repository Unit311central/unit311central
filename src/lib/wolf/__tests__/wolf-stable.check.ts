/**
 * Stable Management navigation, demonstration data, and Ground WebRTC reuse.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-stable.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { WOLF_GROUND_WEBRTC_PATH } from "@/lib/wolf/webrtc-playback";
import {
  activeStableAlerts,
  stableFacilityById,
  WOLF_STABLE_FACILITIES,
} from "@/lib/wolf/stable/demo-data";
import { applyWorkspaceSidebarModuleConfig } from "@/lib/platform-workspaces/workspace-sidebar-config";
import { wolfGroundWebRtcLinkStatus } from "@/lib/wolf/webrtc-link-status";
import { buildWolfCentralNavSections } from "@/lib/wolf/wolf-nav";

const nav = buildWolfCentralNavSections();
const pins = nav.filter((section) => section.kind === "pin");
const stable = nav.find((section) => section.label === "Stable Management");
assert.equal(pins[0]?.items[0]?.label, "Estate overview");
assert.equal(stable?.kind, "workspace");
assert.equal(stable?.items.length, 1);
assert.equal(stable?.items[0]?.label, "Stable Management");
assert.equal(stable?.items[0]?.view, "wolf-stable");
assert.ok(!pins.some((section) => section.items.some((item) => item.view === "wolf-stable")));
assert.ok(!nav.some((section) => section.label === "Tools" && section.items.some((item) => item.view === "wolf-stable")));
assert.ok(!nav.some((section) => section.label === "Animals" && section.items.some((item) => item.view === "wolf-stable")));

const ordered = applyWorkspaceSidebarModuleConfig(nav, {
  modules: [
    { moduleId: "sales-management", enabled: true, displayOrder: 0 },
    { moduleId: "wolf-animals", enabled: true, displayOrder: 1 },
  ],
});
const orderedWorkspaces = ordered.filter((section) => section.kind === "workspace");
assert.equal(orderedWorkspaces[0]?.label, "Stable Management");
assert.equal(orderedWorkspaces[0]?.items[0]?.view, "wolf-stable");
assert.ok(
  !ordered.some(
    (section) =>
      section.label !== "Stable Management" &&
      section.items.some((item) => item.view === "wolf-stable"),
  ),
);

const facility = stableFacilityById("windsor-estate-stables");
assert.ok(facility);
assert.equal(facility.demonstration, true);
assert.equal(facility.horses.length, 5);
assert.equal(facility.areas.length, 5);
assert.equal(facility.cameras.length, 5);
assert.equal(activeStableAlerts(facility).length, 0);
assert.equal(facility.environment.source, "simulated");
assert.equal(facility.environment.sensorId, null);

const simulated = facility.cameras.filter((camera) => camera.mode === "simulated");
const live = facility.cameras.filter((camera) => camera.mode === "webrtc");
assert.equal(simulated.length, 4);
assert.equal(live.length, 1);
assert.equal(new Set(simulated.map((camera) => camera.image)).size, 4);
assert.equal(live[0]?.signallingPath, WOLF_GROUND_WEBRTC_PATH);
assert.equal(live[0]?.id, "camera-05");

for (const horse of facility.horses) {
  assert.equal(horse.veterinary.entries, null);
  assert.equal(horse.feeding.entries, null);
  assert.equal(horse.medication.entries, null);
  assert.equal(horse.ownership.entries, null);
  assert.equal(horse.healthMonitoring.entries, null);
}

assert.equal(WOLF_STABLE_FACILITIES.length, 1);

assert.equal(wolfGroundWebRtcLinkStatus("idle", "waiting", ""), "connecting");
assert.equal(wolfGroundWebRtcLinkStatus("connected", "waiting", ""), "connecting");
assert.equal(wolfGroundWebRtcLinkStatus("connected", "receiving", ""), "live");
assert.equal(
  wolfGroundWebRtcLinkStatus("failed", "failed", "Brix is not on the air for stream key test."),
  "offline",
);
assert.equal(
  wolfGroundWebRtcLinkStatus("failed", "failed", "WHEP signalling endpoint is unreachable."),
  "failed",
);

const player = fs.readFileSync("src/components/wolf/WolfGroundWebRtcWorkspace.tsx", "utf8");
assert.match(player, /export function WolfGroundWebRtcPlayer/);
assert.match(player, /new RTCPeerConnection/);
assert.match(player, /iceServers: \[\]/);
assert.match(player, /WOLF Test Ground WebRTC/);
assert.match(player, /WolfPhoneFieldCapture/);
assert.doesNotMatch(player, /hls\.js|application\/vnd\.apple\.mpegurl/);

const stablePage = fs.readFileSync("src/components/wolf/stable/WolfStableManagementWorkspace.tsx", "utf8");
assert.match(stablePage, /WolfGroundWebRtcPlayer/);
assert.match(stablePage, /SIMULATED LIVE/);
assert.doesNotMatch(stablePage, /new RTCPeerConnection|mediamtx|runpod/i);

const webrtcRoute = fs.readFileSync("src/app/api/wolf/live/webrtc/route.ts", "utf8");
assert.match(webrtcRoute, /resolveWhepUrl/);
assert.doesNotMatch(webrtcRoute, /stable/);

console.log("wolf-stable.check.ts — all assertions passed.");
