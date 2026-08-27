"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  AFRICA_MAP_DEFAULT_TRANSFORM,
  AFRICA_MAP_VIEWBOX,
  applyMapViewTransform,
  loadAfricaMapLayers,
  projectAfricaLonLat,
  type AfricaMapLayers,
  type AfricaMapViewTransform,
} from "@/lib/wolf/africa-map-project";
import type { WolfReserveRecord } from "@/lib/wolf/central/types";

type WolfEstateMapProps = {
  reserves: WolfReserveRecord[];
  selectedReserveId: string | null;
  onSelectReserve: (reserve: WolfReserveRecord) => void;
};

export default function WolfEstateMap({
  reserves,
  selectedReserveId,
  onSelectReserve,
}: WolfEstateMapProps) {
  const [layers, setLayers] = useState<AfricaMapLayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const transform: AfricaMapViewTransform = AFRICA_MAP_DEFAULT_TRANSFORM;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadAfricaMapLayers()
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

  const markers = useMemo(() => {
    return reserves.map((reserve) => {
      const point = applyMapViewTransform(transform, projectAfricaLonLat(reserve.longitude, reserve.latitude));
      return { reserve, point };
    });
  }, [reserves, transform]);

  const { width, height } = AFRICA_MAP_VIEWBOX;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1210]">
      {loading ? (
        <div className="flex h-[320px] items-center justify-center text-white/50 sm:h-[380px]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading Africa geography…
        </div>
      ) : error ? (
        <div className="flex h-[320px] items-center justify-center px-4 text-sm text-red-300/80 sm:h-[380px]">
          {error}
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-h-[420px]"
          role="img"
          aria-label="WOLF estate map across Africa"
        >
          <defs>
            <radialGradient id="wolf-map-glow" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#1a4d3a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#080c0a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={width} height={height} fill="url(#wolf-map-glow)" />
          {layers?.continentPath ? (
            <path
              d={layers.continentPath}
              fill="#143528"
              stroke="#2d6a4f"
              strokeWidth={1.2}
              strokeOpacity={0.55}
            />
          ) : null}
          {markers.map(({ reserve, point }) => {
            const selected = reserve.id === selectedReserveId;
            const attention = reserve.attentionStatus === "attention";
            return (
              <g
                key={reserve.id}
                transform={`translate(${point.x}, ${point.y})`}
                className="cursor-pointer"
                onClick={() => onSelectReserve(reserve)}
              >
                <circle
                  r={selected ? 14 : 10}
                  fill={attention ? "#b45309" : "#1a4d3a"}
                  stroke={selected ? "#6ee7b7" : "#34d399"}
                  strokeWidth={selected ? 2.5 : 1.5}
                  opacity={0.9}
                />
                <circle r={3} fill="#f8fafc" />
              </g>
            );
          })}
        </svg>
      )}
      <div className="absolute bottom-3 left-3 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white/45">
        {reserves.length} demo deployments
      </div>
    </div>
  );
}
