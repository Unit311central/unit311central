"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

import {
  NORTHSTAR_OFFICE_MAP_MARKERS,
  NORTHSTAR_UK_MAP_BOUNDS,
  NORTHSTAR_US_MAP_BOUNDS,
  type NorthstarOfficeMapMarker,
} from "@/lib/demo/northstar-office-map-data";
import { URBAN_MAP_ATTRIBUTION } from "@/lib/map-tiles";
import { cn } from "@/lib/utils";

const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function markerIcon(active: boolean, tone: "uk" | "us") {
  const size = active ? 14 : 11;
  const fill = tone === "uk" ? "#38bdf8" : "#fbbf24";
  const glow =
    tone === "uk"
      ? active
        ? "0 0 14px rgba(56,189,248,0.95)"
        : "0 0 8px rgba(56,189,248,0.75)"
      : active
        ? "0 0 14px rgba(251,191,36,0.95)"
        : "0 0 8px rgba(251,191,36,0.75)";
  return L.divIcon({
    className: "northstar-office-marker",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:2px solid rgba(255,255,255,0.92);box-shadow:${glow};"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function LockRegionView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    const apply = () => {
      map.invalidateSize({ animate: false });
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      map.setMaxBounds(bounds);
      map.fitBounds(bounds, { padding: [16, 16], animate: false });
    };

    map.whenReady(() => {
      apply();
      window.setTimeout(apply, 80);
      window.setTimeout(apply, 250);
    });

    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map, bounds]);

  return null;
}

function OfficeMarkers({
  markers,
  tone,
  hoveredId,
  onHover,
}: {
  markers: NorthstarOfficeMapMarker[];
  tone: "uk" | "us";
  hoveredId: string | null;
  onHover: (id: string | null) => void;
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
        icon: markerIcon(false, tone),
        riseOnHover: true,
        title: marker.city,
      });
      pin.on("mouseover", () => onHover(marker.id));
      pin.on("mouseout", () => onHover(null));
      pin.on("focus", () => onHover(marker.id));
      pin.on("blur", () => onHover(null));
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
  }, [map, markers, onHover, tone]);

  useEffect(() => {
    markerRefs.current.forEach((pin, id) => {
      pin.setIcon(markerIcon(id === hoveredId, tone));
      pin.setZIndexOffset(id === hoveredId ? 1000 : 0);
    });
  }, [hoveredId, markers, tone]);

  return null;
}

function HoverTooltip({ marker }: { marker: NorthstarOfficeMapMarker }) {
  return (
    <div className="pointer-events-none absolute left-3 right-3 top-3 z-[500] rounded-xl border border-white/15 bg-[#07111f]/95 p-3 shadow-xl backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
        {marker.city} · {marker.country}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{marker.employees} people on site</p>
      <p className="mt-1 text-xs leading-relaxed text-white/65">{marker.address}</p>
    </div>
  );
}

function RegionMapPanel({
  label,
  bounds,
  markers,
  tone,
  hoveredId,
  onHover,
  className,
}: {
  label: string;
  bounds: L.LatLngBoundsExpression;
  markers: NorthstarOfficeMapMarker[];
  tone: "uk" | "us";
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  className?: string;
}) {
  const active = markers.find((marker) => marker.id === hoveredId) ?? null;
  const center = markers.length
    ? ([
        markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length,
        markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length,
      ] as [number, number])
    : ([54, -2] as [number, number]);

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      <div className="border-b border-white/8 px-3 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          {label}
        </p>
      </div>
      <div className="relative min-h-0 flex-1">
        {active ? <HoverTooltip marker={active} /> : null}
        <MapContainer
          center={center}
          zoom={tone === "uk" ? 6 : 4}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
        >
          <TileLayer url={CARTO_DARK_URL} attribution={URBAN_MAP_ATTRIBUTION} />
          <LockRegionView bounds={bounds} />
          <OfficeMarkers
            markers={markers}
            tone={tone}
            hoveredId={hoveredId}
            onHover={onHover}
          />
        </MapContainer>
      </div>
    </div>
  );
}

export default function NorthstarCorporateOfficeMap() {
  const ukMarkers = NORTHSTAR_OFFICE_MAP_MARKERS.filter((marker) => marker.region === "UK");
  const usMarkers = NORTHSTAR_OFFICE_MAP_MARKERS.filter((marker) => marker.region === "US");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const onHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#060d18] lg:max-h-[calc(100vh-11rem)]">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <MapPin className="h-4 w-4 text-sky-300" />
        <p className="text-sm font-semibold text-white">Office map</p>
        <p className="ml-auto text-[10px] text-white/40">Hover a pin for details</p>
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-2">
        <RegionMapPanel
          label="United Kingdom"
          bounds={NORTHSTAR_UK_MAP_BOUNDS}
          markers={ukMarkers}
          tone="uk"
          hoveredId={hoveredId}
          onHover={onHover}
          className="border-b border-white/10"
        />
        <RegionMapPanel
          label="United States"
          bounds={NORTHSTAR_US_MAP_BOUNDS}
          markers={usMarkers}
          tone="us"
          hoveredId={hoveredId}
          onHover={onHover}
        />
      </div>
    </div>
  );
}
