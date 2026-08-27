"use client";

import { Loader2 } from "lucide-react";

import { useWolfEstate } from "@/components/wolf/useWolfEstate";
import { WolfStatusPill, wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";

export default function WolfDroneSummaryWorkspace() {
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
        {error ?? "Drone operations summary unavailable."}
      </div>
    );
  }
  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6">
        <p className={wolfEyebrowClass}>Drone Operations</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Drone operations summary</h1>
        <p className="mt-2 text-sm text-white/50">
          High-level mission status only — BCN/Oryx integration is a future stage.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        {estate.reserves.map((reserve) => (
          <div key={reserve.id} className={`${wolfCardClass} p-4`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-white">{reserve.name}</p>
              <WolfStatusPill status={reserve.droneOperations.status} />
            </div>
            <p className="mt-3 text-sm text-white/80">{reserve.droneOperations.headline}</p>
            <p className="mt-2 text-xs text-white/45">
              Active {reserve.droneOperations.activeMissions ?? 0} · Completed{" "}
              {reserve.droneOperations.completedMissions ?? 0} · Failed{" "}
              {reserve.droneOperations.failedMissions ?? 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
