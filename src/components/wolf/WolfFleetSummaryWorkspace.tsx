"use client";

import { Loader2 } from "lucide-react";

import { useWolfEstate } from "@/components/wolf/useWolfEstate";
import { wolfCardClass, wolfEyebrowClass, wolfMetricLabelClass, wolfMetricValueClass, wolfShellClass } from "@/components/wolf/wolf-ui";

export default function WolfFleetSummaryWorkspace() {
  const { estate, loading, error } = useWolfEstate();
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
        {error ?? "Fleet summary unavailable."}
      </div>
    );
  }

  const metrics = estate.metrics;

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6">
        <p className={wolfEyebrowClass}>Fleet</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Fleet summary</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Total aircraft", value: metrics.totalAircraft },
          { label: "Large", value: metrics.largeDrones },
          { label: "Small", value: metrics.smallDrones },
          { label: "Docks", value: metrics.docks },
          { label: "Batteries", value: metrics.batteries },
        ].map((item) => (
          <div key={item.label} className={`${wolfCardClass} px-4 py-4`}>
            <div className={wolfMetricValueClass}>{item.value}</div>
            <div className={wolfMetricLabelClass}>{item.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-white/45">
        Reserve allocation
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {estate.reserves.map((reserve) => (
          <div key={reserve.id} className={`${wolfCardClass} p-4`}>
            <p className="font-semibold text-white">{reserve.name}</p>
            <p className="mt-3 text-sm text-white/75">
              Large {reserve.largeDroneCount} · Small {reserve.smallDroneCount} · Docks{" "}
              {reserve.dockCount}
            </p>
            <p className="mt-1 text-xs text-white/45">
              {reserve.fleetOperational}/{reserve.fleetTotal} operational
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
