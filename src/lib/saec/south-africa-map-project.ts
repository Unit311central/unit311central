/** South Africa map projection and GeoJSON → SVG path utilities (client-safe, no bundled geometry). */

/** South Africa bounding box (WGS84) — Natural Earth 50m extent. */
export const SA_MAP_BOUNDS = {
  minLon: 16.45,
  maxLon: 32.95,
  minLat: -34.85,
  maxLat: -22.12,
};

export const SA_MAP_VIEWBOX = {
  width: 820,
  height: 940,
  padding: 36,
};

export type SaMapPoint = { x: number; y: number };

export type SaMapViewTransform = {
  scale: number;
  x: number;
  y: number;
};

type LonLat = [number, number];
type MapPolygon = { type: "Polygon"; coordinates: LonLat[][] };
type MapMultiPolygon = { type: "MultiPolygon"; coordinates: LonLat[][][] };
type MapGeometry = MapPolygon | MapMultiPolygon;
export type SaMapFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{ type: "Feature"; geometry: MapGeometry; properties?: Record<string, unknown> }>;
};

export type SaMapLayers = {
  provincePaths: string[];
  countryPath: string;
};

export const SA_MAP_GEO_URLS = {
  provinces: "/api/saec/installations/map-geography?layer=provinces",
  country: "/api/saec/installations/map-geography?layer=country",
} as const;

export const SA_MAP_ATTRIBUTION =
  "Map geography: Natural Earth 50m (public domain). Administrative boundaries for demonstration.";

export function projectSouthAfricaLonLat(
  longitude: number,
  latitude: number,
  view = SA_MAP_VIEWBOX,
): SaMapPoint {
  const usableWidth = view.width - view.padding * 2;
  const usableHeight = view.height - view.padding * 2;
  const lonSpan = SA_MAP_BOUNDS.maxLon - SA_MAP_BOUNDS.minLon;
  const latSpan = SA_MAP_BOUNDS.maxLat - SA_MAP_BOUNDS.minLat;
  const x =
    view.padding + ((longitude - SA_MAP_BOUNDS.minLon) / lonSpan) * usableWidth;
  const y =
    view.padding + ((SA_MAP_BOUNDS.maxLat - latitude) / latSpan) * usableHeight;
  return { x, y };
}

function ringToPath(ring: LonLat[], project: (lon: number, lat: number) => SaMapPoint): string {
  if (!ring.length) return "";
  const segments = ring.map((coord, index) => {
    const { x, y } = project(coord[0], coord[1]);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return `${segments.join(" ")} Z`;
}

function geometryToPaths(
  geometry: MapGeometry,
  project: (lon: number, lat: number) => SaMapPoint,
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

export function buildSouthAfricaMapLayers(
  provinces: SaMapFeatureCollection,
  country: SaMapFeatureCollection,
  project = projectSouthAfricaLonLat,
): SaMapLayers {
  const provincePaths = provinces.features.flatMap((feature) =>
    geometryToPaths(feature.geometry, project),
  );
  const countryPaths = country.features.flatMap((feature) =>
    geometryToPaths(feature.geometry, project),
  );
  return {
    provincePaths,
    countryPath: countryPaths[0] ?? "",
  };
}

export async function loadSouthAfricaMapLayers(): Promise<SaMapLayers> {
  const [provincesRes, countryRes] = await Promise.all([
    fetch(SA_MAP_GEO_URLS.provinces),
    fetch(SA_MAP_GEO_URLS.country),
  ]);
  if (!provincesRes.ok || !countryRes.ok) {
    throw new Error("Failed to load South Africa map geography.");
  }
  const provinces = (await provincesRes.json()) as SaMapFeatureCollection;
  const country = (await countryRes.json()) as SaMapFeatureCollection;
  return buildSouthAfricaMapLayers(provinces, country);
}

export function applyMapViewTransform(
  point: SaMapPoint,
  transform: SaMapViewTransform,
  center: SaMapPoint,
): SaMapPoint {
  return {
    x: center.x + (point.x - center.x) * transform.scale + transform.x,
    y: center.y + (point.y - center.y) * transform.scale + transform.y,
  };
}

export const SA_MAP_DEFAULT_TRANSFORM: SaMapViewTransform = { scale: 1, x: 0, y: 0 };

export const SA_MAP_CENTER: SaMapPoint = {
  x: SA_MAP_VIEWBOX.width / 2,
  y: SA_MAP_VIEWBOX.height / 2,
};
