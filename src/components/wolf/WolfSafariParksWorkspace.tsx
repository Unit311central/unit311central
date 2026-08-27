"use client";

import { Loader2 } from "lucide-react";

import WolfReserveStatusCard from "@/components/wolf/WolfReserveStatusCard";
import { useWolfEstate } from "@/components/wolf/useWolfEstate";
import { wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";

export default function WolfSafariParksWorkspace() {
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
        {error ?? "Safari parks registry unavailable."}
      </div>
    );
  }

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6">
        <p className={wolfEyebrowClass}>Safari Parks</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">WOLF reserve registry</h1>
        <p className="mt-2 text-sm text-white/50">
          Management list of WOLF demo deployments and future customer reserves.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {estate.reserves.map((reserve) => (
          <WolfReserveStatusCard key={reserve.id} reserve={reserve} />
        ))}
      </div>
    </div>
  );
}
