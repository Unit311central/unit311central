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
  Loader2,
  Megaphone,
  MessageSquare,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  SAEC_DISCOVERY_MODULES,
  SAEC_DISCOVERY_STORAGE_KEY,
  buildDiscoverySubmissionSnapshot,
  emptyModuleResponses,
  type SaecDiscoveryIconKey,
} from "@/lib/saec-discovery/config";
import type { SaecDiscoveryState } from "@/lib/saec-discovery/types";
import { cn } from "@/lib/utils";

const ICONS: Record<
  SaecDiscoveryIconKey,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  Users,
  ShoppingCart,
  Calculator,
  Layers,
  Megaphone,
  Settings2,
  Briefcase,
  MessageSquare,
  Headphones,
  FolderKanban,
  HardHat,
  GraduationCap,
  ShieldCheck,
};

type ModuleDef = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  functions: readonly string[];
};

const DISCOVERY_MODULES: ModuleDef[] = SAEC_DISCOVERY_MODULES.map((module) => ({
  ...module,
  icon: ICONS[module.icon],
}));

function loadState(): SaecDiscoveryState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SAEC_DISCOVERY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SaecDiscoveryState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistState(state: SaecDiscoveryState) {
  window.localStorage.setItem(SAEC_DISCOVERY_STORAGE_KEY, JSON.stringify(state));
}

function draftFromModule(module: ModuleDef, saved?: SaecDiscoveryState[string]): Record<string, string> {
  const base = emptyModuleResponses(module.functions);
  if (!saved?.responses) return base;
  for (const fn of module.functions) {
    base[fn] = saved.responses[fn] ?? "";
  }
  return base;
}

function formatSubmittedAt(value: string | null | undefined) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default function SaecDiscoveryApp() {
  const [stored, setStored] = useState<SaecDiscoveryState>({});
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/saec-discovery/submit", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          submitted?: boolean;
          submittedAt?: string | null;
        };
        if (cancelled) return;
        if (payload.submitted && payload.submittedAt) {
          setSubmittedAt(payload.submittedAt);
        }
      } catch {
        // Status lookup is best-effort; local draft remains available offline.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

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
      const saved = { completed: true, responses };
      const next: SaecDiscoveryState = {
        ...stored,
        [module.id]: saved,
      };
      setStored(next);
      persistState(next);
      setDraft(draftFromModule(module, saved));
    },
    [draft, stored],
  );

  const submitDiscovery = useCallback(async () => {
    if (submitting) return;

    const alreadySubmitted = Boolean(submittedAt);
    if (
      alreadySubmitted &&
      !window.confirm(
        "SAEC Discovery has already been submitted. Submit again to update the stored response?",
      )
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMessage(null);

    try {
      const snapshot = buildDiscoverySubmissionSnapshot(stored, selectedId, draft);
      const response = await fetch("/api/saec-discovery/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: snapshot }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        submission?: { submittedAt?: string; updatedAt?: string };
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Unable to submit SAEC Discovery.");
      }

      const when = payload.submission?.submittedAt ?? payload.submission?.updatedAt ?? null;
      setSubmittedAt(when);
      setSubmitSuccessMessage(
        alreadySubmitted
          ? "SAEC Discovery updated successfully."
          : "SAEC Discovery submitted successfully.",
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit SAEC Discovery.");
    } finally {
      setSubmitting(false);
    }
  }, [draft, selectedId, stored, submittedAt, submitting]);

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

        <section className="mt-5 shrink-0 rounded-xl border border-white/10 bg-[#0b1524]/70 p-5 sm:p-6">
          {submittedAt ? (
            <p className="mb-4 text-sm text-sky-200/85">
              Previously submitted on {formatSubmittedAt(submittedAt)}.
            </p>
          ) : null}
          {submitSuccessMessage ? (
            <p className="mb-4 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {submitSuccessMessage}
            </p>
          ) : null}
          {submitError ? (
            <p className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {submitError}
            </p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void submitDiscovery()}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-[#1F4FBF] px-6 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : submittedAt ? (
                "Update SAEC Discovery"
              ) : (
                "Submit SAEC Discovery"
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
