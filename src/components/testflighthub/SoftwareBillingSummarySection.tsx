"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import SoftwareSaasDashboard from "@/components/testflighthub/software-saas/SoftwareSaasDashboard";
import { buildSoftwareSaasDashboard } from "@/lib/software-billing/build-software-saas-dashboard";
import type { SoftwareBillingSummary } from "@/lib/software-billing/types";
import { isInternalDomainHost } from "@/lib/app-domains";

/**
 * Internal-host Software & SaaS billing dashboard.
 * Fetches the existing summary API and maps it into the generic dashboard model.
 * Does not change Vercel sync/auth — Sync still posts to the existing Vercel sync route.
 */
export default function SoftwareBillingSummarySection() {
  const [enabled, setEnabled] = useState(false);
  const [summary, setSummary] = useState<SoftwareBillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/software-billing/summary", { cache: "no-store" });
      const data = (await response.json()) as { summary?: SoftwareBillingSummary; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to load billing summary");
      setSummary(data.summary ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load billing summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    if (!isInternalDomainHost(host)) {
      setEnabled(false);
      setLoading(false);
      return;
    }
    setEnabled(true);
    void load();
  }, [load]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/software-billing/vercel/sync", {
        method: "POST",
      });
      const data = (await response.json()) as {
        summary?: SoftwareBillingSummary;
        result?: { ok?: boolean; error?: string };
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Sync failed");
      if (data.result && !data.result.ok) {
        throw new Error(data.result.error ?? "Sync failed");
      }
      setSummary(data.summary ?? null);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const dashboard = useMemo(
    () => (summary ? buildSoftwareSaasDashboard({ summary }) : null),
    [summary],
  );

  if (!enabled) return null;

  return (
    <SoftwareSaasDashboard
      dashboard={dashboard}
      loading={loading}
      syncing={syncing}
      error={error}
      onSync={() => void handleSync()}
    />
  );
}

export function useSoftwareBillingSummary(enabled: boolean) {
  const [summary, setSummary] = useState<SoftwareBillingSummary | null>(null);

  useEffect(() => {
    if (!enabled) return;
    void fetch("/api/internal/software-billing/summary", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { summary?: SoftwareBillingSummary }) => setSummary(data.summary ?? null))
      .catch(() => undefined);
  }, [enabled]);

  return summary;
}
