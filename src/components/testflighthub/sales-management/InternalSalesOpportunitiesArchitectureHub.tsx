"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderOpen, Loader2, Plus, Save, Search } from "lucide-react";

import CrmLeadDiscoveryEditor from "@/components/testflighthub/CrmLeadDiscoveryEditor";
import SalesQuotesWorkspace from "@/components/testflighthub/SalesQuotesWorkspace";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import type { CrmLead, LeadStatus } from "@/lib/crm-data";
import { LEAD_STATUS_OPTIONS } from "@/lib/crm-data";
import { ClientRecordEditableFields } from "@/components/testflighthub/client-directory/ClientRecordEditableFields";
import {
  CLIENT_RECORD_COUNTRY_OPTIONS,
  clientCitiesForCountry,
  createNewClientDraft,
  resolveClientLocation,
  type ManagedClient,
} from "@/lib/client-management-data";
import { createClientFromDraftRequest } from "@/lib/client-create-from-draft";
import { invalidateCachedJson, PLATFORM_CACHE_KEYS } from "@/lib/platform-fetch-cache";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import type { SurveyOperationsBasePath } from "@/lib/survey-operations-mock-data";
import {
  INTERNAL_OPPORTUNITY_WORKFLOW_FRAMEWORK,
} from "@/lib/internal-sales-opportunities-architecture";
import { filterLeadsBySalesSegment } from "@/lib/sales-management-insights";
import { cn } from "@/lib/utils";

import {
  SalesFilterBar,
  SalesFilterButton,
  SalesTabHeader,
} from "./sales-management-ui";

type HubPanel = "opportunities" | "quotes";
type FlowStep =
  | "list"
  | "create-choose"
  | "pick-client"
  | "create-new-client"
  | "opportunity-form"
  | "discovery-prompt"
  | "record";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

function inputClass() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-violet-400/50";
}

function resolveLinkedClient(lead: CrmLead, clients: ManagedClient[]): ManagedClient | null {
  const byCrm = clients.find((c) => c.crmLeadId === lead.id);
  if (byCrm) return byCrm;
  const name = lead.companyName.trim().toLowerCase();
  if (!name) return null;
  return clients.find((c) => c.companyName.trim().toLowerCase() === name) ?? null;
}

function workflowIndexForLead(lead: CrmLead): number {
  if (lead.status === "Lost" || lead.status === "Won" || lead.status === "Active Customer") {
    return INTERNAL_OPPORTUNITY_WORKFLOW_FRAMEWORK.length - 1;
  }
  if (lead.discoveryNotes?.trim()) return 1;
  if (lead.status === "Hot") return 3;
  if (lead.status === "Warm") return 2;
  return 0;
}

const VISIBLE_OPPORTUNITY_WORKFLOW_STEPS = INTERNAL_OPPORTUNITY_WORKFLOW_FRAMEWORK.filter(
  (step) => step.id !== "engagement",
);

function visibleWorkflowIndexForLead(lead: CrmLead): number {
  const fullIdx = workflowIndexForLead(lead);
  const fullStep = INTERNAL_OPPORTUNITY_WORKFLOW_FRAMEWORK[fullIdx];
  if (!fullStep) return 0;
  if (fullStep.id === "engagement") {
    const documentsIdx = VISIBLE_OPPORTUNITY_WORKFLOW_STEPS.findIndex((step) => step.id === "documents");
    return documentsIdx >= 0 ? documentsIdx : 0;
  }
  const visibleIdx = VISIBLE_OPPORTUNITY_WORKFLOW_STEPS.findIndex((step) => step.id === fullStep.id);
  return visibleIdx >= 0 ? visibleIdx : 0;
}

