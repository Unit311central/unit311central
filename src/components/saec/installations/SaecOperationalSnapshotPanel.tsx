"use client";

import type { SaecCityAggregate, SaecInstallationsKpis } from "@/lib/saec/installations-types";

type SaecOperationalSnapshotPanelProps = {
  kpis: SaecInstallationsKpis;
  cities: SaecCityAggregate[];
  assetTypeLabel: string;
};

export default function SaecOperationalSnapshotPanel({
  kpis,
  cities,
  assetTypeLabel,
}: SaecOperationalSnapshotPanelProps) {
  const topCities = [...cities]
    .filter((city) => city.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        Operational snapshot
      </p>
      <h3 className="mt-1 text-sm font-semibold text-white">National footprint</h3>
      <p className="mt-0.5 text-xs text-white/45">
        Live {assetTypeLabel.toLowerCase()} distribution across South Africa
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <MiniStat label="Online" value={kpis.online} />
        <MiniStat label="Offline" value={kpis.offline} />
        <MiniStat label="Maint. due" value={kpis.maintenanceDue} />
        <MiniStat label="On road" value={kpis.engineersOnRoad} />
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
          Top cities
        </p>
        <ul className="mt-2 space-y-1.5">
          {topCities.map((city) => (
            <li
              key={city.cityId}
              className="flex items-center justify-between rounded-lg border border-white/6 bg-[#0b1524]/40 px-2.5 py-1.5 text-xs"
            >
              <span className="text-white/75">{city.cityLabel}</span>
              <span className="font-semibold tabular-nums text-white">{city.total}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/8 bg-[#0b1524]/40 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-white/35">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
