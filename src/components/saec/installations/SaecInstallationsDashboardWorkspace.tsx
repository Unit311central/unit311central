"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Wrench } from "lucide-react";

import SaecCityInstallationPopup from "@/components/saec/installations/SaecCityInstallationPopup";
import SaecEquipmentBreakdownPanel from "@/components/saec/installations/SaecEquipmentBreakdownPanel";
import SaecInstallationsKpiBar, {
  type SaecKpiNavigateTarget,
} from "@/components/saec/installations/SaecInstallationsKpiBar";
import SaecOperationalSnapshotPanel from "@/components/saec/installations/SaecOperationalSnapshotPanel";
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
  const registerView =
    assetType === "elevator" ? "saec-installations-elevators" : "saec-installations-escalators";

  function handleKpiNavigate(target: SaecKpiNavigateTarget) {
    const base = `/dashboard?view=${registerView}`;
    switch (target) {
      case "online":
        window.location.assign(`${base}&status=online`);
        return;
      case "offline":
        window.location.assign(`${base}&status=offline`);
        return;
      case "maintenance-due":
        window.location.assign(`${base}&maintenance=due`);
        return;
      case "overdue":
        window.location.assign(`${base}&maintenance=overdue`);
        return;
      case "open-service":
        window.location.assign(`${base}&filter=open-service`);
        return;
      case "engineers-on-road":
        document.getElementById("saec-engineers-on-road")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }
  }

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
          <SaecInstallationsKpiBar
            kpis={dashboard.kpis}
            assetTypeLabel={assetLabel}
            onNavigate={handleKpiNavigate}
          />

          <SaecSouthAfricaMap
            cities={dashboard.cities}
            selectedCityId={selectedCityId}
            assetType={assetType}
            onSelectCity={setSelectedCityId}
          />

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            <SaecEquipmentBreakdownPanel
              assetType={assetType}
              items={dashboard.modelBreakdown}
              total={dashboard.kpis.total}
            />
            <SaecOperationalSnapshotPanel
              kpis={dashboard.kpis}
              cities={dashboard.cities}
              assetTypeLabel={assetLabel}
            />
          </div>

          {selectedCity && (
            <SaecCityInstallationPopup
              city={selectedCity}
              assetType={assetType}
              onClose={() => setSelectedCityId(null)}
            />
          )}

          {dashboard.engineersOnRoad.length > 0 && (
            <section
              id="saec-engineers-on-road"
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 scroll-mt-4"
            >
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
            Demonstration dataset — not verified OmniTransit operational figures.
          </p>
        </>
      )}
    </div>
  );
}
