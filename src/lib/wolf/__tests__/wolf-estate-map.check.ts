/**
 * WOLF Estate map geographic-foundation checks (WOLF Central only).
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-estate-map.check.ts
 *
 * Verifies the real geographic projection frames the Kenya → South Africa
 * region and places the demo reserves at sensible, in-frame positions. It does
 * not touch SAEC or any other workspace.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  WOLF_MAP_BOUNDS,
  WOLF_MAP_VIEWBOX,
  WOLF_OPERATIONAL_COUNTRY_NAMES,
  buildWolfMapLayers,
  projectWolfLonLat,
  type WolfMapFeatureCollection,
} from "@/lib/wolf/africa-map-project";
import { WOLF_DEMO_RESERVE_SEEDS } from "@/lib/wolf/central/demo-seed";

// The frame must focus on Kenya (north) through South Africa (south), not the
// whole continent.
assert.ok(WOLF_MAP_BOUNDS.maxLat >= 4, "frame must reach into Kenya");
assert.ok(WOLF_MAP_BOUNDS.minLat <= -34, "frame must reach the South Africa coast");
assert.ok(
  WOLF_MAP_BOUNDS.minLon >= 20 && WOLF_MAP_BOUNDS.maxLon <= 42,
  "frame must stay within the Kenya → South Africa corridor",
);
assert.ok(WOLF_MAP_BOUNDS.maxLon - WOLF_MAP_BOUNDS.minLon <= 22, "frame must not span the whole continent");

const { width, height, padding } = WOLF_MAP_VIEWBOX;

// Every demo reserve must project to a real point inside the drawable frame.
for (const seed of WOLF_DEMO_RESERVE_SEEDS) {
  const point = projectWolfLonLat(seed.longitude, seed.latitude);
  assert.ok(
    point.x >= padding - 1 && point.x <= width - padding + 1,
    `${seed.name} longitude out of frame (x=${point.x})`,
  );
  assert.ok(
    point.y >= padding - 1 && point.y <= height - padding + 1,
    `${seed.name} latitude out of frame (y=${point.y})`,
  );
}

// Kenya sits near the top of the operational frame; South Africa near the bottom.
const kenya = WOLF_DEMO_RESERVE_SEEDS.filter((s) => s.country === "Kenya");
const southAfrica = WOLF_DEMO_RESERVE_SEEDS.filter((s) => s.country === "South Africa");
assert.equal(kenya.length, 1, "expected one Kenya demo reserve");
assert.equal(southAfrica.length, 2, "expected two South Africa demo reserves");

const kenyaY = projectWolfLonLat(kenya[0].longitude, kenya[0].latitude).y;
for (const sa of southAfrica) {
  const saY = projectWolfLonLat(sa.longitude, sa.latitude).y;
  assert.ok(kenyaY < saY, `Kenya reserve should render north of ${sa.name}`);
}

const usableHeight = height - padding * 2;
assert.ok(kenyaY <= padding + usableHeight * 0.28, "Kenya reserve should sit in the upper map band");
for (const sa of southAfrica) {
  const saY = projectWolfLonLat(sa.longitude, sa.latitude).y;
  assert.ok(saY >= padding + usableHeight * 0.55, `${sa.name} should sit in the lower map band`);
}

// GeoJSON → SVG path conversion produces real per-country geometry.
const sample: WolfMapFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "South Africa" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [16.45, -22.12],
            [32.95, -22.12],
            [32.95, -34.85],
            [16.45, -34.85],
            [16.45, -22.12],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "Madagascar" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [43.0, -12.0],
            [50.0, -12.0],
            [50.0, -25.0],
            [43.0, -25.0],
            [43.0, -12.0],
          ],
        ],
      },
    },
  ],
};
const layers = buildWolfMapLayers(sample);
assert.equal(layers.countries.length, 1);
assert.equal(layers.countries[0].name, "South Africa");
assert.ok(layers.countries[0].paths[0].startsWith("M "), "country ring should be an SVG path");

// Operational country filter must include Kenya and South Africa, exclude Madagascar.
assert.ok(WOLF_OPERATIONAL_COUNTRY_NAMES.has("Kenya"));
assert.ok(WOLF_OPERATIONAL_COUNTRY_NAMES.has("South Africa"));
assert.ok(!WOLF_OPERATIONAL_COUNTRY_NAMES.has("Madagascar"));

// Bundled geography should expose multiple corridor countries, not one merged blob.
const geoPath = path.join(
  process.cwd(),
  "public/geo/wolf/southern-east-africa-countries.geojson",
);
const bundled = JSON.parse(readFileSync(geoPath, "utf8")) as WolfMapFeatureCollection;
const bundledLayers = buildWolfMapLayers(bundled);
assert.ok(bundledLayers.countries.length >= 8, "expected multiple operational countries in corridor");
assert.ok(
  bundledLayers.countries.some((country) => country.name === "Kenya"),
  "Kenya must be present",
);
assert.ok(
  bundledLayers.countries.some((country) => country.name === "South Africa"),
  "South Africa must be present",
);
assert.ok(
  !bundledLayers.countries.some((country) => country.name === "Madagascar"),
  "Madagascar must be excluded from the operational map",
);

// Empty feature collections must not silently render a blank map.
const emptyLayers = buildWolfMapLayers({ type: "FeatureCollection", features: [] });
assert.equal(emptyLayers.countries.length, 0, "empty GeoJSON should produce no countries");

console.log("wolf-estate-map.check.ts — all assertions passed.");
