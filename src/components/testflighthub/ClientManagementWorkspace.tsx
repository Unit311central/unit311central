"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";

import type { ClientFinanceSummary } from "@/lib/accounting/client-finance";
import {
  CLIENT_CONTRACT_OPTIONS,
  CLIENT_COUNTRY_OPTIONS,
  CLIENT_INDUSTRY_OPTIONS,
  CLIENT_STATUS_OPTIONS,
  canTransitionClientAccountStatus,
  clientCitiesForCountry,
  clientFieldsEqual,
  clientStatusClass,
  composeLegacyRegion,
  formatClientLocation,
  resolveClientLocation,
  type ClientAccountStatus,
  type ManagedClient,
} from "@/lib/client-management-data";
import { isCrmLinkedClientNotes } from "@/lib/crm-lead-client-data";
import { centralLoginUrl } from "@/lib/app-domains";
import { copyTextToClipboard } from "@/lib/clipboard";
import { clientLogoUrl } from "@/lib/support-email-html";
import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";
import { cn } from "@/lib/utils";
import {
  fetchCachedJson,
  invalidateCachedJson,
  peekCachedJson,
  PLATFORM_CACHE_KEYS,
} from "@/lib/platform-fetch-cache";
import WorkspaceLoadingFallback from "@/components/testflighthub/WorkspaceLoadingFallback";
import ResponsiveMasterDetail, {
  useMobileDetailPanel,
} from "@/components/ui/ResponsiveMasterDetail";
import { resolveAbhiMemberPortalAbsoluteUrl } from "@/lib/abhi/member-portal-routes";
import { resolveOnwardAirClientPortalAbsoluteUrl } from "@/lib/onwardair/client-portal-routes";
import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { isBrowserCorpCentreSurface } from "@/lib/corpcentre-surface";
import { ExternalLink, FolderOpen, FolderPlus, Link2, Loader2, Plus, Save, Search, Trash2 } from "lucide-react";

function formatFinanceMoney(amount: number, currency = "EUR") {
  const { withPreferredCurrencySymbol } =
    require("@/lib/accounting/chart-of-accounts") as typeof import("@/lib/accounting/chart-of-accounts");
  const code = String(currency || "EUR").toUpperCase();
  return withPreferredCurrencySymbol(
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount),
    code,
  );
}

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html") || /^\s*</.test(text)) {
      throw new Error(
        `API returned HTML instead of JSON (${response.status}${response.url ? ` ${response.url}` : ""}).`,
      );
    }
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

