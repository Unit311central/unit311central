"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { MapPin, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

import {
  NORTHSTAR_OFFICE_MAP_BOUNDS,
  NORTHSTAR_OFFICE_MAP_MARKERS,
  NORTHSTAR_OFFICE_MAP_VIEW,
  type NorthstarOfficeMapMarker,
} from "@/lib/demo/northstar-office-map-data";
import { URBAN_MAP_ATTRIBUTION } from "@/lib/map-tiles";

const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function markerIcon(active: boolean, region: "UK" | "US") {
  const size = active ? 16 : 12;
  const fill = region === "UK" ? "#38bdf8" : "#fbbf24";
  const glow =
    region === "UK"
      ? active
        ? "0 0 16px rgba(56,189,248,0.95)"
        : "0 0 10px rgba(56,189,248,0.7)"
      : active
        ? "0 0 16px rgba(251,191,36,0.95)"
        : "0 0 10px rgba(251,191,36,0.7)";
  return L.divIcon({
    className: "northstar-office-marker",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:2px solid rgba(255,255,255,0.92);box-shadow:${glow};"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function TransatlanticViewport() {
  const map = useMap();

  useEffect(() => {
    const apply = () => {
      map.invalidateSize({ animate: false });
      map.setMaxBounds(NORTHSTAR_OFFICE_MAP_BOUNDS);
      map.setMinZoom(3);
      map.fitBounds(NORTHSTAR_OFFICE_MAP_BOUNDS, { padding: [24, 24], animate: false });
    };

    map.whenReady(() => {
      apply();
      window.setTimeout(apply, 80);
      window.setTimeout(apply, 250);
    });

    const onResize = () => map.invalidateSize({ animate: false });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map]);

  return null;
}

function OfficeMarkers({
  markers,
  activeId,
  onSelect,
}: {
  markers: NorthstarOfficeMapMarker[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    layerRef.current?.remove();
    markerRefs.current.clear();

    const group = L.layerGroup();
    markers.forEach((marker) => {
      const pin = L.marker([marker.lat, marker.lng], {
        icon: markerIcon(false, marker.region),
        riseOnHover: true,
        title: `${marker.city} · ${marker.country}`,
      });
      pin.on("click", () => onSelect(marker.id));
      group.addLayer(pin);
      markerRefs.current.set(marker.id, pin);
    });

    group.addTo(map);
    layerRef.current = group;

    return () => {
      group.remove();
      layerRef.current = null;
      markerRefs.current.clear();
    };
  }, [map, markers, onSelect]);

  useEffect(() => {
    markerRefs.current.forEach((pin, id) => {
      const marker = markers.find((row) => row.id === id);
      pin.setIcon(markerIcon(id === activeId, marker?.region ?? "UK"));
      pin.setZIndexOffset(id === activeId ? 1000 : 0);
    });
  }, [activeId, markers]);

  return null;
}

function OfficeCard({
  marker,
  onClose,
}: {
  marker: NorthstarOfficeMapMarker;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-[500] rounded-xl border border-sky-400/25 bg-[#07111f]/95 p-3 shadow-xl backdrop-blur sm:left-auto sm:right-3 sm:w-72">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
            {marker.region === "UK" ? "United Kingdom" : "United States"}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-white">{marker.city}</h3>
          <p className="text-xs text-white/55">{marker.employees} people on site</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Close office details"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/70">{marker.address}</p>
    </div>
  );
}

export default function NorthstarCorporateOfficeMap() {
  const markers = useMemo(() => NORTHSTAR_OFFICE_MAP_MARKERS, []);
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleMarker = useCallback((id: string) => {
    setActiveId((current) => (current === id ? null : id));
  }, []);

  const active = markers.find((marker) => marker.id === activeId) ?? null;

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#060d18]">
      <div className="absolute inset-x-0 top-0 z-[400] flex items-center justify-between gap-2 border-b border-white/10 bg-[#060d18]/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-sky-300" />
          <p className="text-sm font-semibold text-white">Global footprint</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            UK
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            US
          </span>
        </div>
      </div>

      <MapContainer
        center={NORTHSTAR_OFFICE_MAP_VIEW.center}
        zoom={NORTHSTAR_OFFICE_MAP_VIEW.zoom}
        className="h-full min-h-[280px] w-full"
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer url={CARTO_DARK_URL} attribution={URBAN_MAP_ATTRIBUTION} />
        <TransatlanticViewport />
        <OfficeMarkers markers={markers} activeId={activeId} onSelect={toggleMarker} />
      </MapContainer>

      {active ? <OfficeCard marker={active} onClose={() => setActiveId(null)} /> : null}
    </div>
  );
}
