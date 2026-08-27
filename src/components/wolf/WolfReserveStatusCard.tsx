"use client";

import type { WolfReserveRecord } from "@/lib/wolf/central/types";
import { WolfStatusPill, wolfCardClass } from "@/components/wolf/wolf-ui";
import { cn } from "@/lib/utils";

type WolfReserveStatusCardProps = {
  reserve: WolfReserveRecord;
  selected?: boolean;
  onSelect?: (reserve: WolfReserveRecord) => void;
};

function DomainRow({
  label,
  summary,
}: {
  label: string;
  summary: { status: "normal" | "attention"; headline: string; detail?: string };
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.05] last:border-0">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-white/85">{summary.headline}</p>
        {summary.detail ? (
          <p className="text-xs text-white/45">{summary.detail}</p>
        ) : null}
      </div>
      <WolfStatusPill status={summary.status} />
    </div>
  );
}

export default function WolfReserveStatusCard({
  reserve,
  selected,
  onSelect,
}: WolfReserveStatusCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(reserve)}
      className={cn(
        `${wolfCardClass} w-full p-4 text-left transition-all`,
        selected && "border-emerald-400/35 ring-1 ring-emerald-400/20",
        onSelect && "cursor-pointer hover:border-white/15",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{reserve.name}</p>
          <p className="text-xs text-white/45">{reserve.country}</p>
        </div>
        <WolfStatusPill status={reserve.attentionStatus} />
      </div>
      <div className="mt-4 space-y-0">
        <DomainRow label="Animals" summary={reserve.animals} />
        <DomainRow label="Containment" summary={reserve.containment} />
        <DomainRow label="Environment" summary={reserve.environment} />
        <DomainRow
          label="Fleet"
          summary={{
            status: reserve.fleetOperational === reserve.fleetTotal ? "normal" : "attention",
            headline: `${reserve.fleetOperational}/${reserve.fleetTotal} operational`,
          }}
        />
        <DomainRow label="Drones" summary={reserve.droneOperations} />
      </div>
      {reserve.futureWorkspaceSlug && !reserve.hasCustomerWorkspace ? (
        <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-200/70">
          Customer workspace — next stage
        </p>
      ) : null}
    </button>
  );
}
