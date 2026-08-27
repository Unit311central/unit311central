"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Minus, Plus, RotateCcw } from "lucide-react";

import {
  WOLF_MAP_ATTRIBUTION,
  WOLF_MAP_VIEWBOX,
  loadWolfMapLayers,
  projectWolfLonLat,
  type WolfMapLayers,
} from "@/lib/wolf/africa-map-project";
import type { WolfReserveRecord } from "@/lib/wolf/central/types";

type WolfEstateMapProps = {
  reserves: WolfReserveRecord[];
  selectedReserveId: string | null;
  onSelectReserve: (reserve: WolfReserveRecord) => void;
};

/** View state: zoom factor plus pan offset (in base-viewBox units). */
type WolfMapView = { scale: number; x: number; y: number };

const DEFAULT_VIEW: WolfMapView = { scale: 1, x: 0, y: 0 };
const ZOOM_STEP = 0.6;
const MIN_SCALE = 1;
const MAX_SCALE = 6;
const DRAG_THRESHOLD = 3;

const BASE_W = WOLF_MAP_VIEWBOX.width;
const BASE_H = WOLF_MAP_VIEWBOX.height;
const MAX_PAN_X = BASE_W * 0.55;
const MAX_PAN_Y = BASE_H * 0.55;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Zoom and pan are expressed through the SVG viewBox rather than an element
 * transform. This keeps the whole map (geography + markers) in one coordinate
 * space, avoids compositing quirks with scaled groups, and lets marker glyphs
 * stay a constant on-screen size by dividing their radii by the zoom factor.
 */
function computeViewBox(view: WolfMapView): { x: number; y: number; w: number; h: number } {
  const w = BASE_W / view.scale;
  const h = BASE_H / view.scale;
  const x = (BASE_W - w) / 2 - view.x;
  const y = (BASE_H - h) / 2 - view.y;
  return { x, y, w, h };
}

