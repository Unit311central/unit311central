"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Calculator,
  Check,
  ChevronDown,
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
    functions: [
      "Prospects",
      "Opportunities",
      "Pipeline",
      "Sales Quotes",
      "Activities",
      "Targets & Forecast",
      "Performance",
      "Commissions",
      "Reports",
    ],
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
      "Banking",
      "Financial Reports",
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    setStored(loadState());
    setHydrated(true);
  }, []);

  const toggleModule = useCallback(
    (module: ModuleDef) => {
      if (expandedId === module.id) {
        setExpandedId(null);
        setDraft({});
        return;
      }
      setExpandedId(module.id);
      setDraft(draftFromModule(module, stored[module.id]));
    },
    [expandedId, stored],
  );

  const updateDraft = useCallback((functionName: string, value: string) => {
    setDraft((current) => ({ ...current, [functionName]: value }));
  }, []);

  const saveModule = useCallback(
    (module: ModuleDef) => {
      const responses = Object.fromEntries(
        module.functions.map((fn) => [fn, (draft[fn] ?? "").trim()]),
      );
      const next: DiscoveryState = {
        ...stored,
        [module.id]: { completed: true, responses },
      };
      setStored(next);
      persistState(next);
      setExpandedId(null);
      setDraft({});
    },
    [draft, stored],
  );

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
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(47,128,237,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
            SAEC Discovery
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Current Systems
          </h1>
          <p className="mt-2 text-sm text-white/55">What software do you currently use?</p>
        </header>

        <div className="space-y-2">
          {DISCOVERY_MODULES.map((module) => {
            const state = stored[module.id];
            const completed = Boolean(state?.completed);
            const expanded = expandedId === module.id;
            const Icon = module.icon;

            return (
              <div
                key={module.id}
                className={cn(
                  "overflow-hidden rounded-xl border transition-colors",
                  completed
                    ? "border-emerald-400/30 bg-emerald-500/[0.06]"
                    : expanded
                      ? "border-sky-400/35 bg-white/[0.04]"
                      : "border-white/10 bg-white/[0.02]",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleModule(module)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-inset",
                    !expanded && !completed && "hover:bg-white/[0.03]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      completed
                        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.04] text-sky-200/90",
                    )}
                  >
                    {completed ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    )}
                  </span>

                  <span
                    className={cn(
                      "min-w-0 flex-1 text-sm font-semibold uppercase tracking-[0.06em]",
                      completed ? "text-emerald-100" : "text-white",
                    )}
                  >
                    {module.title}
                  </span>

                  <span className="shrink-0 text-white/35">
                    {expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {expanded ? (
                  <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5">
                    <div className="mb-3 hidden gap-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(180px,240px)]">
                      <span>Function</span>
                      <span>Software</span>
                    </div>

                    <div className="space-y-2.5">
                      {module.functions.map((functionName) => (
                        <div
                          key={functionName}
                          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(180px,240px)] sm:items-center sm:gap-4"
                        >
                          <label
                            htmlFor={`${module.id}-${functionName}`}
                            className="text-sm text-white/80"
                          >
                            {functionName}
                          </label>
                          <input
                            id={`${module.id}-${functionName}`}
                            type="text"
                            value={draft[functionName] ?? ""}
                            onChange={(event) => updateDraft(functionName, event.target.value)}
                            placeholder="SAP, Excel, None…"
                            className="w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-sky-400/50"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => saveModule(module)}
                        className="inline-flex items-center justify-center rounded-lg bg-[#1F4FBF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2563eb]"
                      >
                        Save {module.title}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
