"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { SectorOrganization } from "@/lib/sector-data";

import MapTileLayers from "./MapTileLayers";

type LatLng = [number, number];

function rankIcon(rank: number) {
  const hue = rank <= 3 ? 38 : 210;
  const saturation = rank <= 3 ? 92 : 78;
  const size = rank <= 3 ? 16 : 13;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:hsl(${hue},${saturation}%,48%);border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 10px hsla(${hue},${saturation}%,48%,0.85);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;">${rank}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapBoundsSync({ organizations }: { organizations: SectorOrganization[] }) {
  const map = useMap();

  useEffect(() => {
    if (organizations.length === 0) return;
    const bounds = L.latLngBounds(
      organizations.map((org) => [org.latitude, org.longitude] as LatLng),
    );
    map.fitBounds(bounds.pad(0.18), { animate: true, maxZoom: 10 });
  }, [map, organizations]);

  return null;
}

function OrganizationMarkers({ organizations }: { organizations: SectorOrganization[] }) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    layerRef.current?.remove();
    const group = L.layerGroup();

    organizations.forEach((org) => {
      const marker = L.marker([org.latitude, org.longitude], { icon: rankIcon(org.rank) });
      marker.bindPopup(
        `<strong>${org.name}</strong><br/>${org.detail}<br/><span style="opacity:0.75">${org.droneUse}</span>`,
      );
      group.addLayer(marker);
    });

    group.addTo(map);
    layerRef.current = group;

    return () => {
      group.remove();
      layerRef.current = null;
    };
  }, [map, organizations]);

  return null;
}

type SectorSitesMapProps = {
  organizations: SectorOrganization[];
  center: LatLng;
  zoom: number;
  compact?: boolean;
};

export default function SectorSitesMap({
  organizations,
  center,
  zoom,
  compact = false,
}: SectorSitesMapProps) {
  return (
    <div className="flight-path-map-shell flight-path-map-shell--satellite-texture relative overflow-hidden rounded-xl border border-white/10">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={!compact}
        dragging={!compact}
        className={compact ? "h-[220px] w-full" : "h-[min(48vh,420px)] w-full"}
        style={{ background: "#2f3d2c" }}
      >
        <MapTileLayers style="satellite" flightPathMode />
        <MapBoundsSync organizations={organizations} />
        <OrganizationMarkers organizations={organizations} />
      </MapContainer>
    </div>
  );
}
