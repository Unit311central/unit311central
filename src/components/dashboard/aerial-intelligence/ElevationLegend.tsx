"use client";

import {
  ELEVATION_RAMP_CSS,
  formatElevationMeters,
  type ElevationRange,
} from "@/lib/elevation-colormap";

type ElevationLegendProps = {
  range: ElevationRange | null;
  className?: string;
};

export default function ElevationLegend({ range, className }: ElevationLegendProps) {
  return (
    <aside
      className={`flex w-full shrink-0 flex-col justify-center border-t border-white/[0.06] bg-white/[0.02] px-4 py-4 lg:w-44 lg:border-l lg:border-t-0 ${className ?? ""}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        Elevation legend
      </p>
      <p className="mt-1 text-[11px] text-white/45">Surface height above datum</p>
      <div className="mt-3 flex items-stretch gap-2">
        <div className="h-36 w-3 rounded-full" style={{ background: ELEVATION_RAMP_CSS }} />
        <div className="flex flex-col justify-between py-0.5 text-[10px] text-white/45">
          <span>{formatElevationMeters(range?.max ?? null)}</span>
          <span>{formatElevationMeters(range?.min ?? null)}</span>
        </div>
      </div>
    </aside>
  );
}
