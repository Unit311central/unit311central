"use client";

import { cn } from "@/lib/utils";
import type { SaecCityAggregate } from "@/lib/saec/installations-types";

/** Simplified South Africa outline — demo cartography, not survey-grade. */
const SA_OUTLINE =
  "M 198 668 L 228 612 L 268 568 L 312 528 L 358 498 L 408 472 L 458 448 L 512 418 L 562 388 L 608 352 L 648 318 L 688 292 L 728 276 L 768 268 L 802 278 L 828 302 L 848 332 L 862 362 L 872 398 L 878 438 L 874 502 L 862 548 L 844 592 L 818 628 L 792 656 L 758 678 L 718 698 L 672 714 L 628 724 L 578 732 L 528 736 L 478 738 L 428 736 L 378 728 L 328 714 L 278 698 L 238 682 Z M 168 642 L 188 598 L 208 562 L 198 668 Z";

type SaecSouthAfricaMapProps = {
  cities: SaecCityAggregate[];
  selectedCityId: string | null;
  onSelectCity: (cityId: string) => void;
};

export default function SaecSouthAfricaMap({
  cities,
  selectedCityId,
  onSelectCity,
}: SaecSouthAfricaMapProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#071018]/80 p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
          South Africa — installation footprint (demo)
        </p>
        <p className="text-[10px] text-white/35">Demonstration data only</p>
      </div>
      <svg
        viewBox="0 0 1000 800"
        className="mx-auto h-auto w-full max-h-[340px] min-h-[260px]"
        role="img"
        aria-label="South Africa installations map"
      >
        <defs>
          <linearGradient id="saec-map-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="1000" height="800" fill="#030712" rx="12" />
        <path
          d={SA_OUTLINE}
          fill="url(#saec-map-fill)"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.92"
        />
        {cities.map((city) => {
          const selected = city.cityId === selectedCityId;
          const hasUnits = city.total > 0;
          if (!hasUnits) return null;
          return (
            <g
              key={city.cityId}
              transform={`translate(${city.mapX}, ${city.mapY})`}
              className="cursor-pointer"
              onClick={() => onSelectCity(city.cityId)}
            >
              <circle
                r={selected ? 34 : 28}
                className={cn(
                  "transition-all duration-200",
                  selected
                    ? "fill-sky-500/35 stroke-sky-300"
                    : "fill-sky-500/20 stroke-sky-400/60 hover:fill-sky-500/30",
                )}
                strokeWidth={selected ? 2.5 : 1.5}
              />
              <text
                y={-6}
                textAnchor="middle"
                className="fill-white text-[11px] font-semibold"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                {city.total}
              </text>
              <text
                y={14}
                textAnchor="middle"
                className="fill-white/70"
                style={{ fontSize: 9, fontWeight: 500 }}
              >
                {city.cityLabel.length > 14
                  ? city.cityLabel.slice(0, 12) + "…"
                  : city.cityLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
