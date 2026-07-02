export type MapTerrainStyle = "satellite" | "urban";

export const ORBIT_MAP_ZOOM = 16;

export const URBAN_MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const SATELLITE_MAP_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA';

export const OSM_MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Shared tile endpoints for urban map stacks. */
export const URBAN_BASE_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const OSM_STANDARD_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const OSM_HOT_TILE_URL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
