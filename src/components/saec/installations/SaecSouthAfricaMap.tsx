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
import { cn } from "@/lib/utils";

type SaecSouthAfricaMapProps = {
  cities: SaecCityAggregate[];
  selectedCityId: string | null;
  assetType: SaecInstallationAssetType;
  onSelectCity: (cityId: string) => void;
};

type HoveredCity = SaecCityAggregate | null;

const ZOOM_STEP = 0.22;
const MIN_SCALE = 0.85;
const MAX_SCALE = 2.4;

function assetTypeLabel(assetType: SaecInstallationAssetType): string {
  return assetType === "elevator" ? "Elevators" : "Escalators";
}

function assetTypeShort(assetType: SaecInstallationAssetType): string {
  return assetType === "elevator" ? "Elevator" : "Escalator";
}

export default function SaecSouthAfricaMap({
  cities,
  selectedCityId,
  assetType,
  onSelectCity,
}: SaecSouthAfricaMapProps) {
  const [transform, setTransform] = useState<SaMapViewTransform>(SA_MAP_DEFAULT_TRANSFORM);
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
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

  const markerTheme =
    assetType === "elevator"
      ? {
          ring: "stroke-cyan-300",
          fill: "fill-cyan-500",
          fillSelected: "fill-cyan-400",
          ringSelected: "stroke-cyan-100",
          count: "fill-white",
          badge: "bg-cyan-500/20 text-cyan-100 border-cyan-400/30",
          glow: "#22d3ee",
        }
      : {
          ring: "stroke-amber-300",
          fill: "fill-amber-500",
          fillSelected: "fill-amber-400",
          ringSelected: "stroke-amber-100",
          count: "fill-white",
          badge: "bg-amber-500/20 text-amber-100 border-amber-400/30",
          glow: "#fbbf24",
        };

  const cityMarkers = useMemo(
    () =>
      cities
        .filter((city) => city.total > 0)
        .map((city) => {
          const point = projectSouthAfricaLonLat(city.longitude, city.latitude);
          const projected = applyMapViewTransform(point, transform, SA_MAP_CENTER);
          const labelOffsetX = city.labelOffsetX ?? 0;
          const labelOffsetY = city.labelOffsetY ?? 0;
          return { city, point: projected, labelOffsetX, labelOffsetY };
        }),
    [cities, transform],
  );

  const hoveredCity: HoveredCity =
    cities.find((city) => city.cityId === hoveredCityId) ?? null;

  function zoomBy(delta: number) {
    setTransform((current) => ({
      ...current,
      scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale + delta)),
    }));
  }

  function resetView() {
    setTransform(SA_MAP_DEFAULT_TRANSFORM);
  }

  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#0a1628]">
      <div className="border-b border-white/8 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/85">
              SAEC Installation Footprint
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">South Africa</h3>
            <p className="mt-0.5 text-xs text-white/45">
              Live installation clusters from SAEC operational records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                markerTheme.badge,
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
                onClick={resetView}
                className="rounded-md p-1.5 text-white/60 hover:bg-white/5 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
        {mapLoadError && (
          <div className="mb-3 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {mapLoadError}
          </div>
        )}

        {!mapLayers && !mapLoadError && (
          <div className="flex min-h-[360px] items-center justify-center text-sm text-white/45 lg:min-h-[520px]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading South Africa geography…
          </div>
        )}

        {mapLayers && (
        <div
          className="saec-installations-map-stage mx-auto w-full"
          style={{ height: "min(48vh, 460px)" }}
        >
        <svg
          viewBox={`0 0 ${SA_MAP_VIEWBOX.width} ${SA_MAP_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
          role="img"
          aria-label="Geographic map of South Africa showing SAEC installation clusters"
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
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
            </filter>
            <filter id="saec-marker-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
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
            const hovered = city.cityId === hoveredCityId;
            const radius = selected ? 30 : hovered ? 27 : 24;
            return (
              <g
                key={city.cityId}
                transform={`translate(${point.x}, ${point.y})`}
                className="cursor-pointer"
                onClick={() => onSelectCity(city.cityId)}
                onMouseEnter={() => setHoveredCityId(city.cityId)}
                onMouseLeave={() => setHoveredCityId((id) => (id === city.cityId ? null : id))}
                onFocus={() => setHoveredCityId(city.cityId)}
                onBlur={() => setHoveredCityId((id) => (id === city.cityId ? null : id))}
                filter={selected || hovered ? "url(#saec-marker-glow)" : "url(#saec-marker-shadow)"}
              >
                <circle
                  r={radius}
                  className={cn(
                    "transition-all duration-200 opacity-90",
                    selected ? markerTheme.fillSelected : markerTheme.fill,
                    selected ? markerTheme.ringSelected : markerTheme.ring,
                  )}
                  strokeWidth={selected ? 2.5 : 2}
                />
                <text
                  y={-4}
                  textAnchor="middle"
                  className={markerTheme.count}
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  {city.total}
                </text>
                <text
                  y={labelOffsetY + 18}
                  x={labelOffsetX}
                  textAnchor="middle"
                  className="fill-[#1e293b]"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {city.cityLabel}
                </text>
              </g>
            );
          })}
        </svg>
        </div>
        )}

        {mapLayers && hoveredCity && (
          <div
            className="pointer-events-none absolute left-4 top-4 z-10 max-w-[220px] rounded-xl border border-white/12 bg-[#0b1524]/95 px-3 py-2.5 shadow-xl backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-white">{hoveredCity.cityLabel}</p>
            <p className="mt-1 text-xs text-white/55">
              {hoveredCity.total} {assetTypeLabel(assetType)}
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-white/70">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {hoveredCity.online} Online
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {hoveredCity.maintenanceDue} Maintenance Due
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                {hoveredCity.offline} Offline
              </li>
            </ul>
          </div>
        )}

        {mapLayers && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 px-1 text-[10px] text-white/40">
          <div className="flex flex-wrap items-center gap-3">
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
            <span>
              Showing <span className="text-white/60">{assetTypeShort(assetType)}</span> clusters
            </span>
          </div>
          <p className="max-w-md text-right leading-snug">{SA_MAP_ATTRIBUTION}</p>
        </div>
        )}
      </div>
    </div>
  );
}
