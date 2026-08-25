"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Users, Wrench } from "lucide-react";

import SaecInstallationsKpiBar from "@/components/saec/installations/SaecInstallationsKpiBar";
import SaecSouthAfricaMap from "@/components/saec/installations/SaecSouthAfricaMap";
import type {
  SaecCityAggregate,
  SaecInstallationAssetType,
  SaecInstallationsDashboardSnapshot,
} from "@/lib/saec/installations-types";
import { cn } from "@/lib/utils";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

type SaecInstallationsDashboardWorkspaceProps = {
  initialAssetType?: SaecInstallationAssetType;
};

export default function SaecInstallationsDashboardWorkspace({
  initialAssetType = "elevator",
}: SaecInstallationsDashboardWorkspaceProps) {
  const [assetType, setAssetType] = useState<SaecInstallationAssetType>(initialAssetType);
  const [dashboard, setDashboard] = useState<SaecInstallationsDashboardSnapshot | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch(`/api/saec/installations/dashboard?assetType=${assetType}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await readJson<{ dashboard?: SaecInstallationsDashboardSnapshot; error?: string }>(
          response,
        );
        if (!response.ok) throw new Error(payload.error ?? "Failed to load dashboard");
        if (!cancelled) {
          setDashboard(payload.dashboard ?? null);
          setSelectedCityId(null);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard");
          setDashboard(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assetType]);

  const selectedCity: SaecCityAggregate | null =
    dashboard?.cities.find((city) => city.cityId === selectedCityId) ?? null;

  const assetLabel = assetType === "elevator" ? "Elevators" : "Escalators / Moving Walks";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/90">
              Operations · Installations
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">Installations Dashboard</h2>
            <p className="mt-1 max-w-2xl text-xs text-white/45">
              Demo operational footprint across South Africa — approximately 800 installed units under
              management (demonstration assumptions only).
            </p>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-[#0b1524] p-1">
            {(["elevator", "escalator"] as SaecInstallationAssetType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAssetType(type)}
                className={cn(
                  "rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
                  assetType === type
                    ? "bg-sky-500/25 text-sky-100"
                    : "text-white/50 hover:text-white/80",
                )}
              >
                {type === "elevator" ? "Elevators" : "Escalators"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading installations dashboard…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {dashboard && !loading && (
        <>
          <SaecInstallationsKpiBar kpis={dashboard.kpis} assetTypeLabel={assetLabel} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
            <SaecSouthAfricaMap
              cities={dashboard.cities}
              selectedCityId={selectedCityId}
              assetType={assetType}
              onSelectCity={setSelectedCityId}
            />

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 xl:min-h-[560px]">
              {selectedCity ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                      Selected city
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-white">{selectedCity.cityLabel}</h3>
                    <p className="mt-1 text-sm text-white/55">
                      {selectedCity.total} {assetType === "elevator" ? "Elevators" : "Escalators"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Stat label="Online" value={selectedCity.online} />
                    <Stat label="Offline" value={selectedCity.offline} />
                    <Stat label="Maintenance Due" value={selectedCity.maintenanceDue} />
                    <Stat label="Overdue" value={selectedCity.overdue} />
                    <Stat label="Engineers Assigned" value={selectedCity.engineersAssigned} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                      Representative sites (demo)
                    </p>
                    <ul className="mt-2 space-y-2">
                      {selectedCity.sites.slice(0, 6).map((site) => (
                        <li
                          key={site.id}
                          className="rounded-lg border border-white/8 bg-[#0b1524]/60 px-3 py-2"
                        >
                          <p className="text-sm font-medium text-white">{site.siteName}</p>
                          <p className="text-[11px] text-white/45">
                            {site.customerName} · {site.unitCount} units
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center text-white/40 xl:min-h-[480px]">
                  <MapPin className="mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">Select a city on the map to view installation detail.</p>
                </div>
              )}
            </section>
          </div>

          {dashboard.engineersOnRoad.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-300" />
                <h3 className="text-sm font-semibold text-white">Engineers on the road (demo)</h3>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {dashboard.engineersOnRoad.map((row) => (
                  <div
                    key={`${row.engineerId}-${row.assetCode}`}
                    className="rounded-xl border border-white/8 bg-[#0b1524]/50 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-white">{row.engineerName}</p>
                    <p className="text-[11px] text-white/45">
                      {row.assignmentLabel} · {row.cityLabel}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-sky-300/80">
                      {row.status}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="text-[11px] text-white/30">
            <Wrench className="mr-1 inline h-3 w-3" />
            Demonstration dataset — not verified SAEC operational figures.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/8 bg-[#0b1524]/40 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
      <p className="text-sm font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}
