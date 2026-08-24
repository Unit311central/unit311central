"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Radio, Smartphone, Trash2 } from "lucide-react";

import {
  type NorthstarTechTelecom,
  isNorthstarMobileTelecomService,
  loadNorthstarTelecoms,
  saveNorthstarTelecoms,
  sumNorthstarTelecomMonthlySpend,
} from "@/lib/demo/northstar-telecom-data";
import { formatNorthstarTechGbp } from "@/lib/demo/northstar-tech-data";
import { cn } from "@/lib/utils";
import { WsSection } from "@/components/testflighthub/domain-workspace-ui";

function statusClass(status: string) {
  if (/active/i.test(status)) return "bg-emerald-500/15 text-emerald-200";
  if (/pending/i.test(status)) return "bg-amber-500/15 text-amber-200";
  if (/cancelled/i.test(status)) return "bg-rose-500/15 text-rose-200";
  return "bg-white/10 text-white/60";
}

function newTelecomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `nst-tel-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `nst-tel-${Date.now().toString(36)}`;
}

const EMPTY_FORM: Omit<NorthstarTechTelecom, "id"> = {
  service: "Mobile plan",
  carrier: "",
  numberOrCircuit: "",
  assignedTo: "",
  office: "Manchester",
  monthlyCostGbp: 0,
  status: "Active",
  manufacturer: "",
  model: "",
};

export default function NorthstarTelecomsRegister() {
  const [rows, setRows] = useState<NorthstarTechTelecom[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setRows(loadNorthstarTelecoms());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: NorthstarTechTelecom[]) => {
    setRows(next);
    saveNorthstarTelecoms(next);
  }, []);

  const monthly = useMemo(() => sumNorthstarTelecomMonthlySpend(rows), [rows]);
  const isMobile = isNorthstarMobileTelecomService(form.service);

  const fibreRows = useMemo(
    () => rows.filter((row) => !isNorthstarMobileTelecomService(row.service)),
    [rows],
  );
  const mobileRows = useMemo(
    () => rows.filter((row) => isNorthstarMobileTelecomService(row.service)),
    [rows],
  );

  const officeSummary = useMemo(() => {
    return ["Manchester", "Bristol", "Austin"].map((office) => {
      const officeRows = rows.filter((row) => row.office === office);
      const fibre = officeRows.filter((row) => !isNorthstarMobileTelecomService(row.service));
      const mobiles = officeRows.filter((row) => isNorthstarMobileTelecomService(row.service));
      return {
        office,
        fibreLabel: fibre[0]?.numberOrCircuit ?? "—",
        fibreCarrier: fibre[0]?.carrier ?? "—",
        mobileCount: mobiles.length,
        monthly: sumNorthstarTelecomMonthlySpend(officeRows),
      };
    });
  }, [rows]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setEditorOpen(true);
  }

  function openEdit(row: NorthstarTechTelecom) {
    setEditingId(row.id);
    setForm({
      service: row.service,
      carrier: row.carrier,
      numberOrCircuit: row.numberOrCircuit,
      assignedTo: row.assignedTo,
      office: row.office,
      monthlyCostGbp: row.monthlyCostGbp,
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

  function handleSave() {
    const payload: Omit<NorthstarTechTelecom, "id"> = {
      service: form.service.trim() || "Mobile plan",
      carrier: form.carrier.trim(),
      numberOrCircuit: form.numberOrCircuit.trim(),
      assignedTo: form.assignedTo.trim(),
      office: form.office.trim() || "Manchester",
      monthlyCostGbp: Math.max(0, Number(form.monthlyCostGbp) || 0),
      status: form.status,
      ...(isNorthstarMobileTelecomService(form.service)
        ? {
            manufacturer: form.manufacturer?.trim() || undefined,
            model: form.model?.trim() || undefined,
          }
        : {}),
    };

    if (editingId) {
      persist(rows.map((row) => (row.id === editingId ? { ...payload, id: editingId } : row)));
    } else {
      persist([...rows, { ...payload, id: newTelecomId() }]);
    }
    closeEditor();
  }

  function handleDelete(id: string) {
    const row = rows.find((entry) => entry.id === id);
    if (!row) return;
    if (!window.confirm(`Delete ${row.service} (${row.carrier})?`)) return;
    persist(rows.filter((entry) => entry.id !== id));
    if (editingId === id) closeEditor();
  }

  function renderTable(items: NorthstarTechTelecom[]) {
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
              <th className="px-3 py-2.5">Office</th>
              <th className="px-3 py-2.5">USD/mo</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const handset =
                isNorthstarMobileTelecomService(row.service) && (row.manufacturer || row.model)
                  ? [row.manufacturer, row.model].filter(Boolean).join(" ")
                  : "—";
              return (
                <tr key={row.id} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5 font-medium text-white">{row.service}</td>
                  <td className="px-3 py-2.5">{row.carrier}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{row.numberOrCircuit}</td>
                  <td className="px-3 py-2.5 text-white/65">{handset}</td>
                  <td className="px-3 py-2.5">{row.assignedTo}</td>
                  <td className="px-3 py-2.5">{row.office}</td>
                  <td className="px-3 py-2.5 tabular-nums">{row.monthlyCostGbp}</td>
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
                        onClick={() => handleDelete(row.id)}
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
        subtitle="Northstar connectivity — 3 offices · 15 mobile plans · GBP"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              {formatNorthstarTechGbp(monthly)}/mo
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
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {officeSummary.map((office) => (
            <article
              key={office.office}
              className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-4 py-3"
            >
              <div className="flex items-start gap-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-sky-200">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{office.office}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {office.fibreCarrier} fibre · {office.fibreLabel}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-white/55">
                    <Smartphone className="h-3 w-3" />
                    {office.mobileCount} mobile plan{office.mobileCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-white">
                    {formatNorthstarTechGbp(office.monthly)}/mo
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {editorOpen ? (
          <div className="mb-4 rounded-xl border border-white/10 bg-[#0b1524]/80 p-4">
            <p className="text-sm font-medium text-white">
              {editingId ? "Edit service" : "Add service"}
            </p>
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
                  value={form.numberOrCircuit}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, numberOrCircuit: event.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                Assigned to
                <input
                  value={form.assignedTo}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, assignedTo: event.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                Office
                <select
                  value={form.office}
                  onChange={(event) => setForm((prev) => ({ ...prev, office: event.target.value }))}
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                >
                  <option value="Manchester">Manchester</option>
                  <option value="Bristol">Bristol</option>
                  <option value="Austin">Austin</option>
                </select>
              </label>
              <label className="space-y-1 text-xs text-white/50">
                USD/month
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.monthlyCostGbp}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      monthlyCostGbp: Number(event.target.value),
                    }))
                  }
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="space-y-1 text-xs text-white/50">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as NorthstarTechTelecom["status"],
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
                      placeholder="e.g. Apple"
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
                      placeholder="e.g. iPhone 15"
                      className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none focus:border-sky-400/40"
                    />
                  </label>
                </>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex h-9 items-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-500"
              >
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

        {!hydrated ? (
          <p className="text-sm text-white/45">Loading telecom register…</p>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                <Radio className="h-3.5 w-3.5" />
                Office fibre ({fibreRows.length})
              </p>
              {renderTable(fibreRows)}
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                <Smartphone className="h-3.5 w-3.5" />
                Mobile plans ({mobileRows.length})
              </p>
              {renderTable(mobileRows)}
            </div>
          </div>
        )}
      </WsSection>
    </div>
  );
}
