"use client";

import { Loader2 } from "lucide-react";

import WolfLogoMark from "@/components/layout/WolfLogoMark";
import WolfReserveStatusCard from "@/components/wolf/WolfReserveStatusCard";
import WolfWatch from "@/components/wolf/WolfWatch";
import { wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import { usePailexReserve } from "@/components/pailex/usePailexReserve";
import { PAILEX_DEMO_LABEL } from "@/lib/pailex/pailex-demo-data";
import {
  PAILEX_DISPLAY_NAME,
  PAILEX_TAGLINE,
} from "@/lib/pailex/pailex-surface";

export default function PailexDashboard() {
  const { snapshot, loading, error } = usePailexReserve();

  if (loading) {
    return (
      <div className={`${wolfShellClass} flex items-center justify-center py-24`}>
        <Loader2 className="h-5 w-5 animate-spin text-emerald-300/70" />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className={`${wolfShellClass} px-6 py-12 text-sm text-red-300/85`}>
        {error ?? "PAILEX reserve data unavailable."}
      </div>
    );
  }

  const { reserve, alerts } = snapshot;

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <WolfLogoMark size="md" />
            <div>
              <h1 className="text-2xl font-semibold text-white">{PAILEX_DISPLAY_NAME}</h1>
              <p className="text-sm text-emerald-300/80">{PAILEX_TAGLINE}</p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-white/55">
            {reserve.name} · {reserve.country} · {reserve.deploymentStatus}
            {reserve.isDemo ? ` · ${PAILEX_DEMO_LABEL}` : ""}
          </p>
        </div>
        <p className={wolfEyebrowClass}>Reserve dashboard</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Detections", value: reserve.animals.detections ?? "—" },
          { label: "Patrols", value: `${reserve.containment.patrolsCompleted ?? 0}/${reserve.containment.patrolsTotal ?? 0}` },
          { label: "Missions", value: reserve.droneOperations.headline },
          { label: "Fleet", value: `${reserve.fleetOperational}/${reserve.fleetTotal}` },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-4"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <WolfReserveStatusCard reserve={reserve} selected />
      </div>

      {alerts.length > 0 ? (
        <div className="mt-6">
          <WolfWatch alerts={alerts} />
        </div>
      ) : null}
    </div>
  );
}
