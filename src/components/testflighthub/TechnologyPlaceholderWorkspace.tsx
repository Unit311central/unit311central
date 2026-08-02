"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cpu,
  KeyRound,
  Laptop,
  Pencil,
  Plus,
  Radio,
  ScrollText,
  Server,
  Settings,
  Trash2,
} from "lucide-react";

import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import {
  ABHI_TECH_ASSETS,
  ABHI_TECH_DEVICES,
  type AbhiTechTelecom,
  isAbhiMobileTelecomService,
  loadAbhiTelecoms,
  saveAbhiTelecoms,
  sumAbhiTelecomMonthlySpend,
} from "@/lib/abhi-tech-fake-data";
import { cn } from "@/lib/utils";
import { WsEmpty, WsSection } from "./domain-workspace-ui";

type TechnologyPlaceholderModule =
  | "devices"
  | "telecommunications"
  | "infrastructure"
  | "reports"
  | "settings";

const MODULE_COPY: Record<
  TechnologyPlaceholderModule,
  {
    title: string;
    icon: typeof Laptop;
    eyebrow: string;
    summary: string;
    futureScope: string[];
    integrations: string[];
  }
> = {
  devices: {
    title: "Devices",
    icon: Laptop,
    eyebrow: "Physical technology estate",
    summary:
      "Manage laptops, desktops, monitors, mobiles, networking hardware, servers and peripherals. Each device will link to employees, assets, locations, suppliers, warranties, purchase orders, finance and support tickets.",
    futureScope: [
      "Laptops, desktops, monitors, docking stations",
      "Mobile phones, tablets, printers",
      "Routers, switches, firewalls, wireless access points",
      "Servers, storage, peripherals",
      "Assignment to employees and locations",
      "Warranty, supplier and PO linkage",
    ],
    integrations: ["HR & People", "Assets", "Inventory", "Procurement", "Financials", "Service Desk"],
  },
  telecommunications: {
    title: "Telecommunications",
    icon: Radio,
    eyebrow: "Connectivity & voice services",
    summary:
      "Track mobile lines, SIM/eSIM inventory, carriers, plans, broadband, fibre, WAN links and circuit identifiers — with costs, contracts and assigned users.",
    futureScope: [
      "Mobile phones, SIM cards, eSIMs, phone numbers",
      "Carriers, mobile plans, monthly costs",
      "Internet, broadband, fibre, WAN links",
      "Contracts, public IPs, circuit IDs",
      "Assigned users and technology vendors",
    ],
    integrations: ["Devices", "Financials", "HR & People", "Procurement"],
  },
  infrastructure: {
    title: "Infrastructure",
    icon: Server,
    eyebrow: "Cloud platforms & platform services",
    summary:
      "Operate the company's internal cloud and platform footprint — AWS, Azure, GCP, Supabase, Vercel, Cloudflare — plus identity, DNS, SSL, backups, monitoring and disaster recovery.",
    futureScope: [
      "Cloud platforms: AWS, Azure, Google Cloud",
      "Supabase, Vercel, Cloudflare",
      "Servers, databases, DNS, domains, SSL",
      "Backups, monitoring, identity, VPN, SSO",
      "Disaster recovery runbooks",
    ],
    integrations: ["Financials", "Operations", "Service Desk"],
  },
  reports: {
    title: "Reports",
    icon: ScrollText,
    eyebrow: "Technology estate reporting",
    summary:
      "Production-quality reporting for device utilisation, licence compliance, telecom spend, infrastructure health and renewal forecasts will live here.",
    futureScope: [
      "Device inventory and utilisation reports",
      "Licence compliance and seat usage",
      "Telecom spend by department",
      "Infrastructure health & uptime",
      "Renewal and warranty forecasts",
    ],
    integrations: ["Financials", "HR & People", "Business Central"],
  },
  settings: {
    title: "Settings",
    icon: Settings,
    eyebrow: "Technology Management configuration",
    summary:
      "Workspace configuration for categories, approval defaults, vendor catalogues, alert thresholds and integration endpoints will be managed here.",
    futureScope: [
      "Device and software categories",
      "Alert thresholds and renewal windows",
      "Vendor catalogue defaults",
      "Role permissions for Technology officers",
      "Integration endpoints (Finance, HR, Service Desk)",
    ],
    integrations: ["Settings", "Users", "Procurement"],
  },
};

function statusClass(status: string) {
  if (/in use|active/i.test(status)) return "bg-emerald-500/15 text-emerald-200";
  if (/spare|pending/i.test(status)) return "bg-amber-500/15 text-amber-200";
  if (/repair|cancelled/i.test(status)) return "bg-rose-500/15 text-rose-200";
  return "bg-white/10 text-white/60";
}

