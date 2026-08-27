/** Africa map projection utilities for WOLF Estate (client-safe). */

export const AFRICA_MAP_BOUNDS = {
  minLon: -18,
  maxLon: 51,
  minLat: -35,
  maxLat: 37,
};

export const AFRICA_MAP_VIEWBOX = {
  width: 720,
  height: 640,
  padding: 28,
};

export type AfricaMapPoint = { x: number; y: number };

export type AfricaMapViewTransform = {
  scale: number;
  x: number;
  y: number;
};

export const AFRICA_MAP_DEFAULT_TRANSFORM: AfricaMapViewTransform = {
  scale: 1,
  x: 0,
  y: 0,
};

export const AFRICA_MAP_ATTRIBUTION =
  "Map geography: Natural Earth 50m (public domain). Administrative boundaries for demonstration.";

export const AFRICA_MAP_GEO_URL = "/api/wolf/map-geography";

type LonLat = [number, number];
type MapPolygon = { type: "Polygon"; coordinates: LonLat[][] };
type MapMultiPolygon = { type: "MultiPolygon"; coordinates: LonLat[][][] };
type MapGeometry = MapPolygon | MapMultiPolygon;

export type AfricaMapFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{ type: "Feature"; geometry: MapGeometry; properties?: Record<string, unknown> }>;
};

export type AfricaMapLayers = {
  continentPath: string;
};

export function projectAfricaLonLat(
  longitude: number,
  latitude: number,
  view = AFRICA_MAP_VIEWBOX,
): AfricaMapPoint {
  const usableWidth = view.width - view.padding * 2;
  const usableHeight = view.height - view.padding * 2;
  const lonSpan = AFRICA_MAP_BOUNDS.maxLon - AFRICA_MAP_BOUNDS.minLon;
  const latSpan = AFRICA_MAP_BOUNDS.maxLat - AFRICA_MAP_BOUNDS.minLat;
  const x = view.padding + ((longitude - AFRICA_MAP_BOUNDS.minLon) / lonSpan) * usableWidth;
  const y = view.padding + ((AFRICA_MAP_BOUNDS.maxLat - latitude) / latSpan) * usableHeight;
  return { x, y };
}

function ringToPath(ring: LonLat[], project: (lon: number, lat: number) => AfricaMapPoint): string {
  if (!ring.length) return "";
  const segments = ring.map((coord, index) => {
    const { x, y } = project(coord[0], coord[1]);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `${segments.join(" ")} Z`;
}

function geometryToPaths(
  geometry: MapGeometry,
  project: (lon: number, lat: number) => AfricaMapPoint,
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

export function buildAfricaMapLayers(
  continent: AfricaMapFeatureCollection,
  project = projectAfricaLonLat,
): AfricaMapLayers {
  const paths = continent.features.flatMap((feature) => geometryToPaths(feature.geometry, project));
  return {
    continentPath: paths.join(" "),
  };
}

export async function loadAfricaMapLayers(): Promise<AfricaMapLayers> {
  const response = await fetch(AFRICA_MAP_GEO_URL, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error("Failed to load Africa map geography.");
  }
  const continent = (await response.json()) as AfricaMapFeatureCollection;
  return buildAfricaMapLayers(continent);
}

export function applyMapViewTransform(
  transform: AfricaMapViewTransform,
  point: AfricaMapPoint,
): AfricaMapPoint {
  return {
    x: point.x * transform.scale + transform.x,
    y: point.y * transform.scale + transform.y,
  };
}
