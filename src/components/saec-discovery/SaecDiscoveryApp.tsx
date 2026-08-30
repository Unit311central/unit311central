"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Calculator,
  Check,
  ChevronRight,
  FolderKanban,
  GraduationCap,
  Headphones,
  HardHat,
  Layers,
  Megaphone,
  MessageSquare,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "saec-discovery-v2";

type ModuleState = {
  completed: boolean;
  responses: Record<string, string>;
};

type DiscoveryState = Record<string, ModuleState>;

type ModuleDef = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  functions: string[];
};

/** SAEC discovery configuration — reusable module → function → software shape. */
const DISCOVERY_MODULES: ModuleDef[] = [
  {
    id: "client-management",
    title: "Client Management",
    icon: Users,
    functions: ["Client Directory", "Contacts", "Onboarding", "Account Management"],
  },
  {
    id: "sales-management",
    title: "Sales Management",
    icon: ShoppingCart,
    functions: ["Pipeline", "Sales Quotes", "Targets & Forecast", "Performance"],
  },
  {
    id: "finances",
    title: "Finances",
    icon: Calculator,
    functions: [
      "General Ledger",
      "Invoicing",
      "Accounts Payable",
      "Accounts Receivable",
      "Expenses",
      "Payroll",
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: Layers,
    functions: ["Asset Management", "Inventory", "Stock Control", "Logistics", "Procurement"],
  },
  {
    id: "marketing-events",
    title: "Marketing & Events",
    icon: Megaphone,
    functions: ["Campaigns", "Events", "Email Marketing", "Social Media", "Mailing Lists"],
  },
  {
    id: "tech-management",
    title: "Tech Management",
    icon: Settings2,
    functions: ["IT Assets", "Software & Licenses", "Infrastructure", "Security", "Support Tickets"],
  },
  {
    id: "human-resources",
    title: "Human Resources",
    icon: Briefcase,
    functions: [
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
    icon: MessageSquare,
    functions: ["Email", "Calendar", "File Storage", "Messaging", "Video Meetings"],
  },
  {
    id: "support",
    title: "Support",
    icon: Headphones,
    functions: ["Ticket Tracking", "Service Requests", "Helpdesk", "Customer Communication"],
  },
  {
    id: "project-management",
    title: "Project Management",
    icon: FolderKanban,
    functions: ["Projects", "Tasks", "Timelines", "Resource Planning", "Milestones"],
  },
  {
    id: "engineering",
    title: "Engineering",
    icon: HardHat,
    functions: ["Technical Files", "Programs", "Design Documentation", "Change Control"],
  },
  {
    id: "training",
    title: "Training",
    icon: GraduationCap,
    functions: ["Courses", "Certifications", "Staff Training", "Compliance Training"],
  },
  {
    id: "qms",
    title: "QMS",
    icon: ShieldCheck,
    functions: ["Document Control", "Quality Audits", "CAPA", "Compliance Reporting"],
  },
];

function emptyResponses(functions: string[]): Record<string, string> {
  return Object.fromEntries(functions.map((fn) => [fn, ""]));
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

function draftFromModule(module: ModuleDef, saved?: ModuleState): Record<string, string> {
  const base = emptyResponses(module.functions);
  if (!saved?.responses) return base;
  for (const fn of module.functions) {
    base[fn] = saved.responses[fn] ?? "";
  }
  return base;
}

export default function SaecDiscoveryApp() {
  const [stored, setStored] = useState<DiscoveryState>({});
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const loaded = loadState();
    setStored(loaded);
    const first = DISCOVERY_MODULES[0];
    if (first) {
      setSelectedId(first.id);
      setDraft(draftFromModule(first, loaded[first.id]));
    }
    setHydrated(true);
  }, []);

  const selectModule = useCallback(
    (module: ModuleDef) => {
      setSelectedId(module.id);
      setDraft(draftFromModule(module, stored[module.id]));
    },
    [stored],
  );

  const updateDraft = useCallback((functionName: string, value: string) => {
    setDraft((current) => ({ ...current, [functionName]: value }));
  }, []);

  const saveModule = useCallback(
    (module: ModuleDef) => {
      const responses = Object.fromEntries(
        module.functions.map((fn) => [fn, (draft[fn] ?? "").trim()]),
      );
      const saved: ModuleState = { completed: true, responses };
      const next: DiscoveryState = {
        ...stored,
        [module.id]: saved,
      };
      setStored(next);
      persistState(next);
      setDraft(draftFromModule(module, saved));
    },
    [draft, stored],
  );

  const selectedModule = DISCOVERY_MODULES.find((module) => module.id === selectedId) ?? null;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(47,128,237,0.14),transparent)]"
        aria-hidden
      />

      <div className="relative flex min-h-screen w-full flex-col px-4 py-3 sm:px-6 sm:py-4 lg:px-8 xl:px-10">
        <header className="mb-4 shrink-0 sm:mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
            SAEC Discovery
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Current Systems
          </h1>
          <p className="mt-1.5 text-sm text-white/55">What software do you currently use?</p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-5">
          {/* Left navigation */}
          <nav
            className="shrink-0 rounded-xl border border-white/10 bg-[#0b1524]/60 lg:w-[260px] xl:w-[280px]"
            aria-label="Discovery areas"
          >
            <ul className="divide-y divide-white/[0.06]">
              {DISCOVERY_MODULES.map((module) => {
                const state = stored[module.id];
                const completed = Boolean(state?.completed);
                const selected = selectedId === module.id;
                const Icon = module.icon;

                return (
                  <li key={module.id}>
                    <button
                      type="button"
                      onClick={() => selectModule(module)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-inset",
                        selected
                          ? "bg-sky-500/10 text-white"
                          : "text-white/80 hover:bg-white/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                          completed
                            ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                            : selected
                              ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                              : "border-white/10 bg-white/[0.03] text-white/50",
                        )}
                      >
                        {completed ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        ) : (
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        )}
                      </span>

                      <span
                        className={cn(
                          "min-w-0 flex-1 text-[11px] font-semibold uppercase leading-snug tracking-[0.05em]",
                          completed && !selected && "text-emerald-100/90",
                        )}
                      >
                        {module.title}
                      </span>

                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          selected ? "text-sky-300/80" : "text-white/25",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right working panel */}
          <main className="min-h-[420px] flex-1 rounded-xl border border-white/10 bg-[#0b1524]/80 p-5 sm:p-6 lg:p-8">
            {selectedModule ? (
              <>
                <h2 className="text-lg font-semibold uppercase tracking-[0.08em] text-white sm:text-xl">
                  {selectedModule.title}
                </h2>

                <div className="mt-6 mb-4 hidden gap-6 border-b border-white/10 pb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 md:grid md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                  <span>Function</span>
                  <span>Software</span>
                </div>

                <div className="space-y-3">
                  {selectedModule.functions.map((functionName) => (
                    <div
                      key={functionName}
                      className="grid gap-2 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-center md:gap-6"
                    >
                      <label
                        htmlFor={`${selectedModule.id}-${functionName}`}
                        className="text-sm text-white/80"
                      >
                        {functionName}
                      </label>
                      <input
                        id={`${selectedModule.id}-${functionName}`}
                        type="text"
                        value={draft[functionName] ?? ""}
                        onChange={(event) => updateDraft(functionName, event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#070f1a] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={() => saveModule(selectedModule)}
                    className="inline-flex items-center justify-center rounded-lg bg-[#1F4FBF] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2563eb]"
                  >
                    Save {selectedModule.title}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-white/45">Select an area from the list.</p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
