"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import SoftwareSaasExecutiveDashboard from "@/components/testflighthub/software-saas/SoftwareSaasExecutiveDashboard";
import { buildSoftwareSaasExecutiveDashboard } from "@/lib/software-billing/build-software-saas-executive-dashboard";
import type { SoftwareAsset } from "@/lib/software-assets-data";
import { useWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency";

/**
 * Software & SaaS executive dashboard workspace.
 * Loads the same software-asset register records used by Software Explorer.
 */
export default function SoftwareSaasDashboardWorkspace() {
  const reportingCurrency = useWorkspaceReportingCurrency();
  const [assets, setAssets] = useState<SoftwareAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/software-assets", { cache: "no-store" });
      const text = await response.text();
      const data = text
        ? (JSON.parse(text) as { assets?: SoftwareAsset[]; error?: string })
        : {};
      if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status})`);
      setAssets(Array.isArray(data.assets) ? data.assets : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load software records",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dashboard = useMemo(() => {
    const built = buildSoftwareSaasExecutiveDashboard({ assets });
    if (assets.length === 0 && built.currency === "USD" && reportingCurrency !== "USD") {
      return { ...built, currency: reportingCurrency };
    }
    return built;
  }, [assets, reportingCurrency]);

  return (
    <div className="space-y-4">
      <SoftwareSaasExecutiveDashboard
        dashboard={dashboard}
        loading={loading}
        error={error}
      />
    </div>
  );
}
