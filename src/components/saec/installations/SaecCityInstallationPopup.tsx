"use client";

import { X } from "lucide-react";
import Link from "next/link";

import type {
  SaecCityAggregate,
  SaecInstallationAssetType,
} from "@/lib/saec/installations-types";

type SaecCityInstallationPopupProps = {
  city: SaecCityAggregate;
  assetType: SaecInstallationAssetType;
  onClose: () => void;
};

export default function SaecCityInstallationPopup({
  city,
  assetType,
  onClose,
}: SaecCityInstallationPopupProps) {
  const assetLabel = assetType === "elevator" ? "Elevators" : "Escalators";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saec-city-popup-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/12 bg-[#0b1524] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/8 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
            City installation detail
          </p>
          <h3 id="saec-city-popup-title" className="mt-1 text-lg font-semibold text-white">
            {city.cityLabel}
          </h3>
          <p className="mt-0.5 text-sm text-white/55">
            {city.total} {assetLabel}
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat label="Online" value={city.online} tone="good" />
            <Stat label="Offline" value={city.offline} tone="bad" />
            <Stat label="Maintenance Due" value={city.maintenanceDue} tone="warn" />
            <Stat label="Overdue" value={city.overdue} tone="bad" />
            <Stat label="Engineers Assigned" value={city.engineersAssigned} />
            <Stat label="On The Road" value={city.engineersOnRoad} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Recent installations
            </p>
            <ul className="mt-2 space-y-1.5">
              {city.recentAssets.map((asset) => (
                <li
                  key={asset.id}
                  className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2"
                >
                  <p className="text-sm font-medium text-white">
                    <span className="text-sky-300/90">{asset.assetCode}</span>
                    <span className="text-white/35"> · </span>
                    {asset.siteName}
                  </p>
                  <p className="text-[11px] capitalize text-white/45">{asset.status}</p>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={`/dashboard?view=${assetType === "elevator" ? "saec-installations-elevators" : "saec-installations-escalators"}&city=${city.cityId}`}
            className="inline-flex text-xs font-semibold text-sky-300 hover:text-sky-200"
          >
            View all installations in {city.cityLabel} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/10"
      : tone === "warn"
        ? "border-amber-400/20 bg-amber-500/10"
        : tone === "bad"
          ? "border-red-400/20 bg-red-500/10"
          : "border-white/8 bg-white/[0.03]";
  return (
    <div className={`rounded-lg border px-2.5 py-2 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
