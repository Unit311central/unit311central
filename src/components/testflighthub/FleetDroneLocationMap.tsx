"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import MapTileLayers from "./MapTileLayers";

type LatLng = [number, number];

const droneIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:2px solid #e0f2fe;box-shadow:0 0 12px rgba(37,99,235,0.9);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapViewSync({ position }: { position: LatLng }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 15, { animate: false });
  }, [map, position]);

  return null;
}

function DroneMarker({ position }: { position: LatLng }) {
  const map = useMap();

  useEffect(() => {
    const marker = L.marker(position, { icon: droneIcon }).addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, position]);

  return null;
}

type FleetDroneLocationMapProps = {
  latitude: number;
  longitude: number;
  label: string;
  live?: boolean;
};

export default function FleetDroneLocationMap({
  latitude,
  longitude,
  label,
  live = false,
}: FleetDroneLocationMapProps) {
  const position: LatLng = [latitude, longitude];

  return (
    <div className="flight-path-map-shell relative overflow-hidden rounded-xl border border-white/10">
      <div className="absolute left-2 top-2 z-[500] rounded-md border border-white/10 bg-[#0b1524]/90 px-2 py-1 text-[10px] font-medium text-white/75 backdrop-blur-sm">
        FlightHub 2 · {live ? "Live OSD" : "Simulated OSD"}
      </div>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="h-[168px] w-full"
        style={{ background: "#3d4f3a" }}
      >
        <MapTileLayers style="satellite" />
        <MapViewSync position={position} />
        <DroneMarker position={position} />
      </MapContainer>
      <p className="border-t border-white/10 bg-[#0b1524]/70 px-2.5 py-2 text-[11px] leading-snug text-white/60">
        {label}
      </p>
    </div>
  );
}
