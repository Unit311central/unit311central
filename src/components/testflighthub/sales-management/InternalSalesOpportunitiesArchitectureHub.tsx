"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Plus, Search } from "lucide-react";

import CrmLeadDiscoveryEditor from "@/components/testflighthub/CrmLeadDiscoveryEditor";
import SalesQuotesWorkspace from "@/components/testflighthub/SalesQuotesWorkspace";
import MeetingsWorkspace from "@/components/testflighthub/MeetingsWorkspace";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import type { CrmLead, LeadStatus } from "@/lib/crm-data";
import { LEAD_STATUS_OPTIONS } from "@/lib/crm-data";
import type { ManagedClient } from "@/lib/client-management-data";
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
  SalesKpiTile,
  SalesKpiGrid,
} from "./sales-management-ui";

type HubPanel = "opportunities" | "quotes";
type FlowStep =
  | "list"
  | "create-choose"
  | "pick-client"
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
      if (client) {
        setDraftLead({
          companyName: client.companyName,
          contactName: client.primaryContact || "",
          email: client.email,
          phone: client.phone,
          status: "Warm",
        });
        setFlow("opportunity-form");
      }
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

  function syncUrl(params: Record<string, string | null>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  }

  function openRecord(leadId: string) {
    setActiveLeadId(leadId);
    setFlow("record");
    syncUrl({ leadId, opportunityId: leadId });
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
      syncUrl({ leadId: data.lead.id, opportunityId: data.lead.id });
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
      <SalesTabHeader
        title="Opportunities"
        description="Central sales working record — client-linked opportunities with discovery, activities, documents, and quotes in one place (internal architecture)."
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

      {flow === "record" && activeLead ? (
        <OpportunityRecordShell
          lead={activeLead}
          client={activeClient}
          basePath={basePath}
          quotesReturnHref={quotesReturnHref}
          showDiscoveryEditor={showDiscoveryEditor}
          onToggleDiscovery={() => setShowDiscoveryEditor((v) => !v)}
          onBack={() => {
            setFlow("list");
            setActiveLeadId(null);
            setShowDiscoveryEditor(false);
            syncUrl({ leadId: null, opportunityId: null });
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
                          onClick={() => openRecord(lead.id)}
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
                                openRecord(lead.id);
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
                const href = getInternalNavHref("clients", basePath, {
                  clientId: "new",
                  salesOpportunityReturn: "1",
                });
                router.push(href);
              }}
              onCancel={() => setFlow("list")}
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
                setDraftLead({
                  companyName: client.companyName,
                  contactName: client.primaryContact,
                  email: client.email,
                  phone: client.phone,
                  status: "Warm",
                });
                setFlow("opportunity-form");
              }}
              onCancel={() => setFlow("create-choose")}
            />
          ) : null}

          {flow === "opportunity-form" && draftLead ? (
            <OpportunityFormPanel
              draft={draftLead}
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

function OpportunityFormPanel({
  draft,
  busy,
  error,
  onChange,
  onSave,
  onCancel,
}: {
  draft: Partial<CrmLead>;
  busy: boolean;
  error: string | null;
  onChange: (next: Partial<CrmLead>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-base font-semibold text-white">Opportunity creation</h2>
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
  onToggleDiscovery,
  onBack,
  onReload,
}: {
  lead: CrmLead;
  client: ManagedClient | null;
  basePath: SurveyOperationsBasePath;
  quotesReturnHref: string;
  showDiscoveryEditor: boolean;
  onToggleDiscovery: () => void;
  onBack: () => void;
  onReload: () => void;
}) {
  const workflowIdx = workflowIndexForLead(lead);
  const [recordTab, setRecordTab] = useState<"workflow" | "quotes">("workflow");

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" onClick={onBack} className="text-xs text-white/45 hover:text-white/70">
            ← All opportunities
          </button>
          <h2 className="mt-2 text-lg font-semibold text-white">{lead.companyName}</h2>
          <p className="text-sm text-white/50">{lead.contactName}</p>
        </div>
        {client ? (
          <Link
            href={getInternalNavHref("clients", basePath, { clientId: client.id })}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-500/35 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200"
          >
            <Building2 className="h-3.5 w-3.5" />
            Client Directory
          </Link>
        ) : null}
      </div>

      <SalesFilterBar>
        <SalesFilterButton active={recordTab === "workflow"} onClick={() => setRecordTab("workflow")}>
          Workflow
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Pipeline position (framework)
            </p>
            <ol className="mt-2 flex flex-wrap gap-2">
              {INTERNAL_OPPORTUNITY_WORKFLOW_FRAMEWORK.map((step, index) => (
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

          <SalesKpiGrid>
            <SalesKpiTile label="Next action" value={lead.nextAction?.trim() || "—"} hint="Workflow / next step" />
            <SalesKpiTile label="Stage" value={lead.status} hint="CRM pipeline stage" />
          </SalesKpiGrid>

          <ArchitectureSection
            title="Workflow / next action"
            description="Where we are and what happens next — detailed activity UI in a later phase."
          >
            <p className="text-sm text-white/70">{lead.nextAction || "No next action recorded yet."}</p>
          </ArchitectureSection>

          <ArchitectureSection title="Discovery" description="Discovery meetings live inside the opportunity (not a separate top-level module).">
            <button
              type="button"
              onClick={onToggleDiscovery}
              className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200"
            >
              {showDiscoveryEditor ? "Hide discovery editor" : "Create / edit discovery"}
            </button>
            {showDiscoveryEditor ? (
              <div className="mt-3">
                <CrmLeadDiscoveryEditor
                  companyName={lead.companyName}
                  initialHtml={lead.discoveryNotes ?? ""}
                  onBack={onToggleDiscovery}
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
            ) : (
              <MeetingsWorkspace salesEmbedded />
            )}
          </ArchitectureSection>

          <ArchitectureSection title="Activities" description="Phone calls and follow-ups — reuses Sales Management activities data.">
            <p className="text-xs text-white/45">Activity logging UI to be specified; API: /api/sales-management/activities</p>
          </ArchitectureSection>

          <ArchitectureSection title="Documents / File Explorer" description="Client documents must link to File Explorer — not an orphan upload field.">
            {client?.filesFolderId ? (
              <Link
                href={getInternalNavHref("files-client", basePath, { folderId: client.filesFolderId })}
                className="text-sm text-sky-300 underline-offset-2 hover:underline"
              >
                Open client folder in File Explorer
              </Link>
            ) : (
              <p className="text-sm text-white/50">
                Link a Client Directory record with a files folder to attach documents here.
              </p>
            )}
          </ArchitectureSection>
        </>
      )}
    </section>
  );
}

function ArchitectureSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1524]/40 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs text-white/45">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
