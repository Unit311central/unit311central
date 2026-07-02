"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createBlankLeadInput,
  formatLeadDate,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  leadStatusClass,
  type CrmLead,
  type LeadStatus,
} from "@/lib/crm-data";
import { cn } from "@/lib/utils";
import ResponsiveMasterDetail, { useMobileDetailPanel } from "@/components/ui/ResponsiveMasterDetail";
import { Loader2, Network, Plus, Save, Trash2 } from "lucide-react";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

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

function leadFieldsEqual(a: CrmLead, b: CrmLead) {
  return (
    a.companyName === b.companyName &&
    a.contactName === b.contactName &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.status === b.status &&
    a.source === b.source &&
    a.nextAction === b.nextAction &&
    a.nextActionDate === b.nextActionDate &&
    a.estimatedValue === b.estimatedValue &&
    a.notes === b.notes
  );
}

export default function CrmWorkspace({
  onOpenConnections,
}: {
  onOpenConnections?: () => void;
}) {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<CrmLead | null>(null);
  const snapshottedIdRef = useRef<string | null>(null);
  const { showDetail, openDetail, closeDetail } = useMobileDetailPanel();

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0] ?? null,
    [leads, selectedLeadId],
  );

  const isDirty = useMemo(() => {
    if (!selectedLead) return false;
    if (!savedSnapshot || savedSnapshot.id !== selectedLead.id) return true;
    return !leadFieldsEqual(selectedLead, savedSnapshot);
  }, [selectedLead, savedSnapshot]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.set("status", statusFilter);

      const response = await fetch(`/api/crm/leads?${params.toString()}`, { cache: "no-store" });
      const data = await readApiJson<{ leads?: CrmLead[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load leads");

      const nextLeads = data.leads ?? [];
      setLeads(nextLeads);
      setSelectedLeadId((current) => {
        if (current && nextLeads.some((lead) => lead.id === current)) return current;
        return nextLeads[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load leads");
      setLeads([]);
      setSelectedLeadId(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (!selectedLeadId) {
      snapshottedIdRef.current = null;
      setSavedSnapshot(null);
      return;
    }
    if (snapshottedIdRef.current === selectedLeadId) return;
    const lead = leads.find((item) => item.id === selectedLeadId);
    if (lead) {
      snapshottedIdRef.current = selectedLeadId;
      setSavedSnapshot({ ...lead });
    }
  }, [selectedLeadId, leads]);

  async function saveLead(lead: CrmLead) {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: lead.companyName,
          contactName: lead.contactName,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          source: lead.source,
          nextAction: lead.nextAction,
          nextActionDate: lead.nextActionDate,
          estimatedValue: lead.estimatedValue,
          notes: lead.notes,
        }),
      });

      const data = await readApiJson<{ lead?: CrmLead; error?: string }>(response);
      if (!response.ok || !data.lead) throw new Error(data.error ?? "Failed to save lead");

      setLeads((current) => current.map((item) => (item.id === data.lead!.id ? data.lead! : item)));
      snapshottedIdRef.current = data.lead.id;
      setSavedSnapshot(data.lead);
      setSaveMessage("Lead saved");
      return data.lead;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save lead");
    } finally {
      setBusy(false);
    }
  }

  function patchSelected(patch: Partial<CrmLead>) {
    if (!selectedLead) return;
    const next = { ...selectedLead, ...patch };
    setLeads((current) => current.map((lead) => (lead.id === next.id ? next : lead)));
    setSaveMessage(null);
  }

  async function handleSaveLead() {
    if (!selectedLead) return;
    setError(null);
    setSaveMessage(null);
    await saveLead(selectedLead);
  }

  async function handleAddLead() {
    setBusy(true);
    setError(null);

    const blank = createBlankLeadInput();

    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...blank,
          companyName: "New Company",
          contactName: "New Contact",
        }),
      });

      const data = await readApiJson<{ lead?: CrmLead; error?: string }>(response);
      if (!response.ok || !data.lead) throw new Error(data.error ?? "Failed to create lead");

      setLeads((current) => [data.lead!, ...current]);
      setSelectedLeadId(data.lead.id);
      snapshottedIdRef.current = data.lead.id;
      setSavedSnapshot(data.lead);
      setStatusFilter("All");
      setSaveMessage("Lead created");
      openDetail();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create lead");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteLead() {
    if (!selectedLead) return;
    if (!window.confirm(`Delete lead "${selectedLead.companyName}"?`)) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/crm/leads/${selectedLead.id}`, { method: "DELETE" });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete lead");

      const remaining = leads.filter((lead) => lead.id !== selectedLead.id);
      setLeads(remaining);
      setSelectedLeadId(remaining[0]?.id ?? null);
      if (remaining.length === 0) closeDetail();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete lead");
    } finally {
      setBusy(false);
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<LeadStatus, number> = {
      Cold: 0,
      Warm: 0,
      Hot: 0,
      Won: 0,
      Lost: 0,
    };
    for (const lead of leads) {
      counts[lead.status] += 1;
    }
    return counts;
  }, [leads]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Pipeline</h3>
            <p className="mt-1 text-xs text-white/45">
              {leads.length} leads · {statusCounts.Hot} hot · {statusCounts.Warm} warm ·{" "}
              {statusCounts.Cold} cold
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {onOpenConnections && (
              <button
                type="button"
                onClick={onOpenConnections}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-500/15 px-3 text-xs font-semibold text-violet-200 transition-colors hover:border-violet-400/60 hover:bg-violet-500/25"
              >
                <Network className="h-3.5 w-3.5" />
                Connections
              </button>
            )}
            <div className="min-w-[180px]">
              <FieldLabel>Filter by status</FieldLabel>
            <select
              className={inputClassName()}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "All")}
            >
              <option value="All">All statuses</option>
              {LEAD_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            </div>
          </div>
        </div>
      </section>

      {saveMessage && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {saveMessage}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          {error.includes("crm_leads") && (
            <p className="mt-1 text-xs text-red-200/70">
              Run <span className="font-mono">supabase/migrations/004_create_crm_leads.sql</span> in
              Supabase SQL Editor.
            </p>
          )}
        </div>
      )}

      <ResponsiveMasterDetail
        showDetail={showDetail && !!selectedLead}
        onBack={closeDetail}
        backLabel="Back to leads"
        master={
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Leads</h2>
              <p className="mt-1 text-xs text-white/45">{leads.length} in view</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleAddLead()}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              New lead
            </button>
          </div>

          {loading ? (
            <div className="mt-6 flex items-center gap-3 text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading leads…
            </div>
          ) : leads.length === 0 ? (
            <p className="mt-6 text-sm text-white/45">
              No leads yet. Add your first prospect to start tracking outreach.
            </p>
          ) : (
            <ul className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {leads.map((lead) => {
                const selected = lead.id === selectedLead?.id;

                return (
                  <li key={lead.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        openDetail();
                      }}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                        selected
                          ? "border-sky-400/40 bg-sky-500/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {lead.companyName}
                          </p>
                          <p className="mt-1 text-xs text-white/45">{lead.contactName}</p>
                          {lead.nextAction && (
                            <p className="mt-1 truncate text-[11px] text-white/35">
                              Next: {lead.nextAction}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]",
                            leadStatusClass(lead.status),
                          )}
                        >
                          {lead.status}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        }
        detail={
        selectedLead ? (
          <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
                  Lead record
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">{selectedLead.companyName}</h2>
                <p className="mt-1 text-sm text-white/50">{selectedLead.contactName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                    leadStatusClass(selectedLead.status),
                  )}
                >
                  {selectedLead.status}
                </span>
                <button
                  type="button"
                  disabled={busy || !isDirty}
                  onClick={() => void handleSaveLead()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-200 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDeleteLead()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-400/20 px-3 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FieldLabel>Company</FieldLabel>
                <input
                  className={inputClassName()}
                  value={selectedLead.companyName}
                  onChange={(event) => patchSelected({ companyName: event.target.value })}
                  disabled={busy}
                />
              </div>
              <div>
                <FieldLabel>Contact name</FieldLabel>
                <input
                  className={inputClassName()}
                  value={selectedLead.contactName}
                  onChange={(event) => patchSelected({ contactName: event.target.value })}
                  disabled={busy}
                />
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <select
                  className={inputClassName()}
                  value={selectedLead.status}
                  onChange={(event) =>
                    patchSelected({ status: event.target.value as LeadStatus })
                  }
                  disabled={busy}
                >
                  {LEAD_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  className={inputClassName()}
                  value={selectedLead.email}
                  onChange={(event) => patchSelected({ email: event.target.value })}
                  disabled={busy}
                />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input
                  className={inputClassName()}
                  value={selectedLead.phone}
                  onChange={(event) => patchSelected({ phone: event.target.value })}
                  disabled={busy}
                />
              </div>
              <div>
                <FieldLabel>Source</FieldLabel>
                <select
                  className={inputClassName()}
                  value={selectedLead.source || LEAD_SOURCE_OPTIONS[0]}
                  onChange={(event) => patchSelected({ source: event.target.value })}
                  disabled={busy}
                >
                  {LEAD_SOURCE_OPTIONS.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Estimated value (EUR)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  className={inputClassName()}
                  value={selectedLead.estimatedValue ?? ""}
                  onChange={(event) =>
                    patchSelected({
                      estimatedValue: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  disabled={busy}
                />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Next action</FieldLabel>
                <input
                  className={inputClassName()}
                  value={selectedLead.nextAction}
                  onChange={(event) => patchSelected({ nextAction: event.target.value })}
                  placeholder="e.g. Send proposal, book demo call…"
                  disabled={busy}
                />
              </div>
              <div>
                <FieldLabel>Next action date</FieldLabel>
                <input
                  type="date"
                  className={inputClassName()}
                  value={selectedLead.nextActionDate ?? ""}
                  onChange={(event) =>
                    patchSelected({ nextActionDate: event.target.value || null })
                  }
                  disabled={busy}
                />
              </div>
              <div>
                <FieldLabel>Last updated</FieldLabel>
                <p className={cn(inputClassName(), "mt-1.5 flex items-center text-white/55")}>
                  {formatLeadDate(selectedLead.updatedAt)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  rows={4}
                  className={cn(inputClassName(), "resize-y")}
                  value={selectedLead.notes}
                  onChange={(event) => patchSelected({ notes: event.target.value })}
                  disabled={busy}
                />
              </div>
            </div>
          </section>
        ) : !loading ? (
          <section className="flex min-h-[320px] items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] p-6 text-sm text-white/45">
            Select a lead or create a new one to get started.
          </section>
        ) : null
        }
      />
    </div>
  );
}
