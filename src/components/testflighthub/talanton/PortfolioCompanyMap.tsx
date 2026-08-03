"use client";

import { useMemo, useState } from "react";
import { MapPin, X } from "lucide-react";

import {
  buildPortfolioMapMarkers,
  type PortfolioMapMarker,
} from "@/lib/talanton/portfolio-map";
import { cn } from "@/lib/utils";

function MarkerCard({
  marker,
  onClose,
}: {
  marker: PortfolioMapMarker;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl border border-emerald-400/30 bg-[#07111f]/95 p-4 shadow-xl backdrop-blur sm:left-auto sm:right-3 sm:w-[22rem]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
            Portfolio company
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{marker.company}</h3>
          <p className="text-sm text-white/55">
            {marker.city}, {marker.country}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Close company details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-white/40">Sector</dt>
          <dd className="mt-0.5 text-white/85">{marker.sector}</dd>
        </div>
        <div>
          <dt className="text-white/40">Staff</dt>
          <dd className="mt-0.5 tabular-nums text-white/85">
            {marker.staff.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-white/40">Revenue</dt>
          <dd className="mt-0.5 tabular-nums text-white/85">{marker.revenueLabel}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-white/40">Company purpose</dt>
          <dd className="mt-0.5 leading-relaxed text-white/80">{marker.companyPurpose}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Africa-centred portfolio map for Talanton Executive Home. */
export default function PortfolioCompanyMap() {
  const markers = useMemo(() => buildPortfolioMapMarkers(), []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const active =
    markers.find((m) => m.id === activeId) ??
    markers.find((m) => m.id === hoveredId) ??
    null;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]/60">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
            Portfolio footprint
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-white">Portfolio Company Map</h2>
          <p className="mt-1 text-sm text-white/50">
            {markers.length} holdings across Africa — hover or click a marker for company detail.
          </p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-white/45">
          <MapPin className="h-3.5 w-3.5 text-emerald-300" />
          Africa focus
        </p>
      </header>

      <div className="relative aspect-[16/10] w-full sm:aspect-[21/10]">
        {/* Atmospheric Africa frame */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 45% 48%, rgba(16,185,129,0.18) 0%, transparent 55%), linear-gradient(160deg, #0a1628 0%, #0c1f18 45%, #0a1524 100%)",
          }}
        />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full opacity-40"
          aria-hidden
        >
          <defs>
            <pattern id="ti-map-grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#ti-map-grid)" />
          {/* Simplified Africa outline (schematic) */}
          <path
            d="M42 12 C48 10 55 12 58 18 C62 22 64 28 63 34 C66 38 68 44 66 52 C64 60 60 66 55 70 C52 78 48 86 42 88 C36 86 32 78 30 70 C26 64 24 56 25 48 C24 40 26 32 30 26 C32 20 36 14 42 12 Z"
            fill="rgba(16,185,129,0.12)"
            stroke="rgba(52,211,153,0.35)"
            strokeWidth="0.4"
          />
        </svg>

        {markers.map((marker) => {
          const isHot = marker.id === activeId || marker.id === hoveredId;
          return (
            <button
              key={marker.id}
              type="button"
              title={`${marker.company} · ${marker.city}`}
              aria-label={`${marker.company}, ${marker.city}, ${marker.country}`}
              onMouseEnter={() => setHoveredId(marker.id)}
              onMouseLeave={() => setHoveredId((id) => (id === marker.id ? null : id))}
              onFocus={() => setHoveredId(marker.id)}
              onBlur={() => setHoveredId((id) => (id === marker.id ? null : id))}
              onClick={() => setActiveId((id) => (id === marker.id ? null : marker.id))}
              className={cn(
                "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform",
                isHot ? "scale-125" : "hover:scale-110",
              )}
              style={{ left: `${marker.xPct}%`, top: `${marker.yPct}%` }}
            >
              <span
                className={cn(
                  "block h-3 w-3 rounded-full border-2 shadow-[0_0_12px_rgba(16,185,129,0.55)]",
                  isHot
                    ? "border-white bg-emerald-300"
                    : "border-emerald-200/80 bg-emerald-500",
                )}
              />
            </button>
          );
        })}

        {active ? (
          <MarkerCard marker={active} onClose={() => setActiveId(null)} />
        ) : null}
      </div>
    </section>
  );
}
