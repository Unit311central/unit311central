"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus, RotateCcw } from "lucide-react";

import {
  SA_MAP_ATTRIBUTION,
  SA_MAP_CENTER,
  SA_MAP_DEFAULT_TRANSFORM,
  SA_MAP_VIEWBOX,
  applyMapViewTransform,
  loadSouthAfricaMapLayers,
  projectSouthAfricaLonLat,
  type SaMapLayers,
  type SaMapViewTransform,
} from "@/lib/saec/south-africa-map-project";
import type { SaecCityAggregate, SaecInstallationAssetType } from "@/lib/saec/installations-types";
import {
  cityStatusSegments,
  cityStatusStrokeColor,
  dominantCityStatus,
  type CityStatusSegment,
} from "@/lib/saec/installations-map-status";
import { cn } from "@/lib/utils";

type SaecSouthAfricaMapProps = {
  cities: SaecCityAggregate[];
  selectedCityId: string | null;
  assetType: SaecInstallationAssetType;
  onSelectCity: (cityId: string) => void;
};

const ZOOM_STEP = 0.18;
const MIN_SCALE = 0.85;
const MAX_SCALE = 2.2;

function assetTypeLabel(assetType: SaecInstallationAssetType): string {
  return assetType === "elevator" ? "Elevators" : "Escalators";
}

