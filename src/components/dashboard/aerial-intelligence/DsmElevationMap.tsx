"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { RasterTileConfig } from "@/lib/webodm-deliverables";
import { cn } from "@/lib/utils";

type DsmElevationMapProps = {
  config: RasterTileConfig;
  className?: string;
};

function MapBoundsSync({ config }: { config: RasterTileConfig }) {
  const map = useMap();
  const [west, south, east, north] = config.bounds;

  useEffect(() => {
    map.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      { padding: [24, 24] },
    );
  }, [map, west, south, east, north]);

  return null;
}

export default function DsmElevationMap({ config, className }: DsmElevationMapProps) {
  const [west, south, east, north] = config.bounds;
  const center: [number, number] = [(south + north) / 2, (west + east) / 2];

  return (
    <div className={cn("aerial-intel-map-shell aerial-intel-dsm-map h-full w-full", className)}>
      <MapContainer
        center={center}
        zoom={config.minZoom}
        minZoom={config.minZoom}
        maxZoom={config.maxZoom}
        className="h-full w-full"
        scrollWheelZoom
        zoomControl
        attributionControl={false}
      >
        <TileLayer
          url={config.tileUrlTemplate}
          minZoom={config.minZoom}
          maxZoom={config.maxZoom}
          bounds={[
            [south, west],
            [north, east],
          ]}
        />
        <MapBoundsSync config={config} />
      </MapContainer>
    </div>
  );
}
