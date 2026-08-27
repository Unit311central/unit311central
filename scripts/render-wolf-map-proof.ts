/**
 * Render a standalone SVG proof of WOLF map geography + demo markers.
 * Run: npx tsx scripts/render-wolf-map-proof.ts
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  buildWolfMapLayers,
  projectWolfLonLat,
  WOLF_MAP_VIEWBOX,
  wolfCountryFillColor,
  type WolfMapFeatureCollection,
} from "@/lib/wolf/africa-map-project";
import { WOLF_DEMO_RESERVE_SEEDS } from "@/lib/wolf/central/demo-seed";

const geoPath = path.join(process.cwd(), "public/geo/wolf/southern-east-africa-countries.geojson");
const bundled = JSON.parse(readFileSync(geoPath, "utf8")) as WolfMapFeatureCollection;
const layers = buildWolfMapLayers(bundled);

const { width, height } = WOLF_MAP_VIEWBOX;
const paths = layers.countries
  .flatMap((country, countryIndex) =>
    country.paths.map(
      (d) =>
        `<path d="${d}" fill="${wolfCountryFillColor(countryIndex, false)}" stroke="#6bc49a" stroke-width="1.35" />`,
    ),
  )
  .join("\n");
const markers = WOLF_DEMO_RESERVE_SEEDS.map((seed) => {
  const point = projectWolfLonLat(seed.longitude, seed.latitude);
  return `<g><circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="10" fill="#10b981" stroke="#fff" stroke-width="2" /><text x="${point.x.toFixed(2)}" y="${(point.y - 14).toFixed(2)}" text-anchor="middle" fill="#ecfdf5" font-size="12" font-weight="700">${seed.name}</text></g>`;
}).join("\n");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#081311" />
  ${paths}
  ${markers}
</svg>`;

const artifactDir = "/opt/cursor/artifacts";
mkdirSync(artifactDir, { recursive: true });
const outPath = path.join(artifactDir, "wolf-estate-map-geography-proof.svg");
writeFileSync(outPath, svg);
console.log(`Wrote ${outPath} (${layers.countries.length} countries, ${WOLF_DEMO_RESERVE_SEEDS.length} markers)`);
