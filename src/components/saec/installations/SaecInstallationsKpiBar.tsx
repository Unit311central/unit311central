"use client";

import type { SaecInstallationsKpis } from "@/lib/saec/installations-types";

type SaecInstallationsKpiBarProps = {
  kpis: SaecInstallationsKpis;
  assetTypeLabel: string;
};

function Tile({
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
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
        ? "border-amber-400/25 bg-amber-500/10 text-amber-100"
        : tone === "bad"
          ? "border-red-400/25 bg-red-500/10 text-red-100"
          : "border-white/10 bg-white/[0.04] text-white";
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${toneClass}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value.toLocaleString("en-ZA")}</p>
    </div>
  );
}

export default function SaecInstallationsKpiBar({
  kpis,
  assetTypeLabel,
}: SaecInstallationsKpiBarProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <Tile label={`Total ${assetTypeLabel}`} value={kpis.total} />
      <Tile label="Online" value={kpis.online} tone="good" />
      <Tile label="Offline" value={kpis.offline} tone="bad" />
      <Tile label="Maintenance Due" value={kpis.maintenanceDue} tone="warn" />
      <Tile label="Overdue Maintenance" value={kpis.overdueMaintenance} tone="bad" />
      <Tile label="Engineers On Road" value={kpis.engineersOnRoad} />
      <Tile label="Open Service Assignments" value={kpis.openServiceAssignments} tone="warn" />
    </div>
  );
}