export default function WolfEstateMap({
  reserves,
  selectedReserveId,
  onSelectReserve,
}: WolfEstateMapProps) {
  const [layers, setLayers] = useState<WolfMapLayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<WolfMapView>(DEFAULT_VIEW);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadWolfMapLayers()
      .then((loaded) => {
        if (!cancelled) {
          setLayers(loaded);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Map failed to load.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedReserve = useMemo(
    () => reserves.find((reserve) => reserve.id === selectedReserveId) ?? null,
    [reserves, selectedReserveId],
  );

  const markers = useMemo(
    () =>
      reserves.map((reserve) => ({
        reserve,
        point: projectWolfLonLat(reserve.longitude, reserve.latitude),
      })),
    [reserves],
  );

  const viewBox = computeViewBox(view);
  // Keep markers a constant on-screen size regardless of zoom.
  const glyph = 1 / view.scale;

  function zoomBy(delta: number) {
    setView((current) => ({
      ...current,
      scale: clamp(current.scale + delta, MIN_SCALE, MAX_SCALE),
    }));
  }

  function resetView() {
    setView(DEFAULT_VIEW);
  }

  const baseUnitsPerPixel = useCallback((scale: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return 1 / scale;
    const renderedScale = Math.min(rect.width / BASE_W, rect.height / BASE_H);
    return renderedScale > 0 ? 1 / (renderedScale * scale) : 1 / scale;
  }, []);

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: view.x,
      originY: view.y,
      moved: false,
    };
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const state = dragState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const dxPx = event.clientX - state.startX;
    const dyPx = event.clientY - state.startY;
    if (!state.moved && Math.hypot(dxPx, dyPx) < DRAG_THRESHOLD) return;
    if (!state.moved) {
      state.moved = true;
      svgRef.current?.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    const unitsPerPixel = baseUnitsPerPixel(view.scale);
    setView((current) => ({
      ...current,
      x: clamp(state.originX + dxPx * unitsPerPixel, -MAX_PAN_X, MAX_PAN_X),
      y: clamp(state.originY + dyPx * unitsPerPixel, -MAX_PAN_Y, MAX_PAN_Y),
    }));
  }

  function endDrag(event: React.PointerEvent<SVGSVGElement>) {
    const state = dragState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
    setDragging(false);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1210]">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
            WOLF Estate · Operational map
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">Kenya → South Africa</h3>
        </div>
        <div className="flex items-center rounded-lg border border-white/10 bg-black/30 p-0.5">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => zoomBy(ZOOM_STEP)}
            className="rounded-md p-1.5 text-white/60 hover:bg-white/5 hover:text-emerald-200"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => zoomBy(-ZOOM_STEP)}
            className="rounded-md p-1.5 text-white/60 hover:bg-white/5 hover:text-emerald-200"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Reset map view"
            onClick={resetView}
            className="rounded-md p-1.5 text-white/60 hover:bg-white/5 hover:text-emerald-200"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[420px] items-center justify-center text-white/50">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading Kenya → South Africa geography…
        </div>
      ) : error ? (
        <div className="flex h-[420px] items-center justify-center px-4 text-sm text-red-300/80">
          {error}
        </div>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x.toFixed(2)} ${viewBox.y.toFixed(2)} ${viewBox.w.toFixed(2)} ${viewBox.h.toFixed(2)}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full touch-none select-none"
          style={{ height: 520, cursor: dragging ? "grabbing" : "grab" }}
          role="img"
          aria-label="Operational geographic map of the Kenya to South Africa region showing WOLF demo reserves"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          <defs>
            <filter id="wolf-marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Ocean backdrop — oversized so it always fills the panned/zoomed viewBox. */}
          <rect x={-BASE_W} y={-BASE_H} width={BASE_W * 3} height={BASE_H * 3} fill="#081311" />

          {/* Geography layer — real Natural Earth country boundaries. */}
          {layers?.countries.map((country) => {
            const isSelectedCountry =
              selectedReserve != null &&
              country.name.toLowerCase() === selectedReserve.country.toLowerCase();
            return country.paths.map((path, index) => (
              <path
                key={`${country.name}-${index}`}
                d={path}
                fill={isSelectedCountry ? "#2f7355" : "#1f5137"}
                stroke={isSelectedCountry ? "#8ff0c4" : "#4a9b74"}
                strokeWidth={isSelectedCountry ? 2 : 1.1}
                strokeOpacity={isSelectedCountry ? 1 : 0.85}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                opacity={selectedReserve == null || isSelectedCountry ? 1 : 0.82}
              />
            ));
          })}

          {/* Marker layer — constant on-screen size via inverse-zoom scaling. */}
          {markers.map(({ reserve, point }) => {
            const selected = reserve.id === selectedReserveId;
            const attention = reserve.attentionStatus === "attention";
            const markerFill = attention ? "#f97316" : "#10b981";
            const markerStroke = attention ? "#fdba74" : "#6ee7b7";
            return (
              <g
                key={reserve.id}
                transform={`translate(${point.x.toFixed(2)}, ${point.y.toFixed(2)}) scale(${glyph.toFixed(4)})`}
                filter="url(#wolf-marker-shadow)"
                className="cursor-pointer"
                onClick={() => onSelectReserve(reserve)}
              >
                <circle r={22} fill="transparent" />
                <circle
                  r={selected ? 18 : 14}
                  fill={markerFill}
                  fillOpacity={0.18}
                  stroke={markerStroke}
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
                <circle
                  r={selected ? 11 : 8}
                  fill={markerFill}
                  stroke={selected ? "#ffffff" : markerStroke}
                  strokeWidth={selected ? 2.5 : 1.5}
                  opacity={0.98}
                />
                <circle r={2.5} fill="#ffffff" />
                {selected ? (
                  <g transform="translate(0, -22)" className="pointer-events-none">
                    <text
                      textAnchor="middle"
                      fill="#ecfdf5"
                      style={{ fontSize: 13, fontWeight: 700 }}
                    >
                      {reserve.name}
                    </text>
                    <text
                      y={13}
                      textAnchor="middle"
                      fill={attention ? "#fdba74" : "#6ee7b7"}
                      style={{ fontSize: 10.5, fontWeight: 600 }}
                    >
                      {reserve.country}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/45 px-2.5 py-1.5 text-[10px] text-white/55">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          Attention
        </span>
        <span className="text-white/30">·</span>
        <span>{reserves.length} demo deployments · drag to pan</span>
      </div>

      {!loading && !error ? (
        <p className="pointer-events-none absolute bottom-2 right-3 text-[9px] leading-snug text-white/25">
          {WOLF_MAP_ATTRIBUTION}
        </p>
      ) : null}
    </div>
  );
}
