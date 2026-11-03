/**
 * Phone field capture parsing.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-phone-capture.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { formatCaptureSummary, parsePhoneCaptureFix } from "@/lib/wolf/phone-capture";

const fix = parsePhoneCaptureFix({ latitude: 41.69325, longitude: 2.20283, altitudeM: 318, speedMps: 0.3 });
assert.ok(fix);
assert.equal(formatCaptureSummary({
  id: "1",
  kind: "position",
  capturedAt: "2026-11-02T21:00:00.000Z",
  latitude: fix!.latitude,
  longitude: fix!.longitude,
  altitudeM: fix!.altitudeM,
  speedMps: fix!.speedMps,
  headingDeg: null,
  mimeType: null,
  sizeBytes: null,
  mediaUrl: null,
}), "41.69325° N, 2.20283° E");

assert.equal(parsePhoneCaptureFix({ latitude: 100, longitude: 0 }), null);

const page = fs.readFileSync("src/components/wolf/WolfPhoneFieldCapture.tsx", "utf8");
assert.match(page, /Log position/);
assert.match(page, /Take photo/);
assert.match(page, /Record video/);
const webrtc = fs.readFileSync("src/components/wolf/WolfGroundWebRtcWorkspace.tsx", "utf8");
assert.match(webrtc, /WolfPhoneFieldCapture/);
assert.match(webrtc, /layout="sidebar"/);

const link = fs.readFileSync("src/components/wolf/WolfPhoneLinkWorkspace.tsx", "utf8");
assert.match(link, /WOLF Test Ground WebRTC/);

console.log("wolf-phone-capture.check.ts — all assertions passed.");