type ClientManagementWorkspaceProps = {
  onClientsChange?: (clients: ManagedClient[]) => void;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

export default function ClientManagementWorkspace({
  onClientsChange,
}: ClientManagementWorkspaceProps) {
  const basePath = useInternalOperationsBasePath();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<ManagedClient | null>(null);
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterContract, setFilterContract] = useState("all");
  const [detailClientId, setDetailClientId] = useState<string | null>(null);
  const [financeSummary, setFinanceSummary] = useState<ClientFinanceSummary | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const snapshottedIdRef = useRef<string | null>(null);
  const detailSectionRef = useRef<HTMLElement>(null);
  const detailTopRef = useRef<HTMLDivElement>(null);
  const pinDetailTopRef = useRef(false);
  const deepLinkedClientRef = useRef<string | null>(null);
  const isCorpCentre =
    typeof window !== "undefined" ? isBrowserCorpCentreSurface() : false;
  const isAbhi = typeof window !== "undefined" ? isBrowserAbhiSurface() : false;
  const isOnwardAir = typeof window !== "undefined" ? isBrowserOnwardAirSurface() : false;
  const { showDetail, openDetail, closeDetail } = useMobileDetailPanel();

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const detailClient = useMemo(
    () => clients.find((client) => client.id === detailClientId) ?? null,
    [clients, detailClientId],
  );

  const isDirty = useMemo(() => {
    if (!selectedClient) return false;
    if (!savedSnapshot || savedSnapshot.id !== selectedClient.id) return true;
    return !clientFieldsEqual(selectedClient, savedSnapshot);
  }, [selectedClient, savedSnapshot]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const location = resolveClientLocation(client);
      if (filterIndustry !== "all" && client.industry !== filterIndustry) return false;
      if (filterCountry !== "all" && location.country !== filterCountry) return false;
      if (filterCity !== "all" && location.city !== filterCity) return false;
      if (filterStatus !== "all" && client.accountStatus !== filterStatus) return false;
      if (filterContract !== "all" && client.contractType !== filterContract) return false;
      if (!query) return true;

      const haystack = [
        client.companyName,
        client.primaryContact,
        client.email,
        location.country,
        location.city,
        formatClientLocation(location),
        client.industry,
        client.contractType,
        client.accountStatus,
        client.billingAddress,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [clients, filterContract, filterCountry, filterCity, filterIndustry, filterStatus, search]);

  const countryFilterOptions = useMemo(() => {
    const fromClients = new Set<string>();
    for (const client of clients) {
      const country = resolveClientLocation(client).country;
      if (country) fromClients.add(country);
    }
    for (const option of CLIENT_COUNTRY_OPTIONS) fromClients.add(option);
    return Array.from(fromClients).sort((a, b) => a.localeCompare(b));
  }, [clients]);

  const cityFilterOptions = useMemo(() => {
    const cities = new Set<string>();
    for (const client of clients) {
      const location = resolveClientLocation(client);
      if (filterCountry !== "all" && location.country !== filterCountry) continue;
      if (location.city) cities.add(location.city);
    }
    if (filterCountry !== "all") {
      for (const city of clientCitiesForCountry(filterCountry)) cities.add(city);
    }
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [clients, filterCountry]);

  const selectedLocation = useMemo(
    () => (selectedClient ? resolveClientLocation(selectedClient) : { country: "", city: "" }),
    [selectedClient],
  );

  const selectedCityOptions = useMemo(() => {
    const cities = new Set(clientCitiesForCountry(selectedLocation.country));
    if (selectedLocation.city) cities.add(selectedLocation.city);
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [selectedLocation.country, selectedLocation.city]);

  function patchSelectedLocation(next: { country?: string; city?: string }) {
    if (!selectedClient) return;
    const country = next.country !== undefined ? next.country : selectedLocation.country;
    const city = next.city !== undefined ? next.city : selectedLocation.city;
    patchSelected({
      companyCountry: country,
      companyCity: city,
      region: composeLegacyRegion(country, city),
    });
  }

  function pinClientRecordTop() {
    const target = detailTopRef.current ?? detailSectionRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior: "auto", block: "start", inline: "nearest" });
  }

  function openClient(clientId: string) {
    setSelectedClientId(clientId);
    setDetailClientId(clientId);
    openDetail();
    pinDetailTopRef.current = true;
    // Keep the detail pane at its top (list stays on the left — no page jump to a stacked form).
    window.requestAnimationFrame(() => {
      const pane = detailSectionRef.current;
      if (pane) pane.scrollTop = 0;
      pinClientRecordTop();
      window.setTimeout(() => {
        if (pane) pane.scrollTop = 0;
        if (pinDetailTopRef.current) pinClientRecordTop();
        pinDetailTopRef.current = false;
      }, 120);
    });
  }

  const syncClients = useCallback(
    (nextClients: ManagedClient[]) => {
      setClients(nextClients);
      onClientsChange?.(nextClients);
    },
    [onClientsChange],
  );

  const loadClients = useCallback(async () => {
    setError(null);

    // Paint instantly from shared shell cache (dashboard / other views often warm this).
    const cached = peekCachedJson<{ clients?: ManagedClient[] }>(PLATFORM_CACHE_KEYS.clients);
    if (cached?.clients?.length) {
      syncClients(cached.clients);
      setSelectedClientId((current) => {
        if (current && cached.clients!.some((client) => client.id === current)) return current;
        return cached.clients![0]?.id ?? null;
      });
      setDetailClientId((current) => {
        if (current && cached.clients!.some((client) => client.id === current)) return current;
        return cached.clients![0]?.id ?? null;
      });
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      // Lounge tokens are minted on create / copy — do not block the directory load.
      const data = await fetchCachedJson<{ clients?: ManagedClient[] }>(
        PLATFORM_CACHE_KEYS.clients,
        "/api/clients",
        { ttlMs: 120_000, timeoutMs: 25_000 },
      );

      const nextClients = data.clients ?? [];
      syncClients(nextClients);
      setSelectedClientId((current) => {
        if (current && nextClients.some((client) => client.id === current)) return current;
        return nextClients[0]?.id ?? null;
      });
      setDetailClientId((current) => {
        if (current && nextClients.some((client) => client.id === current)) return current;
        return nextClients[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load clients");
      if (!cached?.clients?.length) {
        syncClients([]);
        setSelectedClientId(null);
        setDetailClientId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [syncClients]);

  useEffect(() => {
    startTransition(() => {
      void loadClients();
    });
  }, [loadClients]);

  useEffect(() => {
    const onClientsChanged = () => {
      invalidateCachedJson(PLATFORM_CACHE_KEYS.clients);
      void loadClients();
    };
    window.addEventListener("unit311:clients-changed", onClientsChanged);
    return () => window.removeEventListener("unit311:clients-changed", onClientsChanged);
  }, [loadClients]);

  useEffect(() => {
    const deepLinkId = searchParams.get("clientId");
    if (!deepLinkId || loading || clients.length === 0) return;
    if (deepLinkedClientRef.current === deepLinkId) return;
    if (!clients.some((client) => client.id === deepLinkId)) return;
    deepLinkedClientRef.current = deepLinkId;
    openClient(deepLinkId);
  }, [searchParams, loading, clients]);

  useEffect(() => {
    startTransition(() => {
      if (!selectedClientId) {
        snapshottedIdRef.current = null;
        setSavedSnapshot(null);
        return;
      }
      if (snapshottedIdRef.current === selectedClientId) return;
      const client = clients.find((item) => item.id === selectedClientId);
      if (client) {
        snapshottedIdRef.current = selectedClientId;
        setSavedSnapshot({ ...client });
      }
    });
  }, [selectedClientId, clients]);

  useEffect(() => {
    if (!selectedClient?.id) {
      startTransition(() => {
        setFinanceSummary(null);
        setFinanceError(null);
        setFinanceLoading(false);
      });
      return;
    }

    const clientId = selectedClient.id;
    let cancelled = false;

    async function loadFinanceSummary() {
      setFinanceLoading(true);
      setFinanceError(null);
      setFinanceSummary(null);

      try {
        const response = await fetch(`/api/financials/clients/${encodeURIComponent(clientId)}/summary`, {
          cache: "no-store",
        });
        const data = await readApiJson<{ summary?: ClientFinanceSummary; error?: string }>(response);
        if (!response.ok || !data.summary) {
          throw new Error(data.error ?? "Failed to load finance summary");
        }
        if (!cancelled) setFinanceSummary(data.summary);
      } catch (loadError) {
        if (!cancelled) {
          setFinanceSummary(null);
          setFinanceError(
            loadError instanceof Error ? loadError.message : "Failed to load finance summary",
          );
        }
      } finally {
        if (!cancelled) {
          setFinanceLoading(false);
          // Finance block mount can scroll-anchor the page downward after Open.
          if (pinDetailTopRef.current && !isCorpCentre) {
            window.requestAnimationFrame(() => pinClientRecordTop());
          }
        }
      }
    }

    startTransition(() => {
      void loadFinanceSummary();
    });
    return () => {
      cancelled = true;
    };
  }, [selectedClient?.id, isCorpCentre]);

  function patchSelected(patch: Partial<ManagedClient>) {
    if (!selectedClient) return;
    const next = { ...selectedClient, ...patch };
    syncClients(clients.map((client) => (client.id === next.id ? next : client)));
    setSaveMessage(null);
  }

  async function saveClient(client: ManagedClient) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(client),
      });

      const data = await readApiJson<{ client?: ManagedClient; error?: string }>(response);
      if (!response.ok || !data.client) throw new Error(data.error ?? "Failed to save client");

      invalidateCachedJson(PLATFORM_CACHE_KEYS.clients);
      syncClients(clients.map((item) => (item.id === data.client!.id ? data.client! : item)));
      snapshottedIdRef.current = data.client.id;
      setSavedSnapshot(data.client);
      setSaveMessage("Client saved");
      return data.client;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save client");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveClient() {
    if (!selectedClient) return;
    setError(null);
    setSaveMessage(null);
    await saveClient(selectedClient);
  }

  async function handleResetWorkspaceOnboarding() {
    if (!selectedClient) return;
    setBusy(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch(
        `/api/clients/${selectedClient.id}/reset-workspace-onboarding`,
        { method: "POST" },
      );
      const data = await readApiJson<{
        ok?: boolean;
        error?: string;
        message?: string;
        slug?: string;
      }>(response);
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Failed to reset workspace onboarding.");
      }
      setSaveMessage(
        data.message ??
          `Workspace onboarding reset${data.slug ? ` for ${data.slug}` : ""}. Next login opens the wizard.`,
      );
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : "Failed to reset workspace onboarding.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCopySupportLoungeLink() {
    if (!selectedClient) return;
    setBusy(true);
    setError(null);
    setSaveMessage(null);

    try {
      let url = selectedClient.supportLoungeUrl?.trim() || "";

      // Prefer the already-minted URL so clipboard can run in the same user gesture.
      if (!url) {
        const response = await fetch(`/api/clients/${selectedClient.id}/support-lounge`, {
          method: "POST",
        });
        const data = await readApiJson<{ url?: string; error?: string }>(response);
        if (!response.ok || !data.url) {
          throw new Error(data.error ?? "Failed to create support lounge link.");
        }
        url = data.url;
      }

      setClients((current) =>
        current.map((client) =>
          client.id === selectedClient.id ? { ...client, supportLoungeUrl: url } : client,
        ),
      );

      const copied = await copyTextToClipboard(url);
      setSaveMessage(
        copied
          ? `Support Lounge link copied: ${url}`
          : `Support Lounge link ready — copy from the URL below: ${url}`,
      );
    } catch (loungeError) {
      setError(
        loungeError instanceof Error ? loungeError.message : "Failed to create support lounge link.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAddClient() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: "New Client" }),
      });

      const data = await readApiJson<{ client?: ManagedClient; error?: string }>(response);
      if (!response.ok || !data.client) throw new Error(data.error ?? "Failed to create client");

      invalidateCachedJson(PLATFORM_CACHE_KEYS.clients);
      syncClients([data.client, ...clients]);
      setSelectedClientId(data.client.id);
      setDetailClientId(data.client.id);
      snapshottedIdRef.current = data.client.id;
      setSavedSnapshot(data.client);
      setSaveMessage("Client created");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create client");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteClient(client?: ManagedClient) {
    const target = client ?? selectedClient;
    if (!target) return;
    if (!window.confirm(
      `Delete client "${target.companyName}"?\n\nUnpaid invoices linked to this client will also be removed. Paid invoices cannot be deleted.`,
    )) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${target.id}`, { method: "DELETE" });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete client");

      invalidateCachedJson(PLATFORM_CACHE_KEYS.clients);
      const remaining = clients.filter((item) => item.id !== target.id);
      syncClients(remaining);
      if (detailClientId === target.id) setDetailClientId(null);
      if (selectedClientId === target.id) setSelectedClientId(remaining[0]?.id ?? null);
      setSaveMessage(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete client");
    } finally {
      setBusy(false);
    }
  }

  async function createClientFolder(client: ManagedClient) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${encodeURIComponent(client.id)}/files-root`, {
        method: "POST",
      });
      const data = await readApiJson<{
        client?: ManagedClient;
        error?: string;
      }>(response);
      if (!response.ok || !data.client) {
        throw new Error(data.error ?? "Failed to ensure client folder");
      }

      setClients((current) =>
        current.map((item) => (item.id === data.client!.id ? data.client! : item)),
      );
      setSaveMessage(
        `Folder "${data.client.filesFolderName ?? data.client.companyName}" ready`,
      );
    } catch (folderError) {
      setError(folderError instanceof Error ? folderError.message : "Failed to create folder");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          {error.includes("Could not find the table") && error.includes("internal_clients") ? (
            <span className="mt-2 block text-xs text-red-200/80">
              Run{" "}
              <span className="font-mono">supabase/migrations/037_create_internal_clients.sql</span>{" "}
              in Supabase.
            </span>
          ) : null}
        </p>
      )}

      {loading ? (
        <WorkspaceLoadingFallback variant="list" label="Loading clients" />
      ) : (
        <ResponsiveMasterDetail
          showDetail={showDetail}
          onBack={() => {
            closeDetail();
            setDetailClientId(null);
          }}
          backLabel="Back to clients"
          columnsClassName="xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]"
          className="min-h-[70vh] xl:items-start"
          master={
            <section className="flex max-h-[78vh] flex-col rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-xs text-white/45">{clients.length} accounts</p>
                <button
                  type="button"
                  onClick={() => void handleAddClient()}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Client
                </button>
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search clients…"
                  className={cn(inputClassName(), "mt-0 pl-10")}
                />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                  <FieldLabel>Industry</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={filterIndustry}
                    onChange={(event) => setFilterIndustry(event.target.value)}
                  >
                    <option value="all">All industries</option>
                    {CLIENT_INDUSTRY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={filterCountry}
                    onChange={(event) => {
                      setFilterCountry(event.target.value);
                      setFilterCity("all");
                    }}
                  >
                    <option value="all">All countries</option>
                    {countryFilterOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={filterCity}
                    onChange={(event) => setFilterCity(event.target.value)}
                  >
                    <option value="all">All cities</option>
                    {cityFilterOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {CLIENT_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Contract</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={filterContract}
                    onChange={(event) => setFilterContract(event.target.value)}
                  >
                    <option value="all">All contract types</option>
                    {CLIENT_CONTRACT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredClients.length === 0 ? (
                <p className="mt-4 text-sm text-white/45">
                  {clients.length === 0
                    ? "No clients in this workspace yet. Create a client to get started."
                    : "No clients match your search."}
                </p>
              ) : (
                <ul className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1524]/40 p-1">
                  {filteredClients.map((client) => {
                    const selected = client.id === detailClientId;
                    return (
                      <li key={client.id}>
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-2.5 py-2.5 transition-colors",
                            selected
                              ? "bg-sky-500/15 ring-1 ring-sky-400/30"
                              : "hover:bg-white/[0.04]",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => openClient(client.id)}
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={clientLogoUrl(client.companyName, client.id)}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-8 w-8 shrink-0 rounded-lg border border-white/10 bg-white/90 object-cover"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-white">
                                {client.companyName}
                              </span>
                              <span className="mt-0.5 block truncate text-[11px] text-white/45">
                                {formatClientLocation(client) ||
                                  client.primaryContact ||
                                  client.industry}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                                clientStatusClass(client.accountStatus),
                              )}
                            >
                              {client.accountStatus}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteClient(client)}
                            disabled={busy}
                            aria-label={`Delete ${client.companyName}`}
                            title={`Delete ${client.companyName}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-200 transition-colors hover:border-red-400/50 hover:bg-red-500/20 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          }
          detail={
            detailClient && selectedClient ? (
              <section
                ref={detailSectionRef}
                className="max-h-[78vh] overflow-y-auto rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl [overflow-anchor:none] sm:p-6"
              >
                <div ref={detailTopRef} tabIndex={-1} className="h-0 outline-none" aria-hidden />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
                      Client Record
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={clientLogoUrl(selectedClient.companyName, selectedClient.id)}
                        alt=""
                        className="mr-2 inline-block h-8 w-8 rounded-lg border border-white/10 bg-white/90 object-cover align-middle"
                      />
                      {selectedClient.companyName || "New Client"}
                    </h2>
                    <p className="mt-1 text-sm text-white/50">
                      {formatClientLocation(selectedClient) || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`${basePath}?view=projects-external&clientId=${encodeURIComponent(selectedClient.id)}`}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-400/60 hover:bg-amber-500/25"
                    >
                      Projects ({selectedClient.activeProjects})
                    </Link>
                    {selectedClient.filesFolderId ? (
                      <>
                        <Link
                          href={
                            isAbhi
                              ? `${basePath}?view=files-client&folderId=${encodeURIComponent(selectedClient.filesFolderId)}`
                              : `${basePath}?view=files-client`
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25"
                        >
                          <FolderOpen className="h-3.5 w-3.5" />
                          {isAbhi ? "Member Folder" : "Open client files"}
                        </Link>
                        {!isAbhi ? (
                          <Link
                            href={`${basePath}?view=files-internal&folderId=${encodeURIComponent(selectedClient.filesFolderId)}`}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08]"
                          >
                            Open in internal files
                          </Link>
                        ) : null}
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void createClientFolder(selectedClient)}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25 disabled:opacity-60"
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                        {isAbhi ? "Member Folder" : "Ensure files folder"}
                      </button>
                    )}
                    {isAbhi ? (
                      <div className="w-full rounded-xl border border-sky-400/20 bg-sky-500/5 px-3 py-2 sm:col-span-full">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200/80">
                          Member portal URL
                        </p>
                        <a
                          href={resolveAbhiMemberPortalAbsoluteUrl(selectedClient)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1.5 break-all text-xs text-sky-100 underline-offset-2 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {resolveAbhiMemberPortalAbsoluteUrl(selectedClient)}
                        </a>
                      </div>
                    ) : isOnwardAir && resolveOnwardAirClientPortalAbsoluteUrl(selectedClient) ? (
                      <div className="w-full rounded-xl border border-teal-400/20 bg-teal-500/5 px-3 py-2 sm:col-span-full">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-200/80">
                          Client portal URL
                        </p>
                        <a
                          href={resolveOnwardAirClientPortalAbsoluteUrl(selectedClient)!}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1.5 break-all text-xs text-teal-100 underline-offset-2 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {resolveOnwardAirClientPortalAbsoluteUrl(selectedClient)}
                        </a>
                      </div>
                    ) : selectedClient.platformUrl ? (
                      <Link
                        href={selectedClient.platformUrl}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Intelligence Platform
                      </Link>
                    ) : null}
                    {selectedClient.supportLoungeUrl ? (
                      <div className="w-full rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 sm:col-span-full">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/80">
                          Support Lounge URL
                        </p>
                        <a
                          href={selectedClient.supportLoungeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block break-all text-xs text-emerald-100 underline-offset-2 hover:underline"
                        >
                          {selectedClient.supportLoungeUrl}
                        </a>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleCopySupportLoungeLink()}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Copy Support Lounge link
                    </button>
                    {/fotheringham/i.test(selectedClient.companyName) && (
                      <button
                        type="button"
                        onClick={() => void handleResetWorkspaceOnboarding()}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-500/25 disabled:opacity-60"
                      >
                        Reset Onboarding (Test)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSaveClient()}
                      disabled={busy || !isDirty}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteClient()}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                        clientStatusClass(selectedClient.accountStatus),
                      )}
                    >
                      {selectedClient.accountStatus}
                    </span>
                  </div>
                </div>

                {saveMessage && (
                  <p className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {saveMessage}
                  </p>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>Company Name</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.companyName}
                      onChange={(event) => patchSelected({ companyName: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Industry</FieldLabel>
                    <select
                      className={inputClassName()}
                      value={selectedClient.industry}
                      onChange={(event) =>
                        patchSelected({ industry: event.target.value as ManagedClient["industry"] })
                      }
                      disabled={busy}
                    >
                      {CLIENT_INDUSTRY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Country</FieldLabel>
                    <select
                      className={inputClassName()}
                      value={selectedLocation.country}
                      onChange={(event) =>
                        patchSelectedLocation({ country: event.target.value, city: "" })
                      }
                      disabled={busy}
                    >
                      <option value="">Select country</option>
                      {Array.from(
                        new Set([
                          ...CLIENT_COUNTRY_OPTIONS,
                          ...(selectedLocation.country ? [selectedLocation.country] : []),
                        ]),
                      ).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <input
                      className={inputClassName()}
                      list="member-city-suggestions"
                      value={selectedLocation.city}
                      onChange={(event) => patchSelectedLocation({ city: event.target.value })}
                      disabled={busy || !selectedLocation.country}
                      placeholder="City"
                    />
                    <datalist id="member-city-suggestions">
                      {selectedCityOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <FieldLabel>Primary Contact</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.primaryContact}
                      onChange={(event) => patchSelected({ primaryContact: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Primary Contact First Name</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.primaryContactFirstName ?? ""}
                      onChange={(event) =>
                        patchSelected({ primaryContactFirstName: event.target.value })
                      }
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Primary Contact Surname</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.primaryContactSurname ?? ""}
                      onChange={(event) =>
                        patchSelected({ primaryContactSurname: event.target.value })
                      }
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      className={inputClassName()}
                      value={selectedClient.email}
                      onChange={(event) => patchSelected({ email: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Phone</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.phone}
                      onChange={(event) => patchSelected({ phone: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Role</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.jobTitle ?? ""}
                      onChange={(event) => patchSelected({ jobTitle: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Account Status</FieldLabel>
                    <select
                      className={inputClassName()}
                      value={selectedClient.accountStatus}
                      onChange={(event) =>
                        patchSelected({
                          accountStatus: event.target.value as ManagedClient["accountStatus"],
                        })
                      }
                      disabled={busy || selectedClient.accountStatus === "Archived"}
                    >
                      {CLIENT_STATUS_OPTIONS.filter(
                        (option) =>
                          option === selectedClient.accountStatus ||
                          canTransitionClientAccountStatus(
                            selectedClient.accountStatus as ClientAccountStatus,
                            option,
                          ),
                      ).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {selectedClient.crmLeadId ||
                    isCrmLinkedClientNotes(selectedClient.notes) ? (
                      <p className="mt-1 text-[11px] text-white/45">
                        CRM lineage linked — Directory owns lifecycle (Prospect remains in CRM).
                      </p>
                    ) : null}
                    {selectedClient.accountStatus === "Archived" ? (
                      <p className="mt-1 text-[11px] text-white/45">
                        Archived is terminal and cannot transition to another status.
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <FieldLabel>Contract Type</FieldLabel>
                    <select
                      className={inputClassName()}
                      value={selectedClient.contractType}
                      onChange={(event) =>
                        patchSelected({
                          contractType: event.target.value as ManagedClient["contractType"],
                        })
                      }
                      disabled={busy}
                    >
                      {CLIENT_CONTRACT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Tax / VAT ID</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.taxId}
                      onChange={(event) => patchSelected({ taxId: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Projects</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      className={inputClassName()}
                      value={selectedClient.activeProjects}
                      readOnly
                      disabled
                      title="Derived from linked projects — not edited here"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Company Address</FieldLabel>
                    <textarea
                      rows={3}
                      className={inputClassName()}
                      value={selectedClient.companyAddress ?? ""}
                      onChange={(event) => patchSelected({ companyAddress: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Company Postcode</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.companyPostcode ?? ""}
                      onChange={(event) => patchSelected({ companyPostcode: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Accounts Payable Email</FieldLabel>
                    <input
                      type="email"
                      className={inputClassName()}
                      value={
                        selectedClient.accountsPayableEmail ??
                        selectedClient.invoiceEmail ??
                        ""
                      }
                      onChange={(event) =>
                        patchSelected({
                          accountsPayableEmail: event.target.value,
                          invoiceEmail: event.target.value,
                        })
                      }
                      disabled={busy}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Billing Address</FieldLabel>
                    <input
                      className={inputClassName()}
                      value={selectedClient.billingAddress}
                      onChange={(event) => patchSelected({ billingAddress: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <FieldLabel>Subscription Status</FieldLabel>
                    <p className={cn(inputClassName(), "mt-1.5 text-white/75")}>
                      {selectedClient.subscriptionStatus ?? "—"}
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Billing Frequency</FieldLabel>
                    <p className={cn(inputClassName(), "mt-1.5 text-white/75")}>
                      {selectedClient.billingFrequency ?? "—"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Renewal Date</FieldLabel>
                    <p className={cn(inputClassName(), "mt-1.5 text-white/75")}>
                      {selectedClient.renewalDate ?? "—"}
                    </p>
                  </div>
                  <div className="sm:col-span-2 rounded-xl border border-white/10 bg-[#0b1524]/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
                        Finance
                      </p>
                      {financeLoading && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading…
                        </span>
                      )}
                    </div>
                    {financeError && (
                      <div className="mt-3 space-y-1 text-xs text-red-300">
                        <p>{financeError}</p>
                        {/unauthorized|authentication required/i.test(financeError) ? (
                          <p className="text-red-200/80">
                            <a
                              href={centralLoginUrl()}
                              className="font-semibold underline underline-offset-2 hover:text-white"
                            >
                              Sign in again
                            </a>{" "}
                            to load invoices and payments.
                          </p>
                        ) : null}
                      </div>
                    )}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-white/10 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                          Outstanding Balance
                        </p>
                        <p className="mt-1 font-mono text-sm text-white/90">
                          {formatFinanceMoney(financeSummary?.outstandingBalance ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                          Financial Summary
                        </p>
                        <p className="mt-1 text-sm text-white/75">
                          {(financeSummary?.invoices.length ?? 0)} invoices ·{" "}
                          {(financeSummary?.payments.length ?? 0)} payments ·{" "}
                          {
                            (financeSummary?.invoices.filter(
                              (invoice) =>
                                invoice.status === "issued" || invoice.status === "overdue",
                            ).length ?? 0)
                          }{" "}
                          open
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                          Invoices
                        </p>
                        {(financeSummary?.invoices.length ?? 0) === 0 ? (
                          <p className="mt-2 text-xs text-white/40">No invoices</p>
                        ) : (
                          <ul className="mt-2 space-y-1.5">
                            {financeSummary!.invoices.map((invoice) => (
                              <li
                                key={invoice.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-xs"
                              >
                                <div>
                                  <Link
                                    href={`${basePath}?view=accounts-receivable`}
                                    className="font-medium text-sky-300 hover:text-sky-200"
                                  >
                                    {invoice.invoiceNumber}
                                  </Link>
                                  <span className="ml-2 text-white/45">{invoice.status}</span>
                                </div>
                                <span className="font-mono text-white/80">
                                  {formatFinanceMoney(invoice.amount, invoice.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                          Payments
                        </p>
                        {(financeSummary?.payments.length ?? 0) === 0 ? (
                          <p className="mt-2 text-xs text-white/40">No payments</p>
                        ) : (
                          <ul className="mt-2 space-y-1.5">
                            {financeSummary!.payments.map((payment) => (
                              <li
                                key={payment.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-xs"
                              >
                                <div>
                                  <span className="font-medium text-white/85">
                                    {payment.invoiceNumber}
                                  </span>
                                  <span className="ml-2 text-white/45">{payment.paidAt.slice(0, 10)}</span>
                                </div>
                                <span className="font-mono text-emerald-300/90">
                                  {formatFinanceMoney(payment.amount, payment.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      rows={3}
                      className={cn(inputClassName(), "resize-y")}
                      value={selectedClient.notes}
                      onChange={(event) => patchSelected({ notes: event.target.value })}
                      disabled={busy}
                    />
                  </div>
                </div>
              </section>
            ) : (
              <section className="flex min-h-[20rem] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-12 text-center text-sm text-white/45">
                Select a client from the list to view details.
              </section>
            )
          }
        />
      )}
    </div>
  );
}
