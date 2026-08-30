"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Calculator,
  Check,
  FolderKanban,
  GraduationCap,
  Headphones,
  HardHat,
  Layers,
  Megaphone,
  MessageSquare,
  Plus,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "saec-discovery-v1";

type SoftwareEntry = {
  id: string;
  name: string;
  capabilities: string[];
};

type AreaState = {
  completed: boolean;
  software: SoftwareEntry[];
};

type DiscoveryState = Record<string, AreaState>;

type AreaDef = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  capabilities: string[];
};

const AREAS: AreaDef[] = [
  {
    id: "client-management",
    title: "Client Management",
    subtitle: "Clients & relationships",
    icon: Users,
    capabilities: ["Client Directory", "Contacts", "Onboarding", "Account Management"],
  },
  {
    id: "sales-management",
    title: "Sales Management",
    subtitle: "Sales & pipeline",
    icon: ShoppingCart,
    capabilities: [
      "Leads",
      "Opportunities",
      "Sales Pipeline",
      "Quotes / Proposals",
      "Follow-ups",
      "Reporting",
      "Forecasting",
      "Contracts",
      "Renewals",
    ],
  },
  {
    id: "finances",
    title: "Finances",
    subtitle: "Finance & accounting",
    icon: Calculator,
    capabilities: [
      "General Ledger",
      "Invoicing",
      "Accounts Payable",
      "Accounts Receivable",
      "Expenses",
      "Payroll",
      "Banking",
      "Financial Reports",
    ],
  },
  {
    id: "operations",
    title: "Operations",
    subtitle: "Operations & installations",
    icon: Layers,
    capabilities: ["Asset Management", "Inventory", "Stock Control", "Logistics", "Procurement"],
  },
  {
    id: "marketing-events",
    title: "Marketing & Events",
    subtitle: "Marketing & events",
    icon: Megaphone,
    capabilities: ["Campaigns", "Events", "Email Marketing", "Social Media", "Mailing Lists"],
  },
  {
    id: "tech-management",
    title: "Tech Management",
    subtitle: "Technology & IT",
    icon: Settings2,
    capabilities: ["IT Assets", "Software & Licenses", "Infrastructure", "Security", "Support Tickets"],
  },
  {
    id: "human-resources",
    title: "Human Resources",
    subtitle: "People & HR",
    icon: Briefcase,
    capabilities: [
      "Employee Records",
      "Recruitment",
      "Time & Attendance",
      "Payroll",
      "Leave Management",
    ],
  },
  {
    id: "business-productivity",
    title: "Business Productivity",
    subtitle: "Day-to-day tools",
    icon: MessageSquare,
    capabilities: ["Email", "Calendar", "File Storage", "Messaging", "Video Meetings"],
  },
  {
    id: "support",
    title: "Support",
    subtitle: "Customer support",
    icon: Headphones,
    capabilities: ["Ticket Tracking", "Service Requests", "Helpdesk", "Customer Communication"],
  },
  {
    id: "project-management",
    title: "Project Management",
    subtitle: "Projects & delivery",
    icon: FolderKanban,
    capabilities: ["Projects", "Tasks", "Timelines", "Resource Planning", "Milestones"],
  },
  {
    id: "engineering",
    title: "Engineering",
    subtitle: "Technical work",
    icon: HardHat,
    capabilities: ["Technical Files", "Programs", "Design Documentation", "Change Control"],
  },
  {
    id: "training",
    title: "Training",
    subtitle: "Learning & skills",
    icon: GraduationCap,
    capabilities: ["Courses", "Certifications", "Staff Training", "Compliance Training"],
  },
  {
    id: "qms",
    title: "QMS",
    subtitle: "Quality management",
    icon: ShieldCheck,
    capabilities: ["Document Control", "Quality Audits", "CAPA", "Compliance Reporting"],
  },
];

function emptyAreaState(): AreaState {
  return { completed: false, software: [] };
}

function loadState(): DiscoveryState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DiscoveryState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistState(state: DiscoveryState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function newSoftwareEntry(): SoftwareEntry {
  return { id: crypto.randomUUID(), name: "", capabilities: [] };
}

function CapabilityChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all",
        selected
          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 shadow-[0_0_0_1px_rgba(52,211,153,0.15)]"
          : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/90",
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={2.5} /> : null}
      {label}
    </button>
  );
}

