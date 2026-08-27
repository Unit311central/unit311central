"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import WolfLogoMark from "@/components/layout/WolfLogoMark";
import WolfEstateMap from "@/components/wolf/WolfEstateMap";
import WolfEstateMetricsPanel from "@/components/wolf/WolfEstateMetrics";
import WolfReserveStatusCard from "@/components/wolf/WolfReserveStatusCard";
import WolfWatch from "@/components/wolf/WolfWatch";
import { useWolfEstate } from "@/components/wolf/useWolfEstate";
import type { WolfReserveRecord } from "@/lib/wolf/central/types";
import { wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";

export default function WolfEstateDashboard() {
  const { estate, loading, error } = useWolfEstate();
  const [selectedReserve, setSelectedReserve] = useState<WolfReserveRecord | null>(null);

  const reserves = estate?.reserves ?? [];
  const activeReserve = selectedReserve ?? reserves[0] ?? null;

  if (loading) {
    return (
      <div className={`${wolfShellClass} flex items-center justify-center py-24`}>
        <Loader2 className="h-5 w-5 animate-spin text-emerald-300/70" />
      </div>
    );
  }

  if (error || !estate) {
    return (
      <div className={`${wolfShellClass} px-6 py-12 text-sm text-red-300/85`}>
        {error ?? "WOLF estate data unavailable."}
      </div>
    );
  }

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <WolfLogoMark size="lg" />
          <p className="mt-4 max-w-2xl text-sm text-white/55">
            Estate view across Africa — summary status, exceptions, and drill-down for authorised
            WOLF deployments.
          </p>
        </div>
        <p className={wolfEyebrowClass}>WOLF Central · Estate</p>
      </header>

      <WolfEstateMetricsPanel metrics={estate.metrics} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <WolfEstateMap
          reserves={reserves}
          selectedReserveId={activeReserve?.id ?? null}
          onSelectReserve={setSelectedReserve}
        />
        <div className="space-y-4">
          <p className={wolfEyebrowClass}>Reserve status</p>
          {activeReserve ? (
            <WolfReserveStatusCard reserve={activeReserve} selected />
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {reserves.map((reserve) => (
          <WolfReserveStatusCard
            key={reserve.id}
            reserve={reserve}
            selected={reserve.id === activeReserve?.id}
            onSelect={setSelectedReserve}
          />
        ))}
      </div>

      <div className="mt-6">
        <WolfWatch alerts={estate.alerts} />
      </div>
    </div>
  );
}
