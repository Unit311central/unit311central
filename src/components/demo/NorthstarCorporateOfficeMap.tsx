"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

import {
  NORTHSTAR_OFFICE_MAP_MARKERS,
  type NorthstarOfficeMapMarker,
} from "@/lib/demo/northstar-office-map-data";
import { cn } from "@/lib/utils";

/** Normalised pin positions on simplified regional map silhouettes. */
const UK_PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  "nst-office-man": { x: 118, y: 148 },
  "nst-office-bri": { x: 102, y: 188 },
};

const US_PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  "nst-office-aus": { x: 198, y: 168 },
};

function HoverTooltip({ marker }: { marker: NorthstarOfficeMapMarker }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-20 w-[min(18rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-xl border border-white/15 bg-[#07111f]/95 p-3 shadow-xl backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
        {marker.city} · {marker.country}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{marker.employees} people on site</p>
      <p className="mt-1 text-xs leading-relaxed text-white/65">{marker.address}</p>
    </div>
  );
}

function MapPinMarker({
  marker,
  x,
  y,
  tone,
  onHover,
}: {
  marker: NorthstarOfficeMapMarker;
  x: number;
  y: number;
  tone: "uk" | "us";
  onHover: (marker: NorthstarOfficeMapMarker | null) => void;
}) {
  const fill = tone === "uk" ? "#38bdf8" : "#fbbf24";
  const glow = tone === "uk" ? "rgba(56,189,248,0.55)" : "rgba(251,191,36,0.55)";

  return (
    <g
      className="cursor-pointer"
      onMouseEnter={() => onHover(marker)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(marker)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      role="button"
      aria-label={`${marker.city} office`}
    >
      <circle cx={x} cy={y} r={14} fill={glow} opacity={0.35} />
      <circle cx={x} cy={y} r={5.5} fill={fill} stroke="rgba(255,255,255,0.92)" strokeWidth={2} />
      <text
        x={x}
        y={y + 18}
        textAnchor="middle"
        className="fill-white/80 text-[9px] font-semibold"
        style={{ fontSize: 9 }}
      >
        {marker.city}
      </text>
    </g>
  );
}

function UkMapPanel({
  markers,
  hoveredId,
  onHover,
}: {
  markers: NorthstarOfficeMapMarker[];
  hoveredId: string | null;
  onHover: (marker: NorthstarOfficeMapMarker | null) => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col border-b border-white/10">
      <div className="border-b border-white/8 px-4 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          United Kingdom
        </p>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-[#08111d] p-3">
        {hoveredId && markers.some((marker) => marker.id === hoveredId) ? (
          <HoverTooltip marker={markers.find((marker) => marker.id === hoveredId)!} />
        ) : null}
        <svg viewBox="0 0 200 260" className="h-full max-h-full w-full max-w-[220px]" aria-hidden>
          <rect width="200" height="260" fill="#08111d" />
          <path
            d="M118 28 C132 24 148 34 154 52 C162 72 156 92 148 108 C158 124 164 142 158 162 C150 186 132 204 112 214 C96 222 78 218 68 204 C58 188 62 168 72 152 C64 136 58 118 64 98 C70 78 84 62 102 52 C108 44 112 34 118 28 Z"
            fill="#1a3a5c"
            stroke="#2d5f8a"
            strokeWidth="1.5"
          />
          {markers.map((marker) => {
            const pos = UK_PIN_POSITIONS[marker.id];
            if (!pos) return null;
            return (
              <MapPinMarker
                key={marker.id}
                marker={marker}
                x={pos.x}
                y={pos.y}
                tone="uk"
                onHover={onHover}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function UsMapPanel({
  markers,
  hoveredId,
  onHover,
}: {
  markers: NorthstarOfficeMapMarker[];
  hoveredId: string | null;
  onHover: (marker: NorthstarOfficeMapMarker | null) => void;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <div className="border-b border-white/8 px-4 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          United States
        </p>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-[#08111d] p-3">
        {hoveredId && markers.some((marker) => marker.id === hoveredId) ? (
          <HoverTooltip marker={markers.find((marker) => marker.id === hoveredId)!} />
        ) : null}
        <svg viewBox="0 0 400 240" className="h-full max-h-full w-full max-w-[360px]" aria-hidden>
          <rect width="400" height="240" fill="#08111d" />
          <path
            d="M42 58 L118 42 L188 48 L248 38 L318 52 L358 78 L372 118 L364 158 L338 188 L288 202 L228 196 L168 204 L108 192 L58 168 L34 128 L28 88 Z"
            fill="#3d3520"
            stroke="#8b7340"
            strokeWidth="1.5"
          />
          <path
            d="M318 52 L338 44 L352 58 L348 78 L328 72 Z"
            fill="#3d3520"
            stroke="#8b7340"
            strokeWidth="1.5"
          />
          {markers.map((marker) => {
            const pos = US_PIN_POSITIONS[marker.id];
            if (!pos) return null;
            return (
              <MapPinMarker
                key={marker.id}
                marker={marker}
                x={pos.x}
                y={pos.y}
                tone="us"
                onHover={onHover}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function NorthstarCorporateOfficeMap() {
  const ukMarkers = NORTHSTAR_OFFICE_MAP_MARKERS.filter((marker) => marker.region === "UK");
  const usMarkers = NORTHSTAR_OFFICE_MAP_MARKERS.filter((marker) => marker.region === "US");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const onHover = (marker: NorthstarOfficeMapMarker | null) => {
    setHoveredId(marker?.id ?? null);
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#060d18]",
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <MapPin className="h-4 w-4 text-sky-300" />
        <p className="text-sm font-semibold text-white">Office map</p>
        <p className="ml-auto text-[10px] text-white/40">Hover a pin for details</p>
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-2">
        <UkMapPanel markers={ukMarkers} hoveredId={hoveredId} onHover={onHover} />
        <UsMapPanel markers={usMarkers} hoveredId={hoveredId} onHover={onHover} />
      </div>
    </div>
  );
}
