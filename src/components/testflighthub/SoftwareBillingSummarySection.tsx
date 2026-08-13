"use client";



import { useCallback, useEffect, useMemo, useState } from "react";



import SoftwareSaasDashboard from "@/components/testflighthub/software-saas/SoftwareSaasDashboard";

import { buildSoftwareSaasDashboard } from "@/lib/software-billing/build-software-saas-dashboard";

import type { ProviderBillingInvoice } from "@/lib/software-billing/billing-invoice-model";
import type { ProviderBillingContext, SoftwareBillingSummary } from "@/lib/software-billing/types";

import { isInternalDomainHost } from "@/lib/app-domains";



/**

 * Internal-host Software & SaaS billing dashboard.

 * Fetches billing summary + provider snapshot contexts and maps into the generic dashboard model.

 */

export default function SoftwareBillingSummarySection() {

  const [enabled, setEnabled] = useState(false);

  const [summary, setSummary] = useState<SoftwareBillingSummary | null>(null);

  const [providerInvoices, setProviderInvoices] = useState<ProviderBillingInvoice[]>([]);

  const [providerContexts, setProviderContexts] = useState<
    Partial<Record<string, ProviderBillingContext>>
  >({});

  const [loading, setLoading] = useState(true);

  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const load = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const response = await fetch("/api/internal/software-billing/summary", { cache: "no-store" });

      const data = (await response.json()) as {
        summary?: SoftwareBillingSummary;
        providerContexts?: Partial<Record<string, ProviderBillingContext>>;
        providerInvoices?: ProviderBillingInvoice[];
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "Failed to load billing summary");

      setSummary(data.summary ?? null);
      setProviderContexts(data.providerContexts ?? {});
      setProviderInvoices(data.providerInvoices ?? []);

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

      const response = await fetch("/api/internal/software-billing/sync", {

        method: "POST",

      });

      const data = (await response.json()) as {

        summary?: SoftwareBillingSummary;

        providerContexts?: Partial<Record<string, ProviderBillingContext>>;

        results?: Array<{ ok?: boolean; error?: string }>;

        error?: string;

      };

      if (!response.ok) throw new Error(data.error ?? "Sync failed");

      const failed = (data.results ?? []).filter((row) => !row.ok);

      if (failed.length > 0) {

        const messages = failed.map((row) => row.error).filter(Boolean);

        if (messages.length > 0) {

          throw new Error(messages.join("; "));

        }

      }

      setSummary(data.summary ?? null);

      if (data.providerContexts) setProviderContexts(data.providerContexts);

      else await load();

    } catch (syncError) {

      setError(syncError instanceof Error ? syncError.message : "Sync failed");

    } finally {

      setSyncing(false);

    }

  }



  const dashboard = useMemo(

    () =>

      summary

        ? buildSoftwareSaasDashboard({
            summary,
            providerContexts: providerContexts as Partial<
              Record<ProviderBillingContext["providerSlug"], ProviderBillingContext>
            >,
            providerInvoices,
          })
        : null,

    [summary, providerContexts, providerInvoices],

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

  const [syncing, setSyncing] = useState(false);

  const [syncError, setSyncError] = useState<string | null>(null);



  const reload = useCallback(async () => {

    if (!enabled) return;

    const response = await fetch("/api/internal/software-billing/summary", { cache: "no-store" });

    const data = (await response.json()) as { summary?: SoftwareBillingSummary };

    setSummary(data.summary ?? null);

  }, [enabled]);



  useEffect(() => {

    if (!enabled) return;

    void reload().catch(() => undefined);

  }, [enabled, reload]);



  const syncNow = useCallback(async () => {

    if (!enabled) return;

    setSyncing(true);

    setSyncError(null);

    try {

      const response = await fetch("/api/internal/software-billing/sync", {

        method: "POST",

      });

      const data = (await response.json()) as {

        summary?: SoftwareBillingSummary;

        results?: Array<{ ok?: boolean; error?: string }>;

        error?: string;

      };

      if (!response.ok) throw new Error(data.error ?? "Sync failed");

      const failed = (data.results ?? []).filter((row) => !row.ok);

      if (failed.length > 0) {

        throw new Error(failed.map((row) => row.error).filter(Boolean).join("; ") || "Sync failed");

      }

      setSummary(data.summary ?? null);

    } catch (error) {

      setSyncError(error instanceof Error ? error.message : "Sync failed");

    } finally {

      setSyncing(false);

    }

  }, [enabled]);



  return { summary, syncing, syncNow, syncError };

}


