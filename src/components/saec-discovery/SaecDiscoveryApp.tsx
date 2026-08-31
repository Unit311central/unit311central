"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart2,
  Briefcase,
  Calculator,
  Check,
  ChevronRight,
  FileText,
  FolderKanban,
  GraduationCap,
  Headphones,
  HardHat,
  Layers,
  Loader2,
  Megaphone,
  MessageSquare,
  Send,
  Settings2,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import SaecDiscoveryLogo from "@/components/saec-discovery/SaecDiscoveryLogo";
import {
  DISCOVERY_GENERAL_QUESTION_LABEL_CLASS,
  DISCOVERY_QUESTION_LABEL_CLASS,
  DiscoveryOptionalTextarea,
  DiscoverySectionHeader,
  DiscoverySoftwareFunctionPanel,
  DiscoveryVerticalQuestionsPanel,
} from "@/components/saec-discovery/SaecDiscoverySectionUi";
import {
  SAEC_DISCOVERY_SECTIONS,
  buildDiscoverySubmissionSnapshot,
  clearStoredDiscoveryDraft,
  emptySectionResponses,
  normalizeDiscoveryResponses,
  readStoredDiscoveryDraft,
  responseKeysForSection,
  writeStoredDiscoveryDraft,
  type SaecDiscoveryIconKey,
  type SaecDiscoveryQuestionConfig,
  type SaecDiscoverySectionConfig,
} from "@/lib/saec-discovery/config";
import type { SaecDiscoveryState } from "@/lib/saec-discovery/types";
import { cn } from "@/lib/utils";

const SERVER_SAVE_DEBOUNCE_MS = 750;

const ICONS: Record<
  SaecDiscoveryIconKey,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  FileText,
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
  BarChart2,
};

type SectionDef = SaecDiscoverySectionConfig & {
  iconComponent: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const DISCOVERY_SECTIONS: SectionDef[] = SAEC_DISCOVERY_SECTIONS.map((section) => ({
  ...section,
  iconComponent: ICONS[section.icon],
}));

/** General numbered questions only — ~60% question / ~40% answer. */
const GENERAL_QUESTION_GRID_CLASS =
  "grid items-start gap-x-6 gap-y-3 md:grid-cols-[minmax(0,60%)_minmax(0,40%)]";

function loadState(draftOwnerId: string | null | undefined) {
  return readStoredDiscoveryDraft(draftOwnerId);
}

function persistState(
  state: SaecDiscoveryState,
  draftOwnerId: string | null | undefined,
  savedAt?: number | null,
) {
  writeStoredDiscoveryDraft(draftOwnerId, state, savedAt);
}

function draftFromSection(
  section: SectionDef,
  saved?: SaecDiscoveryState[string],
): Record<string, string> {
  const base = emptySectionResponses(section);
  if (!saved?.responses) return base;
  for (const key of responseKeysForSection(section)) {
    base[key] = saved.responses[key] ?? "";
  }
  return base;
}

function formatDraftSavedAgo(savedAt: number | null) {
  if (!savedAt) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
  if (seconds < 10) return "Draft saved just now";
  if (seconds < 60) return `Draft saved ${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "Draft saved 1 minute ago";
  if (minutes < 60) return `Draft saved ${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "Draft saved 1 hour ago";
  return `Draft saved ${hours} hours ago`;
}

function SaveToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="pointer-events-none fixed bottom-5 right-5 z-50 rounded-lg border border-emerald-400/25 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100 shadow-lg backdrop-blur-sm"
    >
      {message}
    </div>
  );
}

function OptionalTextarea({
  id,
  value,
  onChange,
  rows = 3,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <DiscoveryOptionalTextarea
      id={id}
      value={value}
      onChange={onChange}
      rows={rows}
      className={className}
    />
  );
}

function QuestionNumber({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-400/35 bg-sky-500/10 text-[11px] font-semibold text-sky-200">
      {n}
    </span>
  );
}

