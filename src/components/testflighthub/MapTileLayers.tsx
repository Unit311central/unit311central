"use client";

import { TileLayer } from "react-leaflet";

import {
  OSM_HOT_TILE_URL,
  OSM_MAP_ATTRIBUTION,
  OSM_STANDARD_TILE_URL,
  SATELLITE_MAP_ATTRIBUTION,
  type MapTerrainStyle,
  URBAN_BASE_TILE_URL,
  URBAN_MAP_ATTRIBUTION,
} from "@/lib/map-tiles";

type MapTileLayersProps = {
  style: MapTerrainStyle;
  showAttribution?: boolean;
  /** Photorealistic stack tuned for the FPV live video feed. */
  videoMode?: boolean;
  /** Satellite imagery with relief texture for the flight path map. */
  flightPathMode?: boolean;
};

export default function MapTileLayers({
  style,
  showAttribution = true,
  videoMode = false,
  flightPathMode = false,
}: MapTileLayersProps) {
  if (flightPathMode) {
    return (
      <>
        <TileLayer
          attribution={showAttribution ? SATELLITE_MAP_ATTRIBUTION : undefined}
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={20}
        />
        <TileLayer
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          maxZoom={17}
          opacity={0.5}
        />
      </>
    );
  }

  if (videoMode) {
    return (
      <>
        <TileLayer
          attribution={showAttribution ? SATELLITE_MAP_ATTRIBUTION : undefined}
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={20}
        />
        {style === "urban" ? (
          <>
            <TileLayer
              attribution={showAttribution ? URBAN_MAP_ATTRIBUTION : undefined}
              url={URBAN_BASE_TILE_URL}
              maxZoom={20}
              opacity={0.44}
            />
            <TileLayer
              attribution={showAttribution ? OSM_MAP_ATTRIBUTION : undefined}
              url={OSM_STANDARD_TILE_URL}
              maxZoom={19}
              opacity={0.28}
            />
          </>
        ) : (
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            maxZoom={17}
            opacity={0.28}
          />
        )}
      </>
    );
  }

  if (style === "urban") {
    return (
      <>
        <TileLayer
          attribution={showAttribution ? URBAN_MAP_ATTRIBUTION : undefined}
          url={URBAN_BASE_TILE_URL}
          maxZoom={20}
        />
        <TileLayer
          attribution={showAttribution ? OSM_MAP_ATTRIBUTION : undefined}
          url={OSM_STANDARD_TILE_URL}
          maxZoom={19}
          opacity={0.32}
        />
        <TileLayer
          url={OSM_HOT_TILE_URL}
          maxZoom={19}
          opacity={0.16}
        />
      </>
    );
  }

  return (
    <>
      <TileLayer
        attribution={showAttribution ? SATELLITE_MAP_ATTRIBUTION : undefined}
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
      <TileLayer
        attribution={showAttribution ? OSM_MAP_ATTRIBUTION : undefined}
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
        opacity={0.42}
      />
    </>
  );
}
