"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { WorkspaceDashboard } from "@/components/dashboard-framework";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { buildTechnologyManagementDashboardConfig } from "@/lib/technology-management-dashboard";

type SoftwareAssetRow = {
  id?: string;
  status?: string | null;
  nextRenewalDate?: string | null;
};

function daysUntil(iso: string | null | undefined) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000));
}

/**
 * Technology Management — Dashboard
 * Live Software & SaaS metrics only (no fake estate KPIs).
 */
export default function TechnologyDashboardWorkspace() {
  const router = useRouter();
  const basePath = useInternalOperationsBasePath();
  const [assets, setAssets] = useState<SoftwareAssetRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/software-assets", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load software assets");
        const data = (await response.json()) as {
          assets?: SoftwareAssetRow[];
          summary?: { renewalsDueIn30Days?: number };
        };
        const rows = data.assets ?? [];
        if (!cancelled) setAssets(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setAssets([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(() => {
    const activeCount = assets.filter((row) => {
      const status = String(row.status ?? "").toLowerCase();
      return status === "active" || status === "trial" || !status;
    }).length;
    const renewingSoonCount = assets.filter((row) => {
      const days = daysUntil(row.nextRenewalDate);
      return days != null && days >= 0 && days <= 60;
    }).length;
    return buildTechnologyManagementDashboardConfig({
      softwareCount: assets.length,
      activeCount,
      renewingSoonCount,
    });
  }, [assets]);

  return (
    <div className="space-y-3">
      {!loaded ? (
        <p className="text-sm text-white/45">Loading software register…</p>
      ) : null}
      <WorkspaceDashboard
        config={config}
        audience={{ workspaceId: "technology", role: "standard-user" }}
        onAction={(action) => {
          if (action === "open-software") {
            router.push(getInternalNavHref("technology-software", basePath));
          }
        }}
      />
    </div>
  );
}
