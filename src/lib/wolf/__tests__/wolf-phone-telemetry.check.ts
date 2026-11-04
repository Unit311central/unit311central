/**
 * Phone GPS fix parsing for the Brix WebRTC overlay.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-phone-telemetry.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  formatPhoneFix,
  gpsLoggerBody,
  parsePhoneFixInput,
  phoneFixStatus,
  rowToPhoneFix,
} from "@/lib/wolf/phone-telemetry";
import { phoneIngestToken, workspaceIdFromPhoneToken } from "@/lib/wolf/phone-telemetry-token";

const fix = parsePhoneFixInput({
  latitude: 52.52,
  longitude: 13.405,
  altitudeM: 42.2,
  speedMps: 3,
  headingDeg: 8,
});
assert.ok(fix);
assert.equal(phoneFixStatus(fix!.headingDeg), "hdg:8.0");
const shown = formatPhoneFix({ ...fix!, recordedAt: "2026-11-02T20:00:00.000Z" });
assert.equal(shown.position, "52.52000° N, 13.40500° E");
assert.equal(shown.detail, "42 m · 11 km/h · 008°");

const loggerFix = parsePhoneFixInput({
  latitude: "52.52",
  longitude: "13.405",
  altitude: "42.2",
  speed: "3",
  heading: "8",
});
assert.equal(formatPhoneFix({ ...loggerFix!, recordedAt: "2026-11-02T20:00:00.000Z" }).detail, "42 m · 11 km/h · 008°");
assert.equal(parsePhoneFixInput({ latitude: "1", longitude: "2", altitude: "", speed: "", heading: "" })?.altitudeM, null);

assert.equal(parsePhoneFixInput({ latitude: 91, longitude: 0 }), null);
assert.equal(parsePhoneFixInput({ latitude: 1, longitude: 2, speedMps: -1 })?.speedMps, null);

const fresh = rowToPhoneFix(
  {
    timestamp: "2026-11-02T20:00:00.000Z",
    latitude: 1,
    longitude: 2,
    altitude: 3,
    speed: 4,
    status: "hdg:90.0",
  },
  Date.parse("2026-11-02T20:00:30.000Z"),
);
assert.equal(fresh?.headingDeg, 90);
assert.equal(
  rowToPhoneFix(
    {
      timestamp: "2026-11-02T20:00:00.000Z",
      latitude: 1,
      longitude: 2,
      altitude: null,
      speed: null,
      status: "phone",
    },
    Date.parse("2026-11-02T20:02:00.000Z"),
  ),
  null,
);

const workspaceId = "cd5c37a5-add4-4a8b-830c-6d26b775f62c";
const token = phoneIngestToken(workspaceId, "test-secret");
assert.equal(workspaceIdFromPhoneToken(token, "test-secret"), workspaceId);
assert.equal(workspaceIdFromPhoneToken(`${token}x`, "test-secret"), null);
const body = gpsLoggerBody(token);
assert.match(body, /^token=.+&latitude=%LAT/);
assert.ok(body.includes(encodeURIComponent(token).slice(0, 8)));

const page = fs.readFileSync("src/components/wolf/WolfPhoneLinkWorkspace.tsx", "utf8");
assert.match(page, /GPSLogger/);
assert.match(page, /stream key test/);
assert.doesNotMatch(page, /split screen/);
const route = fs.readFileSync("src/app/api/wolf/live/phone-telemetry/route.ts", "utf8");
assert.match(route, /workspaceIdFromPhoneToken/);
assert.match(route, /application\/x-www-form-urlencoded/);
const sky = fs.readFileSync("src/components/wolf/WolfSkyWorkspace.tsx", "utf8");
assert.match(sky, /showPhoneTelemetry=\{false\}/);

console.log("wolf-phone-telemetry.check.ts — all assertions passed.");