function QuestionBlock({
  sectionId,
  question,
  value,
  onChange,
  index,
  layout = "stacked",
  answerRows = 2,
}: {
  sectionId: string;
  question: SaecDiscoveryQuestionConfig;
  value: string;
  onChange: (value: string) => void;
  index?: number;
  layout?: "stacked" | "row" | "row-emphasis";
  answerRows?: number;
}) {
  const inputId = `${sectionId}-${question.id}`;
  const emphasize = question.emphasizeAnswer === true || layout === "row-emphasis";
  const questionNumber = index ?? 0;

  const labelBlock = (
    <div className="min-w-0 space-y-2">
      <label
        htmlFor={inputId}
        className={layout === "row" || layout === "row-emphasis" ? DISCOVERY_GENERAL_QUESTION_LABEL_CLASS : DISCOVERY_QUESTION_LABEL_CLASS}
      >
        {question.label}
      </label>
      {question.note && !question.examples?.length ? (
        <p className="text-[12px] leading-relaxed text-white/45">{question.note}</p>
      ) : null}
      {question.examples?.length ? (
        <div className="space-y-2.5 pt-0.5">
          {question.note ? (
            <p className="text-[12px] leading-relaxed text-white/55">{question.note}</p>
          ) : null}
          <ul className="grid list-none gap-x-6 gap-y-2.5 text-[12px] leading-relaxed text-white/55 sm:grid-cols-2">
            {question.examples.map((example) => (
              <li key={example} className="flex gap-2">
                <span className="shrink-0 text-sky-400/70">•</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );

  if (layout === "row" || layout === "row-emphasis") {
    return (
      <div className={cn(GENERAL_QUESTION_GRID_CLASS, emphasize ? "" : "")}>
        <div className="flex min-w-0 items-start gap-3">
          {questionNumber > 0 ? (
            <QuestionNumber n={questionNumber} />
          ) : null}
          {labelBlock}
        </div>
        <OptionalTextarea
          id={inputId}
          value={value}
          onChange={onChange}
          rows={emphasize ? 5 : answerRows}
          className={cn(
            "self-start",
            emphasize ? "min-h-[5.5rem]" : "min-h-[3rem]",
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("min-h-0 space-y-1.5", emphasize ? "flex min-h-0 flex-1 flex-col" : "")}>
      {labelBlock}
      <OptionalTextarea
        id={inputId}
        value={value}
        onChange={onChange}
        rows={emphasize ? 5 : answerRows}
        className={emphasize ? "min-h-0 flex-1" : undefined}
      />
    </div>
  );
}

function SectionHeader({ section }: { section: SectionDef }) {
  const Icon = section.iconComponent;
  return <DiscoverySectionHeader title={section.title} icon={Icon} />;
}

function ReportingSectionPanel({
  section,
  draft,
  updateDraft,
}: {
  section: SectionDef;
  draft: Record<string, string>;
  updateDraft: (key: string, value: string) => void;
}) {
  return (
    <DiscoveryVerticalQuestionsPanel
      sectionId={section.id}
      questions={section.questions ?? []}
      draft={draft}
      updateDraft={updateDraft}
      answerRows={2}
    />
  );
}

function SoftwareSectionPanel({
  section,
  draft,
  updateDraft,
}: {
  section: SectionDef;
  draft: Record<string, string>;
  updateDraft: (key: string, value: string) => void;
}) {
  return (
    <DiscoverySoftwareFunctionPanel
      sectionId={section.id}
      functions={section.functions ?? []}
      draft={draft}
      updateDraft={updateDraft}
    />
  );
}

function GeneralSectionPanel({
  section,
  draft,
  updateDraft,
}: {
  section: SectionDef;
  draft: Record<string, string>;
  updateDraft: (key: string, value: string) => void;
}) {
  const questions = section.questions ?? [];
  const regular = questions.filter((q) => !q.emphasizeAnswer);
  const emphasized = questions.find((q) => q.emphasizeAnswer);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
      {section.intro ? (
        <p className="mb-6 shrink-0 text-[13px] leading-relaxed text-white/55">{section.intro}</p>
      ) : null}
      <div className="space-y-10 pb-8">
        {regular.map((question, index) => (
          <div key={question.id}>
            <QuestionBlock
              sectionId={section.id}
              question={question}
              index={index + 1}
              layout="row"
              answerRows={2}
              value={draft[question.id] ?? ""}
              onChange={(value) => updateDraft(question.id, value)}
            />
          </div>
        ))}
        {emphasized ? (
          <div className="pt-3">
            <QuestionBlock
              sectionId={section.id}
              question={emphasized}
              index={questions.length}
              layout="row-emphasis"
              value={draft[emphasized.id] ?? ""}
              onChange={(value) => updateDraft(emphasized.id, value)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

async function clearServerDraft() {
  try {
    await fetch("/api/saec-discovery/draft", { method: "DELETE" });
  } catch {
    // Best-effort; local draft is already cleared.
  }
}

export default function SaecDiscoveryApp({
  draftOwnerId = null,
}: {
  draftOwnerId?: string | null;
}) {
  const [stored, setStored] = useState<SaecDiscoveryState>({});
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [draftSavedLabel, setDraftSavedLabel] = useState<string | null>(null);
  const [serverSaving, setServerSaving] = useState(false);

  const serverSaveTimerRef = useRef<number | null>(null);
  const pendingServerStateRef = useRef<SaecDiscoveryState | null>(null);
  const autoSaveEnabledRef = useRef(false);

  const showNotice = useCallback((message: string) => {
    setSaveNotice(message);
    window.setTimeout(() => setSaveNotice(null), 2200);
  }, []);

  const scheduleServerSave = useCallback(
    (state: SaecDiscoveryState) => {
      if (!draftOwnerId) return;
      pendingServerStateRef.current = state;
      if (serverSaveTimerRef.current) {
        window.clearTimeout(serverSaveTimerRef.current);
      }
      serverSaveTimerRef.current = window.setTimeout(() => {
        const payload = pendingServerStateRef.current;
        if (!payload) return;
        setServerSaving(true);
        void (async () => {
          try {
            const response = await fetch("/api/saec-discovery/draft", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ responses: payload }),
            });
            if (response.ok) {
              const body = (await response.json()) as {
                draft?: { lastSavedAt?: string } | null;
              };
              const savedAt = body.draft?.lastSavedAt
                ? new Date(body.draft.lastSavedAt).getTime()
                : Date.now();
              setDraftSavedAt(savedAt);
            }
          } catch {
            // Server draft is best-effort when offline.
          } finally {
            setServerSaving(false);
          }
        })();
      }, SERVER_SAVE_DEBOUNCE_MS);
    },
    [draftOwnerId],
  );

  useEffect(() => {
    let cancelled = false;

    const applyLoaded = (loaded: SaecDiscoveryState, savedAt: number | null) => {
      if (cancelled) return;
      setStored(loaded);
      if (savedAt) {
        setDraftSavedAt(savedAt);
        setDraftSavedLabel(formatDraftSavedAgo(savedAt));
      }
      const first = DISCOVERY_SECTIONS[0];
      if (first) {
        setSelectedId(first.id);
        setDraft(draftFromSection(first, loaded[first.id]));
      }
      setHydrated(true);
      window.setTimeout(() => {
        autoSaveEnabledRef.current = true;
      }, 0);
    };

    const { state: local, savedAt: localSavedAt } = loadState(draftOwnerId);

    if (!draftOwnerId) {
      applyLoaded(local, localSavedAt);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      let merged = local;
      let mergedSavedAt = localSavedAt;

      try {
        const response = await fetch("/api/saec-discovery/draft", { cache: "no-store" });
        if (response.ok) {
          const payload = (await response.json()) as {
            draft?: { responses?: SaecDiscoveryState; lastSavedAt?: string } | null;
          };
          const serverDraft = payload.draft;
          if (serverDraft?.responses) {
            const serverSavedAt = serverDraft.lastSavedAt
              ? new Date(serverDraft.lastSavedAt).getTime()
              : 0;
            const localTs = localSavedAt ?? 0;
            if (serverSavedAt >= localTs) {
              merged = normalizeDiscoveryResponses(serverDraft.responses);
              mergedSavedAt = serverSavedAt || null;
              persistState(merged, draftOwnerId, mergedSavedAt);
            }
          }
        }
      } catch {
        // Local draft remains available offline.
      }

      applyLoaded(merged, mergedSavedAt);
    })();

    return () => {
      cancelled = true;
      if (serverSaveTimerRef.current) {
        window.clearTimeout(serverSaveTimerRef.current);
      }
    };
  }, [draftOwnerId]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/saec-discovery/submit", { cache: "no-store" });
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

  useEffect(() => {
    if (!draftSavedAt) return;
    setDraftSavedLabel(formatDraftSavedAgo(draftSavedAt));
    const timer = window.setInterval(() => {
      setDraftSavedLabel(formatDraftSavedAgo(draftSavedAt));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [draftSavedAt]);

  const selectedSection = useMemo(
    () => DISCOVERY_SECTIONS.find((section) => section.id === selectedId) ?? null,
    [selectedId],
  );

  const flushDraftToStored = useCallback(
    (section: SectionDef, markComplete = false): SaecDiscoveryState => {
      const keys = responseKeysForSection(section);
      const responses = Object.fromEntries(
        keys.map((key) => [key, (draft[key] ?? "").trim()]),
      );
      const saved = { completed: markComplete || Boolean(stored[section.id]?.completed), responses };
      const next: SaecDiscoveryState = { ...stored, [section.id]: saved };
      setStored(next);
      setDraft(draftFromSection(section, saved));
      return next;
    },
    [draft, stored],
  );

  const selectSection = useCallback(
    (section: SectionDef) => {
      if (selectedSection && selectedSection.id !== section.id) {
        flushDraftToStored(selectedSection, false);
      }
      setSelectedId(section.id);
      setDraft(draftFromSection(section, stored[section.id]));
    },
    [flushDraftToStored, selectedSection, stored],
  );

  const updateDraft = useCallback((key: string, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  useEffect(() => {
    if (!hydrated || !selectedSection || !autoSaveEnabledRef.current) return;

    setStored((previous) => {
      const keys = responseKeysForSection(selectedSection);
      const responses = Object.fromEntries(
        keys.map((key) => [key, (draft[key] ?? "").trim()]),
      );
      const sectionState = {
        completed: previous[selectedSection.id]?.completed ?? false,
        responses,
      };
      const next: SaecDiscoveryState = { ...previous, [selectedSection.id]: sectionState };
      const now = Date.now();
      persistState(next, draftOwnerId, now);
      setDraftSavedAt(now);
      scheduleServerSave(next);
      return next;
    });
  }, [draft, draftOwnerId, hydrated, scheduleServerSave, selectedSection]);

  const resetDraft = useCallback(() => {
    if (
      !window.confirm(
        "This will clear your saved draft on this device. Previously submitted information will not be affected. Continue?",
      )
    ) {
      return;
    }

    const empty = normalizeDiscoveryResponses({});
    setStored(empty);
    clearStoredDiscoveryDraft(draftOwnerId);
    if (draftOwnerId) {
      void clearServerDraft();
    }
    setDraftSavedAt(null);
    setDraftSavedLabel(null);
    if (selectedSection) {
      setDraft(draftFromSection(selectedSection, empty[selectedSection.id]));
    }
    showNotice("Draft cleared");
  }, [draftOwnerId, selectedSection, showNotice]);

  const submitDiscovery = useCallback(async () => {
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMessage(null);

    try {
      const snapshot = buildDiscoverySubmissionSnapshot(
        selectedSection ? flushDraftToStored(selectedSection, false) : stored,
        null,
        {},
      );
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

      const empty = normalizeDiscoveryResponses({});
      setStored(empty);
      clearStoredDiscoveryDraft(draftOwnerId);
      if (draftOwnerId) {
        void clearServerDraft();
      }
      setDraftSavedAt(null);
      setDraftSavedLabel(null);
      if (selectedSection) {
        setDraft(draftFromSection(selectedSection, empty[selectedSection.id]));
      }
      setSubmitSuccessMessage("Questionnaire submitted successfully.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit SAEC Discovery.");
    } finally {
      setSubmitting(false);
    }
  }, [draftOwnerId, flushDraftToStored, selectedSection, stored, submitting]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#020617] text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(47,128,237,0.14),transparent)]"
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 gap-3 px-4 py-2 sm:px-5 lg:gap-4 lg:px-6">
        {/* Left column: logo, navigation, secure panel */}
        <aside className="flex w-[210px] shrink-0 flex-col pt-2 lg:w-[228px]">
          <div className="mb-2 grid h-10 shrink-0 place-items-center justify-items-center">
            <SaecDiscoveryLogo height={28} maxWidth={100} priority />
          </div>

          <nav
            className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0b1524]/60"
            aria-label="Discovery sections"
          >
            <ul className="flex h-full flex-col divide-y divide-white/[0.06]">
              {DISCOVERY_SECTIONS.map((section) => {
                const state = stored[section.id];
                const touched = Boolean(
                  state?.completed ||
                    Object.values(state?.responses ?? {}).some((value) => value.trim()),
                );
                const selected = selectedId === section.id;
                const Icon = section.iconComponent;

                return (
                  <li key={section.id} className="flex min-h-0 flex-1">
                    <button
                      type="button"
                      onClick={() => selectSection(section)}
                      className={cn(
                        "flex w-full flex-1 items-center gap-2 px-2.5 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-inset",
                        selected
                          ? "bg-sky-500/12 text-white"
                          : "text-white/80 hover:bg-white/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                          touched
                            ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                            : selected
                              ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                              : "border-white/10 bg-white/[0.03] text-white/50",
                        )}
                      >
                        {touched ? (
                          <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                        ) : (
                          <Icon className="h-2.5 w-2.5" strokeWidth={1.75} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 text-[9px] font-semibold uppercase leading-snug tracking-[0.04em]">
                        {section.title}
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-3 w-3 shrink-0",
                          selected ? "text-sky-300/80" : "text-white/25",
                        )}
                        strokeWidth={2}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-2 shrink-0 rounded-lg border border-white/[0.08] bg-[#0b1524]/50 px-2.5 py-2">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-3 w-3 shrink-0 text-sky-400/60" strokeWidth={1.75} />
              <div>
                <p className="text-[10px] font-medium text-white/70">Your responses are secure</p>
                <p className="mt-0.5 text-[9px] leading-snug text-white/40">
                  Your information is encrypted and kept confidential.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: questionnaire shell (header + panel) */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pt-2">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-sky-400/15 bg-[#0b1524]/80 shadow-[0_0_0_1px_rgba(47,128,237,0.08)]">
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-5 sm:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
                  SAEC Discovery
                </p>
                <h1 className="mt-1.5 text-[1.45rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.62rem]">
                  Current Systems Discovery
                </h1>
                <p className="mt-2 text-[13px] leading-snug text-white/55">
                  Help understand SAECs systems. All questions are{" "}
                  <span className="font-semibold text-sky-300">OPTIONAL</span>.
                </p>
                {(submitSuccessMessage || submitError) && (
                  <div className="mt-2 space-y-1">
                    {submitSuccessMessage ? (
                      <p className="text-[12px] text-emerald-200/90">{submitSuccessMessage}</p>
                    ) : null}
                    {submitError ? (
                      <p className="text-[12px] text-rose-200/90">{submitError}</p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetDraft}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/75 transition-colors hover:bg-white/[0.08]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitDiscovery()}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1F4FBF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" strokeWidth={2} />
                        Submit
                      </>
                    )}
                  </button>
                </div>
                {draftSavedLabel || serverSaving ? (
                  <p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/85">
                    {serverSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving draft…
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                        {draftSavedLabel}
                      </>
                    )}
                  </p>
                ) : null}
              </div>
            </header>

            <main
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col px-4 py-3 sm:px-5 sm:py-4",
                selectedSection?.kind === "general" || selectedSection?.kind === "reporting"
                  ? "overflow-y-auto"
                  : "overflow-hidden",
              )}
            >
              {selectedSection ? (
                <>
                  <SectionHeader section={selectedSection} />
                  <div
                    className={cn(
                      "flex min-h-0 flex-1 flex-col",
                      selectedSection.kind === "general" || selectedSection.kind === "reporting"
                        ? "min-h-0"
                        : "overflow-hidden",
                    )}
                  >
                    {selectedSection.kind === "general" ? (
                      <GeneralSectionPanel
                        section={selectedSection}
                        draft={draft}
                        updateDraft={updateDraft}
                      />
                    ) : null}
                    {selectedSection.kind === "reporting" ? (
                      <ReportingSectionPanel
                        section={selectedSection}
                        draft={draft}
                        updateDraft={updateDraft}
                      />
                    ) : null}
                    {selectedSection.kind === "software" ? (
                      <SoftwareSectionPanel
                        section={selectedSection}
                        draft={draft}
                        updateDraft={updateDraft}
                      />
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/45">Select a section from the list.</p>
              )}
            </main>
          </div>
        </div>
      </div>

      <SaveToast message={saveNotice} />
    </div>
  );
}
