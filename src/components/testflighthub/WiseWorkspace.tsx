"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";

import TreasuryShell from "@/components/treasury/TreasuryShell";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { useWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency";
import type { TreasuryView } from "@/lib/treasury/treasury-types";
import type { WiseConnectionStatus } from "@/lib/wise-service";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.slice(0, 160) || "Unexpected server response");
  }
}

function isOnwardAirHost() {
  try {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname.toLowerCase();
    return host.includes("onwardair") || host === "onward.unit311central.com";
  } catch {
    return false;
  }
}

export default function WiseWorkspace({
  treasuryView = "dashboard",
  areaTitle,
  areaDescription,
}: {
  treasuryView?: TreasuryView;
  areaTitle?: string;
  areaDescription?: string;
}) {
  const [status, setStatus] = useState<
    (WiseConnectionStatus & { demoMode?: boolean }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportingCurrency = useWorkspaceReportingCurrency();
  const isUsdWorkspace = reportingCurrency === "USD";
  const demoMode = useMemo(
    () => isUsdWorkspace || isBrowserDemoSurface() || Boolean(status?.demoMode),
    [isUsdWorkspace, status?.demoMode],
  );

  const loadStatus = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const statusResponse = await fetch("/api/financials/wise/status", { cache: "no-store" });
      const statusData = await readApiJson<
        WiseConnectionStatus & { error?: string; demoMode?: boolean }
      >(statusResponse);
      if (!statusResponse.ok) {
        throw new Error(statusData.error ?? "Failed to check Wise connection.");
      }
      setStatus(statusData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load Wise data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadStatus("initial");
    });
  }, [loadStatus]);

  return (
    <TreasuryShell
      status={status}
      loading={loading}
      refreshing={refreshing}
      error={error}
      onRefresh={() => void loadStatus("refresh")}
      isAdmin
      demoMode={demoMode}
      reportingCurrency={reportingCurrency as "GBP" | "USD" | "EUR"}
      initialView={treasuryView}
      areaTitle={areaTitle}
      areaDescription={areaDescription}
    />
  );
}
