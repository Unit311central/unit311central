/**
 * WOLF Estate map geography acceptance checks.
 * Usage: npm run prove:wolf-estate-map
 * Optional: WOLF_DEMO_PASSWORD='...' to verify authenticated map API on production.
 */
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ORIGIN = process.env.WOLF_PROVE_ORIGIN ?? "https://wolf.unit311central.com";
const PASSWORD = process.env.WOLF_DEMO_PASSWORD ?? "";
const USER = process.env.WOLF_DEMO_USERNAME ?? "admin@wolf.unit311central.com";

function cookieHeader(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];
  return list.map((raw) => raw.split(";")[0]).filter(Boolean).join("; ");
}

async function login() {
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USER,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login failed: ${JSON.stringify(body)}`);
  return cookieHeader(res.headers.getSetCookie?.() ?? []);
}

async function main() {
  const staticRes = await fetch(`${ORIGIN}/geo/wolf/southern-east-africa-countries.geojson`);
  const staticBody = await staticRes.text();
  assert.equal(staticRes.status, 200, "static wolf geojson must be reachable");
  assert.ok(staticBody.includes("FeatureCollection"), "static wolf geojson must be valid");
  const staticGeo = JSON.parse(staticBody);
  assert.ok(Array.isArray(staticGeo.features) && staticGeo.features.length >= 14, "static geojson must include corridor countries");
  assert.ok(
    staticGeo.features.some((feature) => feature.properties?.name === "Kenya"),
    "static geojson must include Kenya",
  );
  assert.ok(
    staticGeo.features.some((feature) => feature.properties?.name === "South Africa"),
    "static geojson must include South Africa",
  );

  const unauthMap = await fetch(`${ORIGIN}/api/wolf/map-geography`);
  assert.equal(unauthMap.status, 401, "map geography API must require authentication when unauthenticated");

  if (PASSWORD) {
    const cookie = await login();
    const mapApi = await fetch(`${ORIGIN}/api/wolf/map-geography`, { headers: { Cookie: cookie } });
    const mapBody = await mapApi.text();
    assert.equal(mapApi.status, 200, "authenticated map geography API must return 200");
    assert.ok(mapBody.includes("FeatureCollection"), "authenticated map API must return GeoJSON");
    const mapGeo = JSON.parse(mapBody);
    assert.ok(mapGeo.features.length >= 14, "authenticated map API must include corridor countries");

    const estate = await fetch(`${ORIGIN}/api/wolf/estate`, { headers: { Cookie: cookie } });
    assert.equal(estate.status, 200, "authenticated estate API must return 200");
  } else {
    console.log("prove-wolf-estate-map: skipping authenticated API checks (WOLF_DEMO_PASSWORD not set)");
  }

  const artifactDir = "/opt/cursor/artifacts";
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(path.join(artifactDir, "wolf-map-geojson-sample.json"), staticBody.slice(0, 1200));

  console.log("prove-wolf-estate-map.mjs — all assertions passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