export default function InternalSalesOpportunitiesArchitectureHub({
  quotesReturnHref,
}: {
  quotesReturnHref: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = useInternalOperationsBasePath();

  const [panel, setPanel] = useState<HubPanel>(() =>
    searchParams.get("panel") === "quotes" ? "quotes" : "opportunities",
  );
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [flow, setFlow] = useState<FlowStep>("list");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [draftLead, setDraftLead] = useState<Partial<CrmLead> | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(
    () => searchParams.get("leadId") ?? searchParams.get("opportunityId"),
  );
  const [showDiscoveryEditor, setShowDiscoveryEditor] = useState(false);
  const [opportunityNewClientDraft, setOpportunityNewClientDraft] = useState<ManagedClient | null>(
    null,
  );
  const [newClientCompanyNameError, setNewClientCompanyNameError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    company: "",
    contact: "",
    country: "",
    city: "",
    sector: "",
    stage: "all" as LeadStatus | "all",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, clientsRes] = await Promise.all([
        fetch("/api/crm/leads", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
      ]);
      const leadsBody = await readApiJson<{ leads?: CrmLead[]; error?: string }>(leadsRes);
      const clientsBody = await readApiJson<{ clients?: ManagedClient[]; error?: string }>(clientsRes);
      if (!leadsRes.ok) throw new Error(leadsBody.error ?? "Failed to load opportunities");
      if (!clientsRes.ok) throw new Error(clientsBody.error ?? "Failed to load clients");
      setLeads(leadsBody.leads ?? []);
      setClients(clientsBody.clients ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPanel(searchParams.get("panel") === "quotes" ? "quotes" : "opportunities");
    const id = searchParams.get("leadId") ?? searchParams.get("opportunityId");
    if (id) {
      setActiveLeadId(id);
      setFlow("record");
    }
    const clientCreated = searchParams.get("clientCreated");
    if (clientCreated) {
      setSelectedClientId(clientCreated);
      const client = clients.find((c) => c.id === clientCreated);
      if (client) applyClientToOpportunityDraft(client);
    }
  }, [searchParams, clients]);

  const opportunities = useMemo(
    () => filterLeadsBySalesSegment(leads, "opportunities"),
    [leads],
  );

  const filtered = useMemo(() => {
    return opportunities.filter((lead) => {
      const client = resolveLinkedClient(lead, clients);
      const locationCountry = client?.companyCountry ?? "";
      const locationCity = client?.companyCity ?? "";
      if (filters.company && !lead.companyName.toLowerCase().includes(filters.company.toLowerCase())) {
        return false;
      }
      if (filters.contact && !lead.contactName.toLowerCase().includes(filters.contact.toLowerCase())) {
        return false;
      }
      if (filters.country && !locationCountry.toLowerCase().includes(filters.country.toLowerCase())) {
        return false;
      }
      if (filters.city && !locationCity.toLowerCase().includes(filters.city.toLowerCase())) {
        return false;
      }
      if (filters.sector && !(lead.source ?? "").toLowerCase().includes(filters.sector.toLowerCase())) {
        return false;
      }
      if (filters.stage !== "all" && lead.status !== filters.stage) return false;
      return true;
    });
  }, [opportunities, clients, filters]);

  const activeLead = useMemo(
    () => leads.find((l) => l.id === activeLeadId) ?? null,
    [leads, activeLeadId],
  );

  const activeClient = useMemo(
    () => (activeLead ? resolveLinkedClient(activeLead, clients) : null),
    [activeLead, clients],
  );

  useEffect(() => {
    if (flow !== "record" || !activeLead) return;
    if (searchParams.get("recordName")?.trim()) return;
    const url = new URL(window.location.href);
    url.searchParams.set("recordName", activeLead.companyName);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  }, [flow, activeLead, searchParams, router]);

  function syncUrl(params: Record<string, string | null>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  }

  function applyClientToOpportunityDraft(client: ManagedClient) {
    const contactFromParts = [client.primaryContactFirstName, client.primaryContactSurname]
      .filter(Boolean)
      .join(" ")
      .trim();
    setSelectedClientId(client.id);
    setDraftLead({
      companyName: client.companyName,
      contactName: client.primaryContact?.trim() || contactFromParts,
      email: client.email,
      phone: client.phone,
      status: "Warm",
    });
    setFlow("opportunity-form");
  }

  async function saveOpportunityNewClient() {
    if (!opportunityNewClientDraft) return;
    const companyName = opportunityNewClientDraft.companyName.trim();
    if (!companyName) {
      setNewClientCompanyNameError("Company name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    setNewClientCompanyNameError(null);
    try {
      const client = await createClientFromDraftRequest({
        ...opportunityNewClientDraft,
        companyName,
      });
      invalidateCachedJson(PLATFORM_CACHE_KEYS.clients);
      setClients((rows) => [client, ...rows]);
      setOpportunityNewClientDraft(null);
      applyClientToOpportunityDraft(client);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setBusy(false);
    }
  }

  function openRecord(leadId: string, recordName?: string) {
    setActiveLeadId(leadId);
    setFlow("record");
    syncUrl({
      leadId,
      opportunityId: leadId,
      recordName: recordName?.trim() || null,
    });
  }

  async function saveOpportunityFromDraft() {
    if (!draftLead?.companyName?.trim() || !draftLead.contactName?.trim()) {
      setError("Company name and contact name are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: draftLead.companyName.trim(),
          contactName: draftLead.contactName.trim(),
          email: draftLead.email,
          phone: draftLead.phone,
          status: draftLead.status ?? "Warm",
          source: draftLead.source,
          notes: draftLead.notes,
          nextAction: draftLead.nextAction,
        }),
      });
      const data = await readApiJson<{ lead?: CrmLead; error?: string }>(response);
      if (!response.ok || !data.lead) throw new Error(data.error ?? "Failed to save opportunity");

      if (selectedClientId) {
        await fetch(`/api/clients/${encodeURIComponent(selectedClientId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crmLeadId: data.lead.id }),
        }).catch(() => undefined);
      }

      await load();
      setActiveLeadId(data.lead.id);
      setFlow("discovery-prompt");
      syncUrl({
        leadId: data.lead.id,
        opportunityId: data.lead.id,
        recordName: data.lead.companyName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save opportunity");
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    { id: "opportunities" as const, label: "Opportunities" },
    { id: "quotes" as const, label: "Sales Quotes" },
  ];

  if (panel === "quotes") {
    return (
      <div className="space-y-4">
        <SalesTabHeader
          title="Sales Quotes"
          description="Independent quote creation remains available here — quotes do not require an opportunity."
        />
        <SalesFilterBar>
          {tabs.map((tab) => (
            <SalesFilterButton
              key={tab.id}
              active={panel === tab.id}
              onClick={() => {
                setPanel(tab.id);
                syncUrl({ panel: tab.id === "quotes" ? "quotes" : null });
              }}
            >
              {tab.label}
            </SalesFilterButton>
          ))}
        </SalesFilterBar>
        <SalesQuotesWorkspace embedded title="Sales Quotes" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {flow !== "record" ? (
        <SalesTabHeader
          title="Opportunities"
          description="Central sales working record — client-linked opportunities with discovery, activities, documents, and quotes in one place (internal architecture)."
        />
      ) : null}

      <SalesFilterBar>
        {tabs.map((tab) => (
          <SalesFilterButton
            key={tab.id}
            active={panel === tab.id}
            onClick={() => {
              setPanel(tab.id);
              syncUrl({ panel: tab.id === "quotes" ? "quotes" : null });
            }}
          >
            {tab.label}
          </SalesFilterButton>
        ))}
      </SalesFilterBar>

      {flow === "record" && activeLead ? (
        <OpportunityRecordShell
          lead={activeLead}
          client={activeClient}
          basePath={basePath}
          quotesReturnHref={quotesReturnHref}
          showDiscoveryEditor={showDiscoveryEditor}
          onOpenDiscovery={() => setShowDiscoveryEditor(true)}
          onCloseDiscovery={() => setShowDiscoveryEditor(false)}
          onBack={() => {
            setFlow("list");
            setActiveLeadId(null);
            setShowDiscoveryEditor(false);
            syncUrl({ leadId: null, opportunityId: null, recordName: null });
          }}
          onReload={() => void load()}
        />
      ) : null}

      {flow !== "record" ? (
        <>
          {flow === "list" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-white/45">
                  {filtered.length} opportunit{filtered.length === 1 ? "y" : "ies"}
                </p>
                <button
                  type="button"
                  onClick={() => setFlow("create-choose")}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 text-xs font-semibold text-violet-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Opportunity
                </button>
              </div>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Search opportunities
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(
                    [
                      ["company", "Company name"],
                      ["contact", "Contact name"],
                      ["country", "Country"],
                      ["city", "City"],
                      ["sector", "Sector"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="text-[10px] uppercase tracking-[0.12em] text-white/45">
                        {label}
                      </label>
                      <input
                        className={inputClass()}
                        value={filters[key]}
                        onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.12em] text-white/45">
                      Stage
                    </label>
                    <select
                      className={inputClass()}
                      value={filters.stage}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, stage: e.target.value as LeadStatus | "all" }))
                      }
                    >
                      <option value="all">All stages</option>
                      {LEAD_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {loading ? (
                <p className="flex items-center gap-2 text-sm text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
              ) : error ? (
                <p className="text-sm text-red-300">{error}</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-white/45">
                      <tr>
                        <th className="px-3 py-2">Company</th>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Stage</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">Discovery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((lead) => (
                        <tr
                          key={lead.id}
                          className="cursor-pointer border-t border-white/8 hover:bg-white/[0.03]"
                          onClick={() => openRecord(lead.id, lead.companyName)}
                        >
                          <td className="px-3 py-2.5 font-medium text-white">{lead.companyName}</td>
                          <td className="px-3 py-2.5 text-white/65">{lead.contactName}</td>
                          <td className="px-3 py-2.5 text-white/65">{lead.status}</td>
                          <td className="px-3 py-2.5 text-white/55">
                            {lead.notes?.slice(0, 80) || lead.nextAction || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              className="text-xs text-violet-300 underline-offset-2 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openRecord(lead.id, lead.companyName);
                                setShowDiscoveryEditor(true);
                              }}
                            >
                              {lead.discoveryNotes?.trim() ? "View" : "Add"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}

          {flow === "create-choose" ? (
            <CreateChoosePanel
              onExisting={() => setFlow("pick-client")}
              onNewClient={() => {
                setError(null);
                setNewClientCompanyNameError(null);
                setOpportunityNewClientDraft(createNewClientDraft());
                setFlow("create-new-client");
              }}
              onCancel={() => setFlow("list")}
            />
          ) : null}

          {flow === "create-new-client" && opportunityNewClientDraft ? (
            <OpportunityCreateNewClientPanel
              draft={opportunityNewClientDraft}
              busy={busy}
              error={error}
              companyNameError={newClientCompanyNameError}
              onChange={(patch) => {
                setOpportunityNewClientDraft((current) =>
                  current ? { ...current, ...patch } : current,
                );
                if ("companyName" in patch) setNewClientCompanyNameError(null);
              }}
              onSave={() => void saveOpportunityNewClient()}
              onBack={() => {
                setOpportunityNewClientDraft(null);
                setFlow("create-choose");
              }}
            />
          ) : null}

          {flow === "pick-client" ? (
            <PickClientPanel
              clients={clients}
              selectedClientId={selectedClientId}
              onSelect={setSelectedClientId}
              onContinue={() => {
                const client = clients.find((c) => c.id === selectedClientId);
                if (!client) {
                  setError("Select a client from the directory.");
                  return;
                }
                applyClientToOpportunityDraft(client);
              }}
              onCancel={() => setFlow("create-choose")}
            />
          ) : null}

          {flow === "opportunity-form" && draftLead ? (
            <OpportunityFormPanel
              draft={draftLead}
              linkedClient={
                selectedClientId ? (clients.find((c) => c.id === selectedClientId) ?? null) : null
              }
              busy={busy}
              error={error}
              onChange={setDraftLead}
              onSave={() => void saveOpportunityFromDraft()}
              onCancel={() => setFlow("list")}
            />
          ) : null}

          {flow === "discovery-prompt" && activeLead ? (
            <DiscoveryPromptPanel
              lead={activeLead}
              onOpenRecord={() => setFlow("record")}
              onDiscovery={() => {
                setFlow("record");
                setShowDiscoveryEditor(true);
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function CreateChoosePanel({
  onExisting,
  onNewClient,
  onCancel,
}: {
  onExisting: () => void;
  onNewClient: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-2xl border border-violet-400/25 bg-violet-500/5 p-6">
      <h2 className="text-lg font-semibold text-white">Create Opportunity</h2>
      <p className="mt-1 text-sm text-white/55">Choose how this opportunity links to Client Directory.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onExisting}
          className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]"
        >
          Select existing client
        </button>
        <button
          type="button"
          onClick={onNewClient}
          className="rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-3 text-sm font-semibold text-sky-200"
        >
          Create new client
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-white/45 hover:text-white/70">
          Cancel
        </button>
      </div>
    </section>
  );
}

function PickClientPanel({
  clients,
  selectedClientId,
  onSelect,
  onContinue,
  onCancel,
}: {
  clients: ManagedClient[];
  selectedClientId: string | null;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-base font-semibold text-white">Select client</h2>
      <select
        className={cn(inputClass(), "mt-3")}
        value={selectedClientId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Choose from Client Directory…</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.companyName}
          </option>
        ))}
      </select>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200"
        >
          Continue
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-white/45">
          Back
        </button>
      </div>
    </section>
  );
}

function OpportunityCreateNewClientPanel({
  draft,
  busy,
  error,
  companyNameError,
  onChange,
  onSave,
  onBack,
}: {
  draft: ManagedClient;
  busy: boolean;
  error: string | null;
  companyNameError: string | null;
  onChange: (patch: Partial<ManagedClient>) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const selectedLocation = resolveClientLocation(draft);
  const selectedCityOptions = useMemo(() => {
    const cities = new Set(clientCitiesForCountry(selectedLocation.country));
    if (selectedLocation.city) cities.add(selectedLocation.city);
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [selectedLocation.country, selectedLocation.city]);

  return (
    <section className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4 sm:p-6">
      <button type="button" onClick={onBack} className="text-xs text-white/45 hover:text-white/70">
        ← Create Opportunity
      </button>
      <h2 className="mt-2 text-lg font-semibold text-white">New client</h2>
      <p className="mt-1 text-sm text-white/55">
        Same Client Directory record fields — saved to the directory when you continue to the opportunity.
      </p>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <ClientRecordEditableFields
        client={draft}
        busy={busy}
        companyNameError={companyNameError}
        recordCountryOptions={CLIENT_RECORD_COUNTRY_OPTIONS}
        selectedCityOptions={selectedCityOptions}
        onPatch={onChange}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save new client
        </button>
        <button type="button" onClick={onBack} className="text-xs text-white/45">
          Back
        </button>
      </div>
    </section>
  );
}

function OpportunityFormPanel({
  draft,
  linkedClient,
  busy,
  error,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Partial<CrmLead>;
  linkedClient: ManagedClient | null;
  busy: boolean;
  error: string | null;
  onChange: (next: Partial<CrmLead>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-base font-semibold text-white">Opportunity creation</h2>
      {linkedClient ? (
        <p className="mt-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
          Client Directory: <span className="font-semibold">{linkedClient.companyName}</span>
        </p>
      ) : null}
      <p className="mt-1 text-xs text-white/45">High-level fields only — detailed specification follows in a later phase.</p>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase text-white/45">Company name</label>
          <input
            className={inputClass()}
            value={draft.companyName ?? ""}
            onChange={(e) => onChange({ ...draft, companyName: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-white/45">Contact name</label>
          <input
            className={inputClass()}
            value={draft.contactName ?? ""}
            onChange={(e) => onChange({ ...draft, contactName: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-white/45">Stage</label>
          <select
            className={inputClass()}
            value={draft.status ?? "Warm"}
            onChange={(e) => onChange({ ...draft, status: e.target.value as LeadStatus })}
          >
            {LEAD_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-60"
        >
          Save opportunity
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-white/45">
          Cancel
        </button>
      </div>
    </section>
  );
}

function DiscoveryPromptPanel({
  lead,
  onOpenRecord,
  onDiscovery,
}: {
  lead: CrmLead;
  onOpenRecord: () => void;
  onDiscovery: () => void;
}) {
  return (
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-4">
      <p className="text-sm text-emerald-100">Opportunity saved for {lead.companyName}.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDiscovery}
          className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200"
        >
          Create discovery meeting
        </button>
        <button type="button" onClick={onOpenRecord} className="text-xs text-white/55 underline-offset-2 hover:underline">
          Open opportunity record
        </button>
      </div>
    </section>
  );
}

function OpportunityRecordShell({
  lead,
  client,
  basePath,
  quotesReturnHref,
  showDiscoveryEditor,
  onOpenDiscovery,
  onCloseDiscovery,
  onBack,
  onReload,
}: {
  lead: CrmLead;
  client: ManagedClient | null;
  basePath: SurveyOperationsBasePath;
  quotesReturnHref: string;
  showDiscoveryEditor: boolean;
  onOpenDiscovery: () => void;
  onCloseDiscovery: () => void;
  onBack: () => void;
  onReload: () => void;
}) {
  const workflowIdx = visibleWorkflowIndexForLead(lead);
  const [recordTab, setRecordTab] = useState<"workflow" | "quotes">("workflow");
  const discoveryCaptured = Boolean(lead.discoveryNotes?.trim());
  const fileExplorerHref = client?.filesFolderId
    ? getInternalNavHref("files-client", basePath, { folderId: client.filesFolderId })
    : null;

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onBack} className="text-xs text-white/45 hover:text-white/70">
            ← All opportunities
          </button>
          <h2 className="mt-2 text-xl font-semibold text-white">{lead.companyName}</h2>
          {lead.contactName?.trim() ? (
            <p className="mt-1 text-sm text-white/55">{lead.contactName}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onOpenDiscovery}
            className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-violet-200"
          >
            Create discovery
          </button>
          {fileExplorerHref ? (
            <Link
              href={fileExplorerHref}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-sky-200"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              File Explorer
            </Link>
          ) : (
            <span
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/35"
              title="Link a Client Directory record with a files folder to open File Explorer"
            >
              File Explorer
            </span>
          )}
        </div>
      </div>

      <SalesFilterBar>
        <SalesFilterButton active={recordTab === "workflow"} onClick={() => setRecordTab("workflow")}>
          Overview
        </SalesFilterButton>
        <SalesFilterButton active={recordTab === "quotes"} onClick={() => setRecordTab("quotes")}>
          SALES QUOTES
        </SalesFilterButton>
      </SalesFilterBar>

      {recordTab === "quotes" ? (
        <div className="space-y-2">
          <SalesQuotesWorkspace
            embedded
            title="SALES QUOTES"
            opportunityContext={{ crmLeadId: lead.id, clientId: client?.id ?? null }}
          />
          <Link href={quotesReturnHref} className="text-xs text-violet-300 hover:underline">
            Open full Sales Quotes area
          </Link>
        </div>
      ) : (
        <>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Workflow</p>
            <ol className="mt-2 flex flex-wrap gap-2">
              {VISIBLE_OPPORTUNITY_WORKFLOW_STEPS.map((step, index) => (
                <li
                  key={step.id}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                    index === workflowIdx
                      ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                      : index < workflowIdx
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200/80"
                        : "border-white/10 bg-white/[0.03] text-white/40",
                  )}
                >
                  {step.label}
                </li>
              ))}
            </ol>
          </div>

          <CompactRecordSection title="Opportunity summary">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryField label="CRM stage" value={lead.status} />
              <SummaryField label="Email" value={lead.email?.trim() || "—"} />
              <SummaryField label="Phone" value={lead.phone?.trim() || "—"} />
              <SummaryField label="Source" value={lead.source?.trim() || "—"} />
              <SummaryField label="Client directory" value={client?.companyName ?? "—"} />
              <SummaryField label="Next action" value={lead.nextAction?.trim() || "—"} />
              {lead.notes?.trim() ? (
                <div className="sm:col-span-2 lg:col-span-3">
                  <SummaryField label="Notes" value={lead.notes.trim()} />
                </div>
              ) : null}
            </dl>
          </CompactRecordSection>

          <CompactRecordSection title="Discovery">
            <p className="text-sm text-white/70">
              {discoveryCaptured
                ? "Discovery notes are saved on this opportunity."
                : "No discovery notes captured yet."}
            </p>
            <button
              type="button"
              onClick={onOpenDiscovery}
              className="mt-2 text-xs font-semibold text-violet-300 underline-offset-2 hover:underline"
            >
              {discoveryCaptured ? "View or edit discovery" : "Create discovery"}
            </button>
          </CompactRecordSection>

          {showDiscoveryEditor ? (
            <div className="rounded-xl border border-violet-400/25 bg-violet-500/5 p-3">
              <CrmLeadDiscoveryEditor
                companyName={lead.companyName}
                initialHtml={lead.discoveryNotes ?? ""}
                onBack={onCloseDiscovery}
                onSave={async (html) => {
                  await fetch(`/api/crm/leads/${encodeURIComponent(lead.id)}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ discoveryNotes: html }),
                  });
                  onReload();
                }}
                onCommit={async (html) => {
                  await fetch(`/api/crm/leads/${encodeURIComponent(lead.id)}/commit-discovery`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ discoveryNotes: html }),
                  });
                  onReload();
                  return { meetingsCompleted: 0, alertsCleared: 0 };
                }}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function CompactRecordSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1524]/40 p-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">{label}</dt>
      <dd className="mt-1 text-sm text-white/80">{value}</dd>
    </div>
  );
}

