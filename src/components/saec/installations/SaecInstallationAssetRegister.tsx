"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";

import SaecInstallationAssetDetail from "@/components/saec/installations/SaecInstallationAssetDetail";
import {
  SAEC_ELEVATOR_MODELS,
  SAEC_ESCALATOR_MODELS,
  type SaecInstallationAsset,
  type SaecInstallationAssetInput,
  type SaecInstallationAssetType,
  type SaecInstallationCityId,
  type SaecMaintenanceRecord,
} from "@/lib/saec/installations-types";
import { SAEC_INSTALLATION_CITIES } from "@/lib/saec/installations-cities";
import type { SaecInstallationEngineer } from "@/lib/saec/installations-engineers";
import { cn } from "@/lib/utils";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

type SaecInstallationAssetRegisterProps = {
  assetType: SaecInstallationAssetType;
  title: string;
  subtitle: string;
};

const EMPTY_FORM: SaecInstallationAssetInput = {
  assetType: "elevator",
  assetCode: "",
  model: "KLH Goods Lift",
  siteName: "",
  customerName: "Demo Property Holdings",
  cityId: "johannesburg",
  levelLabel: "L1",
  status: "online",
  maintenanceStatus: "ok",
  contractStatus: "active",
};

export default function SaecInstallationAssetRegister({
  assetType,
  title,
  subtitle,
}: SaecInstallationAssetRegisterProps) {
  const [assets, setAssets] = useState<SaecInstallationAsset[]>([]);
  const [engineers, setEngineers] = useState<SaecInstallationEngineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [maintenanceFilter, setMaintenanceFilter] = useState("all");
  const [contractFilter, setContractFilter] = useState("all");
  const [engineerFilter, setEngineerFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailMaintenance, setDetailMaintenance] = useState<SaecMaintenanceRecord[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SaecInstallationAssetInput>({ ...EMPTY_FORM, assetType });
  const [busy, setBusy] = useState(false);

  const models =
    assetType === "elevator" ? [...SAEC_ELEVATOR_MODELS] : [...SAEC_ESCALATOR_MODELS];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/saec/installations/assets?assetType=${assetType}`, {
        cache: "no-store",
      });
      const payload = await readJson<{
        assets?: SaecInstallationAsset[];
        engineers?: SaecInstallationEngineer[];
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(payload.error ?? "Failed to load assets");
      setAssets(payload.assets ?? []);
      setEngineers(payload.engineers ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load assets");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [assetType]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (cityFilter !== "all" && asset.cityId !== cityFilter) return false;
      if (modelFilter !== "all" && asset.model !== modelFilter) return false;
      if (statusFilter !== "all" && asset.status !== statusFilter) return false;
      if (maintenanceFilter !== "all" && asset.maintenanceStatus !== maintenanceFilter) return false;
      if (contractFilter !== "all" && asset.contractStatus !== contractFilter) return false;
      if (engineerFilter !== "all" && asset.assignedEngineerId !== engineerFilter) return false;
      if (!q) return true;
      const haystack = [
        asset.assetCode,
        asset.siteName,
        asset.customerName,
        asset.cityLabel,
        asset.model,
        asset.assignedEngineerName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    assets,
    search,
    cityFilter,
    modelFilter,
    statusFilter,
    maintenanceFilter,
    contractFilter,
    engineerFilter,
  ]);

  const selected = assets.find((asset) => asset.id === selectedId) ?? null;

  async function openDetail(asset: SaecInstallationAsset) {
    setSelectedId(asset.id);
    try {
      const response = await fetch(`/api/saec/installations/assets/${asset.id}`, {
        cache: "no-store",
      });
      const payload = await readJson<{ maintenance?: SaecMaintenanceRecord[] }>(response);
      if (response.ok) setDetailMaintenance(payload.maintenance ?? []);
    } catch {
      setDetailMaintenance([]);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, assetType, model: models[0] });
    setFormOpen(true);
  }

  function openEdit(asset: SaecInstallationAsset) {
    setEditingId(asset.id);
    setForm({
      assetType: asset.assetType,
      assetCode: asset.assetCode,
      model: asset.model,
      siteName: asset.siteName,
      customerName: asset.customerName,
      cityId: asset.cityId,
      levelLabel: asset.levelLabel,
      status: asset.status,
      maintenanceStatus: asset.maintenanceStatus,
      contractStatus: asset.contractStatus,
      assignedEngineerId: asset.assignedEngineerId,
      assignedEngineerName: asset.assignedEngineerName,
      engineerFieldStatus: asset.engineerFieldStatus,
      nextMaintenanceDate: asset.nextMaintenanceDate,
      lastMaintenanceDate: asset.lastMaintenanceDate,
      maintenanceFrequencyMonths: asset.maintenanceFrequencyMonths,
      installedDate: asset.installedDate,
    });
    setFormOpen(true);
  }

  async function saveForm() {
    setBusy(true);
    setError(null);
    try {
      const engineer = engineers.find((row) => row.id === form.assignedEngineerId);
      const body: SaecInstallationAssetInput = {
        ...form,
        assignedEngineerName: engineer?.fullName ?? form.assignedEngineerName,
      };
      const response = editingId
        ? await fetch(`/api/saec/installations/assets/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/saec/installations/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const payload = await readJson<{ asset?: SaecInstallationAsset; error?: string }>(response);
      if (!response.ok) throw new Error(payload.error ?? "Save failed");
      setFormOpen(false);
      await load();
      if (payload.asset) await openDetail(payload.asset);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAsset(asset: SaecInstallationAsset) {
    if (!window.confirm(`Delete demo asset ${asset.assetCode}?`)) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/saec/installations/assets/${asset.id}`, {
        method: "DELETE",
      });
      const payload = await readJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error ?? "Delete failed");
      if (selectedId === asset.id) setSelectedId(null);
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/90">
              Operations · Installations
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-xs text-white/45">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Add {assetType === "elevator" ? "Elevator" : "Escalator"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(5,minmax(0,140px))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search asset ID, site, customer, city, model, engineer…"
              className="w-full rounded-xl border border-white/10 bg-[#0b1524] py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-sky-400/40"
            />
          </div>
          <FilterSelect label="City" value={cityFilter} onChange={setCityFilter}>
            <option value="all">All cities</option>
            {SAEC_INSTALLATION_CITIES.map((city) => (
              <option key={city.id} value={city.id}>{city.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Model" value={modelFilter} onChange={setModelFilter}>
            <option value="all">All models</option>
            {models.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}>
            <option value="all">All statuses</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </FilterSelect>
          <FilterSelect label="Maintenance" value={maintenanceFilter} onChange={setMaintenanceFilter}>
            <option value="all">All</option>
            <option value="ok">OK</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
            <option value="scheduled">Scheduled</option>
          </FilterSelect>
          <FilterSelect label="Engineer" value={engineerFilter} onChange={setEngineerFilter}>
            <option value="all">All engineers</option>
            {engineers.map((engineer) => (
              <option key={engineer.id} value={engineer.id}>{engineer.fullName}</option>
            ))}
          </FilterSelect>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading asset register…
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#0b1524] text-[10px] uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-3 py-2">Asset ID</th>
                  <th className="px-3 py-2">Site</th>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Engineer</th>
                  <th className="px-3 py-2">Next Maint.</th>
                  <th className="px-3 py-2">Contract</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 120).map((asset) => (
                  <tr
                    key={asset.id}
                    className={cn(
                      "border-t border-white/5 cursor-pointer hover:bg-white/[0.03]",
                      selectedId === asset.id && "bg-sky-500/10",
                    )}
                    onClick={() => void openDetail(asset)}
                  >
                    <td className="px-3 py-2 font-mono text-xs text-sky-200">{asset.assetCode}</td>
                    <td className="px-3 py-2 text-white/80">{asset.siteName}</td>
                    <td className="px-3 py-2 text-white/65">{asset.model}</td>
                    <td className="px-3 py-2 text-white/65">{asset.cityLabel}</td>
                    <td className="px-3 py-2 capitalize text-white/65">{asset.status}</td>
                    <td className="px-3 py-2 text-white/65">{asset.assignedEngineerName ?? "—"}</td>
                    <td className="px-3 py-2 text-white/65">{asset.nextMaintenanceDate ?? "—"}</td>
                    <td className="px-3 py-2 capitalize text-white/65">{asset.contractStatus}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void deleteAsset(asset);
                        }}
                        className="text-red-300/80 hover:text-red-200"
                        aria-label="Delete asset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 120 && (
              <p className="border-t border-white/5 px-3 py-2 text-xs text-white/40">
                Showing first 120 of {filtered.length} matching assets. Refine filters to narrow results.
              </p>
            )}
          </div>

          {selected ? (
            <SaecInstallationAssetDetail
              asset={selected}
              maintenance={detailMaintenance}
              engineers={engineers}
              onEdit={() => openEdit(selected)}
              onMaintenanceCreated={async () => {
                await load();
                await openDetail(selected);
              }}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">
              Select an asset to view maintenance history and engineer assignment.
            </div>
          )}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1524] p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-white">
              {editingId ? "Edit asset" : "Add asset"} (demo)
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Asset ID" value={form.assetCode} onChange={(v) => setForm({ ...form, assetCode: v })} />
              <Field label="Site" value={form.siteName} onChange={(v) => setForm({ ...form, siteName: v })} />
              <Field label="Customer" value={form.customerName ?? ""} onChange={(v) => setForm({ ...form, customerName: v })} />
              <Field label="Level" value={form.levelLabel} onChange={(v) => setForm({ ...form, levelLabel: v })} />
              <label className="text-xs text-white/45">
                Model
                <select
                  value={form.model}
                  onChange={(event) => setForm({ ...form, model: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#071018] px-2 py-2 text-sm text-white"
                >
                  {models.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-white/45">
                City
                <select
                  value={form.cityId}
                  onChange={(event) =>
                    setForm({ ...form, cityId: event.target.value as SaecInstallationCityId })
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#071018] px-2 py-2 text-sm text-white"
                >
                  {SAEC_INSTALLATION_CITIES.map((city) => (
                    <option key={city.id} value={city.id}>{city.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-white/45">
                Engineer
                <select
                  value={form.assignedEngineerId ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, assignedEngineerId: event.target.value || null })
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#071018] px-2 py-2 text-sm text-white"
                >
                  <option value="">Unassigned</option>
                  {engineers.map((engineer) => (
                    <option key={engineer.id} value={engineer.id}>{engineer.fullName}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveForm()}
                className="rounded-lg border border-sky-400/30 bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-100 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-[10px] uppercase tracking-wide text-white/40">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-2 py-2 text-xs text-white"
      >
        {children}
      </select>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs text-white/45">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[#071018] px-2 py-2 text-sm text-white"
      />
    </label>
  );
}
