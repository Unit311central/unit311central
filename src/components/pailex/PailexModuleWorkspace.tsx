"use client";

import { Loader2 } from "lucide-react";

import { usePailexReserve } from "@/components/pailex/usePailexReserve";
import { WolfStatusPill, wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import type { PailexDemoRecord } from "@/lib/pailex/pailex-demo-data";
import type { PailexModulePageConfig } from "@/lib/pailex/pailex-module-config";

function formatStatus(status: PailexDemoRecord["status"]) {
  switch (status) {
    case "attention":
      return "attention" as const;
    case "open":
    case "scheduled":
      return "attention" as const;
    default:
      return "normal" as const;
  }
}

function RecordTable({ records }: { records: PailexDemoRecord[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.03] text-[11px] uppercase tracking-[0.12em] text-white/45">
          <tr>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Detail</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium text-white">{record.title}</td>
              <td className="px-4 py-3">
                <WolfStatusPill status={formatStatus(record.status)} />
              </td>
              <td className="px-4 py-3 text-white/65">{record.detail}</td>
              <td className="hidden px-4 py-3 text-white/40 sm:table-cell">
                {new Date(record.updatedAt).toLocaleString("en-ZA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PailexModuleWorkspace({ config }: { config: PailexModulePageConfig }) {
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
        {error ?? "PAILEX reserve context unavailable."}
      </div>
    );
  }

  const { reserve } = snapshot;

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6">
        <p className={wolfEyebrowClass}>{config.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{config.title}</h1>
        <p className="mt-2 text-sm text-white/50">{config.description}</p>
        <p className="mt-1 text-xs text-white/35">
          {reserve.name} · {reserve.country}
          {config.note ? ` · ${config.note}` : ""}
        </p>
      </header>

      {config.metrics?.length ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {config.metrics.map((metric) => (
            <div key={metric.label} className={`${wolfCardClass} p-4`}>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
                {metric.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {config.records?.length ? <RecordTable records={config.records} /> : null}

      {!config.metrics?.length && !config.records?.length ? (
        <div className={`${wolfCardClass} p-6 text-sm text-white/55`}>
          No records to display for this module.
        </div>
      ) : null}
    </div>
  );
}