function AbhiDevicesRegister() {
  return (
    <div className="space-y-4">
      <WsSection title="Devices" subtitle="ABHI physical technology estate">
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-2.5">Device</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Assigned</th>
                <th className="px-3 py-2.5">Location</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Warranty</th>
              </tr>
            </thead>
            <tbody>
              {ABHI_TECH_DEVICES.map((row) => (
                <tr key={row.id} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5 font-medium text-white">{row.name}</td>
                  <td className="px-3 py-2.5">{row.type}</td>
                  <td className="px-3 py-2.5">{row.assignedTo}</td>
                  <td className="px-3 py-2.5">{row.location}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", statusClass(row.status))}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{row.warranty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WsSection>
      <WsSection title="Tech Assets" subtitle="Tagged ABHI estate">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ABHI_TECH_ASSETS.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-3 py-3"
            >
              <p className="text-[11px] font-mono text-sky-300/80">{asset.tag}</p>
              <p className="mt-1 text-sm font-medium text-white">{asset.name}</p>
              <p className="mt-1 text-xs text-white/45">
                {asset.category} · {asset.location}
              </p>
              <p className="mt-2 text-sm tabular-nums text-white/80">
                £{asset.valueGbp.toLocaleString("en-GB")}
              </p>
            </div>
          ))}
        </div>
      </WsSection>
    </div>
  );
}

function newTelecomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `abhi-tel-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `abhi-tel-${Date.now().toString(36)}`;
}

const EMPTY_TELECOM_FORM: Omit<AbhiTechTelecom, "id"> = {
  service: "Mobile plan",
  carrier: "",
  numberOrCircuit: "",
  assignedTo: "",
  monthlyCostGbp: 0,
  status: "Active",
  manufacturer: "",
  model: "",
};

function AbhiTelecomsRegister() {
  const [rows, setRows] = useState<AbhiTechTelecom[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_TELECOM_FORM);

  useEffect(() => {
    setRows(loadAbhiTelecoms());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: AbhiTechTelecom[]) => {
    setRows(next);
    saveAbhiTelecoms(next);
  }, []);

  const monthly = useMemo(() => sumAbhiTelecomMonthlySpend(rows), [rows]);
  const isMobile = isAbhiMobileTelecomService(form.service);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_TELECOM_FORM });
    setEditorOpen(true);
  }

  function openEdit(row: AbhiTechTelecom) {
    setEditingId(row.id);
    setForm({
      service: row.service,
      carrier: row.carrier,
      numberOrCircuit: row.numberOrCircuit,
      assignedTo: row.assignedTo,
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
    setForm({ ...EMPTY_TELECOM_FORM });
  }

  function handleSave() {
    const payload: Omit<AbhiTechTelecom, "id"> = {
      service: form.service.trim() || "Mobile plan",
      carrier: form.carrier.trim(),
      numberOrCircuit: form.numberOrCircuit.trim(),
      assignedTo: form.assignedTo.trim(),
      monthlyCostGbp: Math.max(0, Number(form.monthlyCostGbp) || 0),
      status: form.status,
      ...(isAbhiMobileTelecomService(form.service)
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

  return (
    <div className="space-y-4">
      <WsSection
        title="Telecommunications"
        subtitle="ABHI connectivity & voice"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              £{monthly}/mo
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
                £/month
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
                      status: event.target.value as AbhiTechTelecom["status"],
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
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-3 py-2.5">Service</th>
                  <th className="px-3 py-2.5">Carrier</th>
                  <th className="px-3 py-2.5">Number / circuit</th>
                  <th className="px-3 py-2.5">Handset</th>
                  <th className="px-3 py-2.5">Assigned</th>
                  <th className="px-3 py-2.5">£/mo</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const handset =
                    isAbhiMobileTelecomService(row.service) && (row.manufacturer || row.model)
                      ? [row.manufacturer, row.model].filter(Boolean).join(" ")
                      : "—";
                  return (
                    <tr key={row.id} className="border-t border-white/8 text-white/80">
                      <td className="px-3 py-2.5 font-medium text-white">{row.service}</td>
                      <td className="px-3 py-2.5">{row.carrier}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{row.numberOrCircuit}</td>
                      <td className="px-3 py-2.5 text-white/65">{handset}</td>
                      <td className="px-3 py-2.5">{row.assignedTo}</td>
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
        )}
      </WsSection>
    </div>
  );
}

type TechnologyPlaceholderWorkspaceProps = {
  module: TechnologyPlaceholderModule;
};

export default function TechnologyPlaceholderWorkspace({
  module,
}: TechnologyPlaceholderWorkspaceProps) {
  const isAbhi = isBrowserAbhiSurface();
  if (isAbhi && module === "devices") return <AbhiDevicesRegister />;
  if (isAbhi && module === "telecommunications") return <AbhiTelecomsRegister />;

  const copy = MODULE_COPY[module];
  const Icon = copy.icon;

  return (
    <div className="space-y-4">
      <WsSection
        title={copy.title}
        subtitle={copy.eyebrow}
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-200">
            <Cpu className="h-3.5 w-3.5" />
            Coming online
          </span>
        }
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1524] text-sky-300">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-white/70">{copy.summary}</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
              Integrates with
            </p>
            <div className="flex flex-wrap gap-2">
              {copy.integrations.map((label) => (
                <span
                  key={label}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </WsSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <WsSection title="Planned capability" subtitle="Roadmap for this module">
          <ul className="space-y-2">
            {copy.futureScope.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-xl border border-white/10 bg-[#0b1524]/70 px-3 py-2.5 text-sm text-white/75"
              >
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400/80" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </WsSection>

        <WsSection title="Module status" subtitle="Information architecture complete">
          <WsEmpty message={`${copy.title} is scaffolded. Navigation, permissions boundaries and integration points are in place. Operational workflows will land in a later release without changing this workspace structure.`} />
        </WsSection>
      </div>
    </div>
  );
}