function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  if (endAngle - startAngle >= 360) {
    return [
      `M ${cx} ${cy - outerR}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR}`,
      `M ${cx} ${cy - innerR}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx + 0.01} ${cy - innerR}`,
      "Z",
    ].join(" ");
  }
  const outerStart = polar(cx, cy, outerR, endAngle);
  const outerEnd = polar(cx, cy, outerR, startAngle);
  const innerStart = polar(cx, cy, innerR, startAngle);
  const innerEnd = polar(cx, cy, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function CityStatusDonut({
  cx,
  cy,
  segments,
  selected,
  dominant,
}: {
  cx: number;
  cy: number;
  segments: CityStatusSegment[];
  selected: boolean;
  dominant: CityStatusSegment["key"];
}) {
  const outerR = selected ? 18 : 16;
  const innerR = selected ? 10 : 9;
  const total = segments.reduce((sum, row) => sum + row.value, 0);
  let angle = 0;

  return (
    <g>
      {segments.map((segment) => {
        const sweep = total > 0 ? (segment.value / total) * 360 : 0;
        const start = angle;
        const end = angle + sweep;
        angle = end;
        if (sweep <= 0) return null;
        return (
          <path
            key={segment.key}
            d={donutSegmentPath(cx, cy, outerR, innerR, start, end)}
            fill={segment.color}
            className="pointer-events-none"
            opacity={0.95}
          />
        );
      })}
      <circle
        r={innerR - 1}
        fill="#0b1524"
        className="pointer-events-none"
      />
      <circle
        r={outerR + 1}
        fill="none"
        stroke={cityStatusStrokeColor(dominant)}
        strokeWidth={selected ? 2.5 : 1.5}
        className="pointer-events-none"
        opacity={0.9}
      />
    </g>
  );
}

export default function SaecSouthAfricaMap({
  cities,
  selectedCityId,
  assetType,
  onSelectCity,
}: SaecSouthAfricaMapProps) {
  const [transform, setTransform] = useState<SaMapViewTransform>(SA_MAP_DEFAULT_TRANSFORM);
  const [mapLayers, setMapLayers] = useState<SaMapLayers | null>(null);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSouthAfricaMapLayers()
      .then((layers) => {
        if (!cancelled) setMapLayers(layers);
      })
      .catch((error) => {
        if (!cancelled) {
          setMapLoadError(
            error instanceof Error ? error.message : "Failed to load map geography.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markerBadge =
    assetType === "elevator"
      ? "bg-cyan-500/20 text-cyan-100 border-cyan-400/30"
      : "bg-amber-500/20 text-amber-100 border-amber-400/30";

  const cityMarkers = useMemo(
    () =>
      cities
        .filter((city) => city.total > 0)
        .map((city) => {
          const point = projectSouthAfricaLonLat(city.longitude, city.latitude);
          const projected = applyMapViewTransform(point, transform, SA_MAP_CENTER);
          return {
            city,
            point: projected,
            labelOffsetX: city.labelOffsetX ?? 0,
            labelOffsetY: city.labelOffsetY ?? 0,
          };
        }),
    [cities, transform],
  );

  function zoomBy(delta: number) {
    setTransform((current) => ({
      ...current,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale + delta)),
    }));
  }

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0a1628]">
      <div className="border-b border-white/8 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/85">
              OmniTransit Installation Footprint
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">South Africa</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                markerBadge,
              )}
            >
              {assetTypeLabel(assetType)}
            </span>
            <div className="flex items-center rounded-lg border border-white/10 bg-[#0b1524] p-0.5">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => zoomBy(ZOOM_STEP)}
                className="rounded-md p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => zoomBy(-ZOOM_STEP)}
                className="rounded-md p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Reset map view"
                onClick={() => setTransform(SA_MAP_DEFAULT_TRANSFORM)}
                className="rounded-md p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-white/55">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Offline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Maintenance Due
          </span>
          <span className="text-white/30">·</span>
          <span>Marker colours show online, offline, and maintenance mix per city</span>
        </div>
      </div>

      <div className="relative px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
        {mapLoadError && (
          <div className="mb-3 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {mapLoadError}
          </div>
        )}

        {!mapLayers && !mapLoadError && (
          <div className="flex min-h-[220px] items-center justify-center text-sm text-white/45">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading South Africa geography…
          </div>
        )}

        {mapLayers && (
          <div className="mx-auto w-full" style={{ height: "min(48vh, 420px)" }}>
            <svg
              viewBox={`0 0 ${SA_MAP_VIEWBOX.width} ${SA_MAP_VIEWBOX.height}`}
              preserveAspectRatio="xMidYMid meet"
              width="100%"
              height="100%"
              role="img"
              aria-label="Geographic map of South Africa showing OmniTransit installation clusters"
            >
              <defs>
                <linearGradient id="saec-ocean-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0a1628" />
                  <stop offset="100%" stopColor="#061018" />
                </linearGradient>
                <linearGradient id="saec-land-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d4dcc8" />
                  <stop offset="55%" stopColor="#c5d4bc" />
                  <stop offset="100%" stopColor="#b8c9ae" />
                </linearGradient>
                <filter id="saec-marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.35" />
                </filter>
              </defs>

              <rect
                x="0"
                y="0"
                width={SA_MAP_VIEWBOX.width}
                height={SA_MAP_VIEWBOX.height}
                fill="url(#saec-ocean-fill)"
              />

              <g>
                {mapLayers.provincePaths.map((path, index) => (
                  <path
                    key={`province-${index}`}
                    d={path}
                    fill="url(#saec-land-fill)"
                    stroke="rgba(90, 108, 82, 0.55)"
                    strokeWidth={0.9}
                    strokeLinejoin="round"
                  />
                ))}
                {mapLayers.countryPath && (
                  <path
                    d={mapLayers.countryPath}
                    fill="none"
                    stroke="rgba(70, 88, 68, 0.85)"
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                  />
                )}
              </g>

              {cityMarkers.map(({ city, point, labelOffsetX, labelOffsetY }) => {
                const selected = city.cityId === selectedCityId;
                const hitRadius = 28;
                const segments = cityStatusSegments(city);
                const dominant = dominantCityStatus(city);
                return (
                  <g
                    key={city.cityId}
                    transform={`translate(${point.x}, ${point.y})`}
                    filter="url(#saec-marker-shadow)"
                  >
                    <circle
                      r={hitRadius}
                      fill="transparent"
                      className="cursor-pointer"
                      onClick={() => onSelectCity(city.cityId)}
                    />
                    <CityStatusDonut
                      cx={0}
                      cy={0}
                      segments={segments}
                      selected={selected}
                      dominant={dominant}
                    />
                    <text
                      y={1}
                      textAnchor="middle"
                      fill="#ffffff"
                      className="pointer-events-none"
                      style={{ fontSize: 10, fontWeight: 700 }}
                    >
                      {city.total}
                    </text>
                    <text
                      y={labelOffsetY + 16}
                      x={labelOffsetX}
                      textAnchor="middle"
                      fill="#1e293b"
                      className="pointer-events-none"
                      style={{ fontSize: 8.5, fontWeight: 600 }}
                    >
                      {city.cityLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {mapLayers && (
          <p className="mt-2 px-1 text-right text-[9px] leading-snug text-white/30">
            {SA_MAP_ATTRIBUTION}
          </p>
        )}
      </div>
    </div>
  );
}
