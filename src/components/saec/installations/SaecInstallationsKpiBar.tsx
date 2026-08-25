"use client";

import type { SaecInstallationsKpis } from "@/lib/saec/installations-types";
import { cn } from "@/lib/utils";

export type SaecKpiNavigateTarget =
  | "offline"
  | "maintenance-due"
  | "overdue"
  | "engineers-on-road"
  | "open-service";

type SaecInstallationsKpiBarProps = {
  kpis: SaecInstallationsKpis;
  assetTypeLabel: string;
  onNavigate?: (target: SaecKpiNavigateTarget) => void;
};

function Tile({
  label,
  value,
  tone = "default",
  onClick,
}: {
  label: string;
  value: number;
  tone?: "default" | "good" | "warn" | "bad";
  onClick?: () => void;
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
        ? "border-amber-400/25 bg-amber-500/10 text-amber-100"
        : tone === "bad"
          ? "border-red-400/25 bg-red-500/10 text-red-100"
          : "border-white/10 bg-white/[0.04] text-white";
  const interactive = Boolean(onClick);
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      className={cn(
        `rounded-xl border px-3 py-2.5 text-left transition-colors ${toneClass}`,
        interactive && "cursor-pointer hover:border-white/25 hover:bg-white/[0.06]",
        !interactive && "cursor-default",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value.toLocaleString("en-ZA")}</p>
    </button>
  );
}

export default function SaecInstallationsKpiBar({
  kpis,
  assetTypeLabel,
  onNavigate,
}: SaecInstallationsKpiBarProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <Tile label={`Total ${assetTypeLabel}`} value={kpis.total} />
      <Tile label="Online" value={kpis.online} tone="good" />
      <Tile
        label="Offline"
        value={kpis.offline}
        tone="bad"
        onClick={onNavigate ? () => onNavigate("offline") : undefined}
      />
      <Tile
        label="Maintenance Due"
        value={kpis.maintenanceDue}
        tone="warn"
        onClick={onNavigate ? () => onNavigate("maintenance-due") : undefined}
      />
      <Tile
        label="Overdue Maintenance"
        value={kpis.overdueMaintenance}
        tone="bad"
        onClick={onNavigate ? () => onNavigate("overdue") : undefined}
      />
      <Tile
        label="Engineers On Road"
        value={kpis.engineersOnRoad}
        onClick={onNavigate ? () => onNavigate("engineers-on-road") : undefined}
      />
      <Tile
        label="Open Service Assignments"
        value={kpis.openServiceAssignments}
        tone="warn"
        onClick={onNavigate ? () => onNavigate("open-service") : undefined}
      />
    </div>
  );
}
