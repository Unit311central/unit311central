"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Radio, Smartphone, Trash2 } from "lucide-react";

import { formatReportingMoney } from "@/lib/financial-reporting-currency";
import {
  isMobileTelecomService,
  type TechnologyTelecomService,
  type TechnologyTelecomServiceInput,
  type TelecomServiceStatus,
} from "@/lib/technology-telecom/types";
import { useWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency";
import { cn } from "@/lib/utils";
import { WsEmpty, WsSection } from "./domain-workspace-ui";

function statusClass(status: string) {
  if (/active/i.test(status)) return "bg-emerald-500/15 text-emerald-200";
  if (/pending/i.test(status)) return "bg-amber-500/15 text-amber-200";
  if (/cancelled/i.test(status)) return "bg-rose-500/15 text-rose-200";
  return "bg-white/10 text-white/60";
}

const EMPTY_FORM: TechnologyTelecomServiceInput & { location: string } = {
  service: "Mobile plan",
  carrier: "",
  numberOrCircuit: "",
  assignedTo: "",
  location: "Manchester",
  monthlyCostMinor: 0,
  status: "Active",
  manufacturer: "",
  model: "",
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

export default function TelecommunicationsWorkspace() {
  const currency = useWorkspaceReportingCurrency();
  const [rows, setRows] = useState<TechnologyTelecomService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/technology/telecom", { cache: "no-store" });
      const data = await readApiJson<{ services?: TechnologyTelecomService[]; error?: string }>(
        response,
      );
      if (!response.ok) throw new Error(data.error ?? "Failed to load telecommunications.");
      setRows(data.services ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load telecommunications.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const monthly = useMemo(
    () => rows.reduce((sum, row) => sum + row.monthlyCostMinor, 0),
    [rows],
  );
  const isMobile = isMobileTelecomService(form.service);

  const fibreRows = useMemo(
    () => rows.filter((row) => !isMobileTelecomService(row.service)),
    [rows],
  );
  const mobileRows = useMemo(
    () => rows.filter((row) => isMobileTelecomService(row.service)),
    [rows],
  );

  const officeSummary = useMemo(() => {
    const offices = [...new Set(rows.map((row) => row.location).filter(Boolean))] as string[];
    const defaults = ["Manchester", "Bristol", "Austin"];
    const list = offices.length ? offices : defaults;
    return list.map((office) => {
      const officeRows = rows.filter((row) => row.location === office);
      const fibre = officeRows.filter((row) => !isMobileTelecomService(row.service));
      const mobiles = officeRows.filter((row) => isMobileTelecomService(row.service));
      return {
        office,
        fibreLabel: fibre[0]?.numberOrCircuit ?? "—",
        fibreCarrier: fibre[0]?.carrier ?? "—",
        mobileCount: mobiles.length,
        monthly: officeRows.reduce((sum, row) => sum + row.monthlyCostMinor, 0),
      };
    });
  }, [rows]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setEditorOpen(true);
  }

  function openEdit(row: TechnologyTelecomService) {
    setEditingId(row.id);
    setForm({
      service: row.service,
      carrier: row.carrier,
      numberOrCircuit: row.numberOrCircuit,
      assignedTo: row.assignedTo,
      location: row.location ?? "Manchester",
      monthlyCostMinor: row.monthlyCostMinor,
      status: row.status,
      manufacturer: row.manufacturer ?? "",
      model: row.model ?? "",
    });
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    const payload: TechnologyTelecomServiceInput = {
      service: form.service.trim() || "Mobile plan",
      carrier: form.carrier.trim(),
      numberOrCircuit: form.numberOrCircuit?.trim() ?? "",
      assignedTo: form.assignedTo?.trim() ?? "",
      location: form.location?.trim() || "Manchester",
      monthlyCostMinor: Math.max(0, Number(form.monthlyCostMinor) || 0),
      status: form.status ?? "Active",
      ...(isMobile
        ? {
            manufacturer: form.manufacturer?.trim() || null,
            model: form.model?.trim() || null,
          }
        : { manufacturer: null, model: null }),
    };

    try {
      const response = await fetch(
        editingId ? `/api/technology/telecom/${editingId}` : "/api/technology/telecom",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to save service.");
      closeEditor();
      await loadRows();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save service.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    const row = rows.find((entry) => entry.id === id);
    if (!row) return;
    if (!window.confirm(`Delete ${row.service} (${row.carrier})?`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/technology/telecom/${id}`, { method: "DELETE" });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete service.");
      if (editingId === id) closeEditor();
      await loadRows();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete service.");
    } finally {
      setBusy(false);
    }
  }

  function renderTable(items: TechnologyTelecomService[]) {
    return (
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2.5">Service</th>
              <th className="px-3 py-2.5">Carrier</th>
              <th className="px-3 py-2.5">Number / circuit</th>
              <th className="px-3 py-2.5">Handset</th>
              <th className="px-3 py-2.5">Assigned</th>
              <th className="px-3 py-2.5">Location</th>
              <th className="px-3 py-2.5">{currency}/mo</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const handset =
                isMobileTelecomService(row.service) && (row.manufacturer || row.model)
                  ? [row.manufacturer, row.model].filter(Boolean).join(" ")
                  : "—";
              return (
                <tr key={row.id} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5 font-medium text-white">{row.service}</td>
                  <td className="px-3 py-2.5">{row.carrier}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{row.numberOrCircuit}</td>
                  <td className="px-3 py-2.5 text-white/65">{handset}</td>
                  <td className="px-3 py-2.5">{row.assignedTo}</td>
                  <td className="px-3 py-2.5">{row.location ?? "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums">{row.monthlyCostMinor}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-medium",
                        statusClass(row.status),
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/[0.05] hover:text-white"
                        aria-label={`Edit ${row.service}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 text-red-300 hover:bg-red-500/10"
                        aria-label={`Delete ${row.service}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WsSection
        title="Telecommunications"
        subtitle="Workspace connectivity & voice register"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              {formatReportingMoney(monthly, currency)}/mo
            </span>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Add service
            </button>
          </div>
        }
      >
        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

        {editorOpen ? (
          <div className="mb-4 rounded-xl border border-white/10 bg-[#0b1524]/80 p-4">
            <p className="text-sm font-medium text-white">{editingId ? "Edit service" : "Add service"}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1 text-xs text-white/50">
                Service
                <input
                  value={form.service}
                  onChange={(event) => setForm((prev) => ({ ...prev, service: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                Carrier
                <input
                  value={form.carrier}
                  onChange={(event) => setForm((prev) => ({ ...prev, carrier: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                Number / circuit
                <input
                  value={form.numberOrCircuit ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, numberOrCircuit: event.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                Assigned to
                <input
                  value={form.assignedTo ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, assignedTo: event.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                Location
                <input
                  value={form.location ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, location: event.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                {currency}/month
                <input
                  type="number"
                  min={0}
                  value={form.monthlyCostMinor ?? 0}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      monthlyCostMinor: Number(event.target.value) || 0,
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                Status
                <select
                  value={form.status ?? "Active"}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as TelecomServiceStatus,
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
              {isMobile ? (
                <>
                  <label className="space-y-1 text-xs text-white/50">
                    Manufacturer
                    <input
                      value={form.manufacturer ?? ""}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, manufacturer: event.target.value }))
                      }
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-white/50">
                    Model
                    <input
                      value={form.model ?? ""}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, model: event.target.value }))
                      }
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                    />
                  </label>
                </>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={busy}
                className="inline-flex h-9 items-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </button>
              <button
                type="button"
                onClick={closeEditor}
                className="inline-flex h-9 items-center rounded-lg border border-white/10 px-4 text-sm text-white/70 hover:bg-white/[0.05]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-white/45">Loading telecom register…</p>
        ) : rows.length ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {officeSummary.map((entry) => (
                <article
                  key={entry.office}
                  className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-4 py-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-200">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{entry.office}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {entry.fibreCarrier} fibre · {entry.fibreLabel}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-white/55">
                        <Smartphone className="h-3 w-3" />
                        {entry.mobileCount} mobile plan{entry.mobileCount === 1 ? "" : "s"}
                      </p>
                      <p className="mt-2 text-sm font-semibold tabular-nums text-white">
                        {formatReportingMoney(entry.monthly, currency)}/mo
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                <Radio className="h-3.5 w-3.5" />
                Office fibre ({fibreRows.length})
              </p>
              {fibreRows.length ? renderTable(fibreRows) : <WsEmpty message="No fibre circuits yet." />}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                <Smartphone className="h-3.5 w-3.5" />
                Mobile plans ({mobileRows.length})
              </p>
              {mobileRows.length ? renderTable(mobileRows) : <WsEmpty message="No mobile lines yet." />}
            </div>
          </div>
        ) : (
          <WsEmpty message="Add connectivity services or wait for workspace starter data to load." />
        )}
      </WsSection>
    </div>
  );
}
