"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { CrmConnection } from "@/lib/connections-data";

import MapTileLayers from "./MapTileLayers";

type LatLng = [number, number];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detailField(label: string, value: string) {
  if (!value.trim()) return "";
  return `
    <div style="margin-top:8px">
      <div style="font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(148,163,184,0.9)">${escapeHtml(label)}</div>
      <div style="margin-top:2px;font-size:12px;color:rgba(248,250,252,0.88)">${escapeHtml(value)}</div>
    </div>
  `;
}

function connectionDetailsHtml(connection: CrmConnection, compact = false) {
  const name = escapeHtml(connection.name);
  const role = escapeHtml(connection.role);
  const location = escapeHtml(`${connection.city}, ${connection.country}`);

  const fields = compact
    ? [
        connection.specialties ? detailField("Specialties", connection.specialties) : "",
        connection.countryExperience
          ? detailField("Country experience", connection.countryExperience)
          : "",
      ].join("")
    : [
        detailField("Specialties", connection.specialties),
        detailField("Background", connection.background),
        detailField("Country experience", connection.countryExperience),
      ].join("");

  return `
    <div style="min-width:${compact ? 200 : 220}px;max-width:280px;font-family:system-ui,sans-serif">
      <div style="font-size:14px;font-weight:600;color:#f8fafc">${name}</div>
      <div style="margin-top:2px;font-size:12px;color:#60a5fa">${role}</div>
      <div style="margin-top:4px;font-size:11px;color:rgba(148,163,184,0.95)">${location}</div>
      ${fields}
    </div>
  `;
}

function personIcon(active: boolean) {
  const bg = active ? "#38bdf8" : "#2563eb";
  const ring = active ? "0 0 0 3px rgba(56,189,248,0.45)" : "0 2px 8px rgba(0,0,0,0.35)";
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:9999px;background:${bg};border:2px solid rgba(255,255,255,0.95);box-shadow:${ring};display:flex;align-items:center;justify-content:center;cursor:pointer;">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function MapBoundsSync({ connections }: { connections: CrmConnection[] }) {
  const map = useMap();

  useEffect(() => {
    if (connections.length === 0) return;
    const bounds = L.latLngBounds(
      connections.map((entry) => [entry.latitude, entry.longitude] as LatLng),
    );
    map.fitBounds(bounds.pad(0.15), { animate: true, maxZoom: 4 });
  }, [map, connections]);

  return null;
}

function ConnectionMarkers({
  connections,
  selectedId,
  onSelect,
}: {
  connections: CrmConnection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    layerRef.current?.remove();
    markersRef.current.clear();
    const group = L.layerGroup();

    connections.forEach((connection) => {
      const active = connection.id === selectedId;
      const marker = L.marker([connection.latitude, connection.longitude], {
        icon: personIcon(active),
      });

      marker.bindPopup(connectionDetailsHtml(connection), {
        maxWidth: 320,
        minWidth: 220,
        className: "connections-map-popup",
        autoPan: true,
        closeButton: true,
      });

      marker.bindTooltip(connectionDetailsHtml(connection, true), {
        direction: "top",
        offset: [0, -16],
        opacity: 1,
        className: "connections-map-tooltip",
        sticky: true,
      });

      marker.on("click", () => {
        onSelect(connection.id);
        marker.openPopup();
        map.panTo(marker.getLatLng(), { animate: true });
      });

      markersRef.current.set(connection.id, marker);
      group.addLayer(marker);
    });

    group.addTo(map);
    layerRef.current = group;

    return () => {
      group.remove();
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, [map, connections, selectedId, onSelect]);

  useEffect(() => {
    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    marker.openPopup();
    map.panTo(marker.getLatLng(), { animate: true });
  }, [map, selectedId, connections]);

  return null;
}

type ConnectionsMapProps = {
  connections: CrmConnection[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function ConnectionsMap({ connections, selectedId, onSelect }: ConnectionsMapProps) {
  return (
    <div className="flight-path-map-shell flight-path-map-shell--satellite-texture relative overflow-hidden rounded-xl border border-white/10">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        scrollWheelZoom
        className="h-[min(52vh,480px)] w-full"
        style={{ background: "#1a2332" }}
      >
        <MapTileLayers style="satellite" flightPathMode />
        <MapBoundsSync connections={connections} />
        <ConnectionMarkers
          connections={connections}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </MapContainer>
    </div>
  );
}
