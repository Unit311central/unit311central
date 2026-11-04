/**
 * Phone GPS push helper wiring.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-phone-telemetry-push.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";

const push = fs.readFileSync("src/lib/wolf/phone-telemetry-push.ts", "utf8");
assert.match(push, /pushPhoneGpsToWolf/);
assert.match(push, /readNativeGeolocation/);
assert.match(push, /credentials: "same-origin"/);

const shell = fs.readFileSync("src/lib/wolf/phone-native-shell.ts", "utf8");
assert.match(shell, /requestPermissions/);
assert.match(shell, /WOLFCentralCapacitor/);
assert.match(push, /WOLF_PHONE_TELEMETRY_PATH/);

const overlay = fs.readFileSync("src/components/wolf/WolfPhoneTelemetryOverlay.tsx", "utf8");
assert.match(overlay, /Send GPS now/);
assert.match(overlay, /pushPhoneGpsToWolf/);

console.log("wolf-phone-telemetry-push.check.ts — all assertions passed.");
