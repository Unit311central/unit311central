"use client";

import { useMemo, useState } from "react";

import WolfEstateMap from "@/components/wolf/WolfEstateMap";
import WolfEstateMetricsPanel from "@/components/wolf/WolfEstateMetrics";
import WolfReserveStatusCard from "@/components/wolf/WolfReserveStatusCard";
import { wolfCardClass, wolfEyebrowClass } from "@/components/wolf/wolf-ui";
import { buildWolfRealtimeMarketingEstateSnapshot } from "@/lib/wolf-realtime-website/demo-estate";
import type { WolfReserveRecord } from "@/lib/wolf/central/types";

/**
 * Live WOLF Central UI components fed with the same demo estate seed as the product.
 * Shown on the public marketing site only — not WOLF Central.
 */
export default function WolfRealtimeHeroProductPreview() {
  const estate = useMemo(() => buildWolfRealtimeMarketingEstateSnapshot(), []);
  const [selectedReserve, setSelectedReserve] = useState<WolfReserveRecord | null>(
    estate.reserves[0] ?? null,
  );
  const activeReserve = selectedReserve ?? estate.reserves[0] ?? null;

  return (
    <div
      className={`${wolfCardClass} overflow-hidden border-emerald-500/20 bg-[#080c0a] shadow-2xl shadow-black/50`}
      aria-label="WOLF Central estate overview demonstration"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <p className={wolfEyebrowClass}>WOLF Central · Estate overview</p>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
          Demonstration data
        </span>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <WolfEstateMetricsPanel metrics={estate.metrics} />
        <WolfEstateMap
          reserves={estate.reserves}
          selectedReserveId={activeReserve?.id ?? null}
          onSelectReserve={setSelectedReserve}
        />
        {activeReserve ? (
          <WolfReserveStatusCard reserve={activeReserve} selected />
        ) : null}
      </div>
    </div>
  );
}