export default function SaecDiscoveryApp() {
  const [stored, setStored] = useState<DiscoveryState>({});
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftSoftware, setDraftSoftware] = useState<SoftwareEntry[]>([]);

  useEffect(() => {
    setStored(loadState());
    setHydrated(true);
  }, []);

  const activeArea = useMemo(
    () => AREAS.find((area) => area.id === activeId) ?? null,
    [activeId],
  );

  const openArea = useCallback(
    (areaId: string) => {
      const existing = stored[areaId] ?? emptyAreaState();
      setActiveId(areaId);
      setDraftSoftware(
        existing.software.length > 0
          ? existing.software.map((entry) => ({ ...entry, capabilities: [...entry.capabilities] }))
          : [],
      );
    },
    [stored],
  );

  const closeForm = useCallback(() => {
    setActiveId(null);
    setDraftSoftware([]);
  }, []);

  const saveArea = useCallback(() => {
    if (!activeId) return;
    const trimmed = draftSoftware
      .map((entry) => ({
        ...entry,
        name: entry.name.trim(),
        capabilities: [...entry.capabilities],
      }))
      .filter((entry) => entry.name.length > 0);

    if (trimmed.length === 0) return;

    const next: DiscoveryState = {
      ...stored,
      [activeId]: {
        completed: true,
        software: trimmed,
      },
    };
    setStored(next);
    persistState(next);
    closeForm();
  }, [activeId, closeForm, draftSoftware, stored]);

  const addSoftware = useCallback(() => {
    setDraftSoftware((current) => [...current, newSoftwareEntry()]);
  }, []);

  const updateSoftwareName = useCallback((id: string, name: string) => {
    setDraftSoftware((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, name } : entry)),
    );
  }, []);

  const toggleCapability = useCallback((softwareId: string, capability: string) => {
    setDraftSoftware((current) =>
      current.map((entry) => {
        if (entry.id !== softwareId) return entry;
        const has = entry.capabilities.includes(capability);
        return {
          ...entry,
          capabilities: has
            ? entry.capabilities.filter((item) => item !== capability)
            : [...entry.capabilities, capability],
        };
      }),
    );
  }, []);

  const removeSoftware = useCallback((id: string) => {
    setDraftSoftware((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const canSave = draftSoftware.some((entry) => entry.name.trim().length > 0);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(47,128,237,0.18),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="mb-10 sm:mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
            SAEC Discovery
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Current Systems
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
            Tell us what software you currently use across the areas below.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {AREAS.map((area) => {
            const state = stored[area.id];
            const completed = Boolean(state?.completed);
            const isActive = activeId === area.id;
            const Icon = area.icon;

            return (
              <button
                key={area.id}
                type="button"
                onClick={() => openArea(area.id)}
                className={cn(
                  "group relative flex min-h-[148px] flex-col items-start rounded-2xl border p-5 text-left transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]",
                  completed
                    ? "border-emerald-400/35 bg-gradient-to-br from-emerald-500/12 via-emerald-500/5 to-transparent shadow-[0_0_0_1px_rgba(52,211,153,0.12)]"
                    : isActive
                      ? "border-sky-400/40 bg-white/[0.06] shadow-[0_0_0_1px_rgba(56,189,248,0.12)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                )}
              >
                {completed ? (
                  <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                ) : null}
                <span
                  className={cn(
                    "mb-4 flex h-11 w-11 items-center justify-center rounded-xl border",
                    completed
                      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/[0.04] text-sky-200 group-hover:border-white/15 group-hover:bg-white/[0.06]",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="text-base font-semibold leading-snug text-white">{area.title}</span>
                <span
                  className={cn(
                    "mt-1 text-xs leading-relaxed",
                    completed ? "text-emerald-200/70" : "text-white/45",
                  )}
                >
                  {area.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {activeArea ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[#0b1524]/90 p-5 shadow-xl backdrop-blur-sm sm:p-7">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {activeArea.title}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                  What software do you currently use?
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white/85"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {draftSoftware.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/45">
                  Add the software or systems you use in this area — for example SAP, Excel, or None.
                </p>
              ) : null}

              {draftSoftware.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-white/10 bg-[#070f1a] p-4 sm:p-5"
                >
                  <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                    Software / System
                  </label>
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(event) => updateSoftwareName(entry.id, event.target.value)}
                    placeholder="e.g. SAP, Excel, None, Bespoke desktop application"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sky-400/50"
                  />

                  <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                    Used for
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeArea.capabilities.map((capability) => (
                      <CapabilityChip
                        key={capability}
                        label={capability}
                        selected={entry.capabilities.includes(capability)}
                        onToggle={() => toggleCapability(entry.id, capability)}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSoftware(entry.id)}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSoftware}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-sky-200 transition-colors hover:border-sky-400/30 hover:bg-sky-500/10"
              >
                <Plus className="h-4 w-4" />
                Add software
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                disabled={!canSave}
                onClick={saveArea}
                className="inline-flex min-w-[120px] items-center justify-center rounded-xl bg-[#1F4FBF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save
              </button>
              {!canSave ? (
                <p className="text-xs text-white/40">Enter at least one software name to save.</p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
