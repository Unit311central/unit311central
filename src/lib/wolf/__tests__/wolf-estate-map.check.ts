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

import {
  WOLF_MAP_BOUNDS,
  WOLF_MAP_VIEWBOX,
  buildWolfMapLayers,
  projectWolfLonLat,
  type WolfMapFeatureCollection,
} from "@/lib/wolf/africa-map-project";
import { WOLF_DEMO_RESERVE_SEEDS } from "@/lib/wolf/central/demo-seed";

// The frame must actually span Kenya (north, ~+5° lat) down through South
// Africa (south, ~-34° lat), not the whole continent.
assert.ok(WOLF_MAP_BOUNDS.maxLat >= 5, "frame must reach into Kenya");
assert.ok(WOLF_MAP_BOUNDS.minLat <= -34, "frame must reach the South Africa coast");
assert.ok(WOLF_MAP_BOUNDS.minLon <= 26 && WOLF_MAP_BOUNDS.maxLon >= 41, "frame must span reserve longitudes");

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

// Demo composition: exactly one Kenya reserve and two South Africa reserves.
const kenya = WOLF_DEMO_RESERVE_SEEDS.filter((s) => s.country === "Kenya");
const southAfrica = WOLF_DEMO_RESERVE_SEEDS.filter((s) => s.country === "South Africa");
assert.equal(kenya.length, 1, "expected one Kenya demo reserve");
assert.equal(southAfrica.length, 2, "expected two South Africa demo reserves");

// Kenya sits north of South Africa, so it must project higher (smaller y).
const kenyaY = projectWolfLonLat(kenya[0].longitude, kenya[0].latitude).y;
for (const sa of southAfrica) {
  const saY = projectWolfLonLat(sa.longitude, sa.latitude).y;
  assert.ok(kenyaY < saY, `Kenya reserve should render north of ${sa.name}`);
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
  ],
};
const layers = buildWolfMapLayers(sample);
assert.equal(layers.countries.length, 1);
assert.equal(layers.countries[0].name, "South Africa");
assert.ok(layers.countries[0].paths[0].startsWith("M "), "country ring should be an SVG path");

console.log("wolf-estate-map.check.ts — all assertions passed.");
