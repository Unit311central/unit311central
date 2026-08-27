/**
 * WOLF Estate geographic map projection utilities (client-safe, WOLF Central only).
 *
 * Follows the proven SAEC South Africa map approach: a plain equirectangular
 * projection of real Natural Earth country boundaries into an SVG viewBox, with
 * a scale/translate view transform for zoom and pan. WOLF-specific and isolated;
 * it does not import or modify any SAEC code.
 *
 * The default bounds frame the Kenya → South Africa operational region so the
 * first viewport naturally shows the WOLF demo reserves (one in Kenya, two in
 * South Africa) rather than the whole continent.
 */

/**
 * Kenya → South Africa operational corridor (WGS84).
 * Tight framing keeps Kenya near the top, South Africa at the bottom, and
 * excludes the wider continent (Madagascar, Horn of Africa, central Congo, etc.).
 */
export const WOLF_MAP_BOUNDS = {
  minLon: 22,
  maxLon: 40,
  minLat: -35.5,
  maxLat: 5.5,
};

/** Countries rendered on the WOLF operational map (Natural Earth names). */
export const WOLF_OPERATIONAL_COUNTRY_NAMES = new Set([
  "Kenya",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Burundi",
  "Malawi",
  "Zambia",
  "Mozambique",
  "Zimbabwe",
  "Botswana",
  "Namibia",
  "South Africa",
  "Lesotho",
  "eSwatini",
]);

/** Subtle alternating land tones — keeps country boundaries readable on dark ocean. */
export const WOLF_COUNTRY_FILL_PALETTE = [
  "#1a4634",
  "#1f523c",
  "#173a2b",
  "#224a38",
  "#1c4a36",
] as const;

export function wolfCountryFillColor(index: number, selected: boolean): string {
  if (selected) return "#2f7355";
  return WOLF_COUNTRY_FILL_PALETTE[index % WOLF_COUNTRY_FILL_PALETTE.length];
}

// Aspect ratio matches the bounds (lon 18° : lat 41°) to avoid distortion.
export const WOLF_MAP_VIEWBOX = {
  width: 540,
  height: 1240,
  padding: 30,
};

export type WolfMapPoint = { x: number; y: number };

export const WOLF_MAP_ATTRIBUTION =
  "Map geography: Natural Earth 110m (public domain). Administrative boundaries for demonstration.";

export const WOLF_MAP_GEO_URL = "/api/wolf/map-geography";

type LonLat = [number, number];
type MapPolygon = { type: "Polygon"; coordinates: LonLat[][] };
type MapMultiPolygon = { type: "MultiPolygon"; coordinates: LonLat[][][] };
type MapGeometry = MapPolygon | MapMultiPolygon;

export type WolfMapFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: MapGeometry;
    properties?: { name?: string } & Record<string, unknown>;
  }>;
};

/** One rendered country: its display name plus SVG path strings (one per ring). */
export type WolfMapCountry = {
  name: string;
  paths: string[];
};

export type WolfMapLayers = {
  countries: WolfMapCountry[];
};

export function projectWolfLonLat(
  longitude: number,
  latitude: number,
  view = WOLF_MAP_VIEWBOX,
): WolfMapPoint {
  const usableWidth = view.width - view.padding * 2;
  const usableHeight = view.height - view.padding * 2;
  const lonSpan = WOLF_MAP_BOUNDS.maxLon - WOLF_MAP_BOUNDS.minLon;
  const latSpan = WOLF_MAP_BOUNDS.maxLat - WOLF_MAP_BOUNDS.minLat;
  const x = view.padding + ((longitude - WOLF_MAP_BOUNDS.minLon) / lonSpan) * usableWidth;
  const y = view.padding + ((WOLF_MAP_BOUNDS.maxLat - latitude) / latSpan) * usableHeight;
  return { x, y };
}

function ringToPath(ring: LonLat[], project: (lon: number, lat: number) => WolfMapPoint): string {
  if (!ring.length) return "";
  const segments = ring.map((coord, index) => {
    const { x, y } = project(coord[0], coord[1]);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `${segments.join(" ")} Z`;
}

function geometryToPaths(
  geometry: MapGeometry,
  project: (lon: number, lat: number) => WolfMapPoint,
): string[] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map((ring) => ringToPath(ring, project));
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) =>
      polygon.map((ring) => ringToPath(ring, project)),
    );
  }
  return [];
}

export function buildWolfMapLayers(
  region: WolfMapFeatureCollection,
  project = projectWolfLonLat,
): WolfMapLayers {
  const countries = region.features
    .map((feature) => ({
      name: typeof feature.properties?.name === "string" ? feature.properties.name : "",
      paths: geometryToPaths(feature.geometry, project),
    }))
    .filter(
      (country) =>
        country.paths.length > 0 && WOLF_OPERATIONAL_COUNTRY_NAMES.has(country.name),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return { countries };
}

export async function loadWolfMapLayers(): Promise<WolfMapLayers> {
  const response = await fetch(WOLF_MAP_GEO_URL, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Failed to load WOLF region map geography.");
  }
  const region = (await response.json()) as WolfMapFeatureCollection;
  return buildWolfMapLayers(region);
}
