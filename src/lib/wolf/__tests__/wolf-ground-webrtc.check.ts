/**
 * WOLF Ground WebRTC signalling helpers and page boundaries.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-ground-webrtc.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PROPOSED_WHEP_URL,
  WOLF_GROUND_WEBRTC_PATH,
  resolveWhepUrl,
  whepSessionPath,
} from "@/lib/wolf/webrtc-playback";

assert.equal(WOLF_GROUND_WEBRTC_PATH, "/api/wolf/live/webrtc");
assert.equal(resolveWhepUrl(undefined), PROPOSED_WHEP_URL);
assert.equal(resolveWhepUrl("  "), PROPOSED_WHEP_URL);
assert.equal(
  resolveWhepUrl("https://example.test/live/test/whep"),
  "https://example.test/live/test/whep",
);
assert.throws(() => resolveWhepUrl("http://example.test/live/test/whep"), /https/);
assert.throws(() => resolveWhepUrl("not a url"), /valid URL/);
assert.throws(() => resolveWhepUrl("https://user:secret@example.test/live/test/whep"), /credentials/);

assert.equal(whepSessionPath("/live/test/whep/abc-DEF_1"), "/live/test/whep/abc-DEF_1");
assert.equal(
  whepSessionPath("https://4s4dzedw76v0re-8889.proxy.runpod.net/live/test/whep/session1"),
  "/live/test/whep/session1",
);
assert.equal(whepSessionPath("/live/sky/whep/session1"), "/live/sky/whep/session1");
assert.equal(whepSessionPath("/live/other/whep/session1"), null);
assert.equal(whepSessionPath("/live/test/whep/../../secret"), null);
assert.equal(whepSessionPath("https://evil.example/live/test/whep/session1"), "/live/test/whep/session1");
assert.equal(whepSessionPath(null), null);

const page = fs.readFileSync("src/components/wolf/WolfGroundWebRtcWorkspace.tsx", "utf8");
assert.match(page, /WOLF Test Ground WebRTC/);
assert.match(page, /Direct WebRTC live video streaming test/);
assert.match(page, /new RTCPeerConnection/);
assert.match(page, /iceServers: \[\]/);
assert.doesNotMatch(page, /hls\.js|application\/vnd\.apple\.mpegurl|live\/stream/);

const hlsPage = fs.readFileSync("src/components/wolf/WolfTestGroundWorkspace.tsx", "utf8");
assert.match(hlsPage, /from "hls\.js"/);
assert.match(hlsPage, /liveSyncDuration: 3/);
assert.match(hlsPage, /liveMaxLatencyDuration: 8/);
assert.match(hlsPage, /lowLatencyMode: false/);
assert.doesNotMatch(hlsPage, /RTCPeerConnection|whep/);

const nav = fs.readFileSync("src/lib/wolf/wolf-nav.ts", "utf8");
const testGroundAt = nav.indexOf('view: "wolf-test-ground"');
const webrtcAt = nav.indexOf('view: "wolf-ground-webrtc"');
assert.ok(testGroundAt > 0 && webrtcAt > testGroundAt);

console.log("wolf-ground-webrtc.check.ts — all assertions passed.");
