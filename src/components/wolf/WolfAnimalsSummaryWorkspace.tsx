"use client";

import { Loader2 } from "lucide-react";

import { useWolfEstate } from "@/components/wolf/useWolfEstate";
import { WolfStatusPill, wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";

function WolfSummaryWorkspace({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6">
        <p className={wolfEyebrowClass}>{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/50">Central summary — detailed reserve operations come later.</p>
      </header>
      {children}
    </div>
  );
}

export default function WolfAnimalsSummaryWorkspace() {
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
        {error ?? "Animals summary unavailable."}
      </div>
    );
  }
  return (
    <WolfSummaryWorkspace title="Animals summary" eyebrow="Animals">
      <div className="grid gap-4 lg:grid-cols-3">
        {estate.reserves.map((reserve) => (
          <div key={reserve.id} className={`${wolfCardClass} p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{reserve.name}</p>
                <p className="text-xs text-white/45">{reserve.country}</p>
              </div>
              <WolfStatusPill status={reserve.animals.status} />
            </div>
            <p className="mt-3 text-sm text-white/80">{reserve.animals.headline}</p>
            {reserve.animals.detail ? (
              <p className="mt-1 text-xs text-white/45">{reserve.animals.detail}</p>
            ) : null}
            {reserve.animals.detections != null ? (
              <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-white/35">
                Detections · Census {reserve.animals.censusStatus ?? "—"}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </WolfSummaryWorkspace>
  );
}
