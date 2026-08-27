"use client";

import { Loader2 } from "lucide-react";

import { useWolfEstate } from "@/components/wolf/useWolfEstate";
import { WolfStatusPill, wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";

export default function WolfEnvironmentSummaryWorkspace() {
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
        {error ?? "Environment summary unavailable."}
      </div>
    );
  }
  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6">
        <p className={wolfEyebrowClass}>Environment</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Environment summary</h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        {estate.reserves.map((reserve) => (
          <div key={reserve.id} className={`${wolfCardClass} p-4`}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-white">{reserve.name}</p>
              <WolfStatusPill status={reserve.environment.status} />
            </div>
            <p className="mt-3 text-sm text-white/80">{reserve.environment.headline}</p>
            <p className="mt-2 text-xs text-white/45">
              Fire {reserve.environment.fireStatus ?? "—"} · Flood {reserve.environment.floodStatus ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
