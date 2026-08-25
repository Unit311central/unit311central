"use client";

import type { SaecModelBreakdownItem, SaecInstallationAssetType } from "@/lib/saec/installations-types";

type SaecEquipmentBreakdownPanelProps = {
  assetType: SaecInstallationAssetType;
  items: SaecModelBreakdownItem[];
  total: number;
};

export default function SaecEquipmentBreakdownPanel({
  assetType,
  items,
  total,
}: SaecEquipmentBreakdownPanelProps) {
  const title = assetType === "elevator" ? "Elevator types" : "Escalator types";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        Equipment breakdown
      </p>
      <h3 className="mt-1 text-sm font-semibold text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-white/45">{total.toLocaleString("en-ZA")} units in portfolio</p>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.model}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-white/75">{item.model}</span>
              <span className="tabular-nums text-white/90">
                {item.count}{" "}
                <span className="text-white/40">({item.percentage}%)</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-sky-400/70"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
