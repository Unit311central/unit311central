#!/usr/bin/env node
/**
 * Ensure WOLF Central APK declares location permissions for @capacitor/geolocation.
 * Run after `cap sync android` (CI and local builds).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, "../android/app/src/main/AndroidManifest.xml");

const PERMS = [
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.ACCESS_FINE_LOCATION",
];

if (!fs.existsSync(manifestPath)) {
  console.error(`patch-android-manifest: missing ${manifestPath} — run cap sync android first.`);
  process.exit(1);
}

let xml = fs.readFileSync(manifestPath, "utf8");
let changed = false;

for (const perm of PERMS) {
  if (xml.includes(perm)) continue;
  const line = `    <uses-permission android:name="${perm}" />`;
  if (xml.includes("<application")) {
    xml = xml.replace("<application", `${line}\n    <application`);
  } else {
    xml = xml.replace("</manifest>", `    ${line}\n</manifest>`);
  }
  changed = true;
  console.log(`patch-android-manifest: added ${perm}`);
}

if (changed) {
  fs.writeFileSync(manifestPath, xml);
} else {
  console.log("patch-android-manifest: location permissions already present.");
}
