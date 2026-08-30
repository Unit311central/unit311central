"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  Briefcase,
  Calculator,
  Check,
  FileText,
  FolderKanban,
  GraduationCap,
  Headphones,
  HardHat,
  Layers,
  Loader2,
  Lock,
  Megaphone,
  MessageSquare,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import SaecLogoMark from "@/components/layout/SaecLogoMark";
import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER,
  SAEC_DISCOVERY_SECTIONS,
  SAEC_DISCOVERY_STORAGE_KEY,
  buildDiscoverySubmissionSnapshot,
  emptySectionResponses,
  responseKeysForSection,
  type SaecDiscoveryIconKey,
  type SaecDiscoveryQuestionConfig,
  type SaecDiscoverySectionConfig,
} from "@/lib/saec-discovery/config";
import type { SaecDiscoveryState } from "@/lib/saec-discovery/types";
import { cn } from "@/lib/utils";

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
    <textarea
      id={id}
      value={value}
      rows={rows}
      placeholder={SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "w-full resize-none rounded-lg border border-white/10 bg-[#070f1a] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sky-400/50",
        className,
      )}
    />
  );
}

function QuestionBlock({
  sectionId,
  question,
  value,
  onChange,
}: {
  sectionId: string;
  question: SaecDiscoveryQuestionConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = `${sectionId}-${question.id}`;
  const emphasize = question.emphasizeAnswer === true;

  return (
    <div className={cn("min-h-0", emphasize ? "flex min-h-0 flex-1 flex-col" : "space-y-1")}>
      <label htmlFor={inputId} className="block text-[13px] leading-snug text-white/85">
        {question.label}
      </label>
      {question.note && !question.examples?.length ? (
        <p className="text-[11px] leading-snug text-white/40">{question.note}</p>
      ) : null}
      {question.examples?.length ? (
        <div className={cn("space-y-0.5", emphasize ? "shrink-0" : "")}>
          {question.note ? (
            <p className="text-[10px] leading-snug text-white/35">{question.note}</p>
          ) : null}
          <ul className="list-inside list-disc space-y-0.5 text-[10px] leading-snug text-white/35">
            {question.examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <OptionalTextarea
        id={inputId}
        value={value}
        onChange={onChange}
        rows={emphasize ? 5 : 2}
        className={emphasize ? "min-h-0 flex-1" : undefined}
      />
    </div>
  );
}

function CommentsBlock({
  sectionId,
  value,
  onChange,
  compact = false,
}: {
  sectionId: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-h-0", compact ? "shrink-0 pt-2" : "pt-3")}>
      <label
        htmlFor={`${sectionId}-comments`}
        className="mb-1 block text-[13px] font-medium text-white/85"
      >
        Any other comments
      </label>
      <OptionalTextarea
        id={`${sectionId}-comments`}
        value={value}
        onChange={onChange}
        rows={compact ? 2 : 4}
      />
    </div>
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
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {section.intro ? (
        <p className="shrink-0 text-[12px] leading-snug text-white/55">{section.intro}</p>
      ) : null}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-4 lg:gap-y-2">
        {regular.map((question) => (
          <QuestionBlock
            key={question.id}
            sectionId={section.id}
            question={question}
            value={draft[question.id] ?? ""}
            onChange={(value) => updateDraft(question.id, value)}
          />
        ))}
      </div>
      {emphasized ? (
        <QuestionBlock
          sectionId={section.id}
          question={emphasized}
          value={draft[emphasized.id] ?? ""}
          onChange={(value) => updateDraft(emphasized.id, value)}
        />
      ) : null}
      {section.footer ? (
        <p className="shrink-0 text-[11px] leading-snug text-white/45">{section.footer}</p>
      ) : null}
    </div>
  );
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
  const questions = section.questions ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {section.intro ? (
        <p className="shrink-0 whitespace-pre-line text-[12px] leading-snug text-white/55">
          {section.intro}
        </p>
      ) : null}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-4 lg:gap-y-2">
        {questions.map((question) => (
          <div key={question.id} className="min-h-0 space-y-1">
            <QuestionBlock
              sectionId={section.id}
              question={question}
              value={draft[question.id] ?? ""}
              onChange={(value) => updateDraft(question.id, value)}
            />
          </div>
        ))}
      </div>
      <CommentsBlock
        sectionId={section.id}
        value={draft[SAEC_DISCOVERY_COMMENTS_KEY] ?? ""}
        onChange={(value) => updateDraft(SAEC_DISCOVERY_COMMENTS_KEY, value)}
        compact
      />
    </div>
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
  const functions = section.functions ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="hidden shrink-0 gap-4 border-b border-white/10 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 md:grid md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <span>Function</span>
        <span>Software / system (optional)</span>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden">
        {functions.map((functionName) => (
          <div
            key={functionName}
            className="grid gap-1 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:items-center md:gap-4"
          >
            <label
              htmlFor={`${section.id}-${functionName}`}
              className="text-[13px] text-white/80"
            >
              {functionName}
            </label>
            <input
              id={`${section.id}-${functionName}`}
              type="text"
              value={draft[functionName] ?? ""}
              placeholder={SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER}
              onChange={(event) => updateDraft(functionName, event.target.value)}
              className="w-full rounded-md border border-white/10 bg-[#070f1a] px-2.5 py-1.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sky-400/50"
            />
          </div>
        ))}
      </div>
      <CommentsBlock
        sectionId={section.id}
        value={draft[SAEC_DISCOVERY_COMMENTS_KEY] ?? ""}
        onChange={(value) => updateDraft(SAEC_DISCOVERY_COMMENTS_KEY, value)}
        compact
      />
    </div>
  );
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
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const showNotice = useCallback((message: string) => {
    setSaveNotice(message);
    window.setTimeout(() => setSaveNotice(null), 2200);
  }, []);

  useEffect(() => {
    const loaded = loadState();
    setStored(loaded);
    const first = DISCOVERY_SECTIONS[0];
    if (first) {
      setSelectedId(first.id);
      setDraft(draftFromSection(first, loaded[first.id]));
    }
    setHydrated(true);
  }, []);

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
      persistState(next);
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

  const saveSection = useCallback(() => {
    if (!selectedSection) return;
    flushDraftToStored(selectedSection, true);
    showNotice("Section saved");
  }, [flushDraftToStored, selectedSection, showNotice]);

  const saveDraft = useCallback(() => {
    let next = { ...stored };
    if (selectedSection) {
      next = flushDraftToStored(selectedSection, stored[selectedSection.id]?.completed ?? false);
    }
    persistState(next);
    showNotice("Draft saved");
  }, [flushDraftToStored, selectedSection, showNotice, stored]);

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
      persistState(snapshot);
      setStored(snapshot);
      setSubmitSuccessMessage(
        alreadySubmitted ? "Questionnaire updated successfully." : "Questionnaire submitted successfully.",
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit SAEC Discovery.");
    } finally {
      setSubmitting(false);
    }
  }, [flushDraftToStored, selectedSection, stored, submittedAt, submitting]);

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

      <div className="relative flex min-h-0 flex-1 flex-col px-4 py-3 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <SaecLogoMark height={36} maxWidth={160} priority className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
                SAEC Discovery
              </p>
              <h1 className="mt-1 text-[1.55rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.7rem]">
                Current Systems Discovery
              </h1>
              <p className="mt-1 text-[13px] text-white/55">
                Help understand SAEC&apos;s systems. All questions are OPTIONAL.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start">
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/85 transition-colors hover:bg-white/[0.08]"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => void submitDiscovery()}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-[#1F4FBF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </header>

        {(submittedAt || submitSuccessMessage || submitError) && (
          <div className="mb-2 shrink-0 space-y-1">
            {submittedAt ? (
              <p className="text-[12px] text-sky-200/75">
                Previously submitted on {formatSubmittedAt(submittedAt)}.
              </p>
            ) : null}
            {submitSuccessMessage ? (
              <p className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-100">
                {submitSuccessMessage}
              </p>
            ) : null}
            {submitError ? (
              <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-100">
                {submitError}
              </p>
            ) : null}
          </div>
        )}

        <div className="flex min-h-0 flex-1 gap-3 lg:gap-4">
          {/* Left navigation + secure panel */}
          <div className="flex w-[240px] shrink-0 flex-col lg:w-[252px] xl:w-[268px]">
            <nav
              className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1524]/60"
              aria-label="Discovery sections"
            >
              <ul className="divide-y divide-white/[0.06]">
                {DISCOVERY_SECTIONS.map((section) => {
                  const state = stored[section.id];
                  const touched = Boolean(
                    state?.completed ||
                      Object.values(state?.responses ?? {}).some((value) => value.trim()),
                  );
                  const selected = selectedId === section.id;
                  const Icon = section.iconComponent;

                  return (
                    <li key={section.id}>
                      <button
                        type="button"
                        onClick={() => selectSection(section)}
                        className={cn(
                          "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-inset",
                          selected
                            ? "bg-sky-500/10 text-white"
                            : "text-white/80 hover:bg-white/[0.04]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                            touched
                              ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
                              : selected
                                ? "border-sky-400/30 bg-sky-500/10 text-sky-200"
                                : "border-white/10 bg-white/[0.03] text-white/50",
                          )}
                        >
                          {touched ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          ) : (
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-[10px] font-semibold uppercase leading-snug tracking-[0.05em]">
                          {section.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-2 shrink-0 rounded-lg border border-white/[0.08] bg-[#0b1524]/50 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" strokeWidth={1.75} />
                <div>
                  <p className="text-[11px] font-medium text-white/70">Your responses are secure</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-white/40">
                    Your information is encrypted and kept confidential.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right working panel */}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b1524]/80 p-4 sm:p-5">
            {selectedSection ? (
              <>
                <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
                  <h2 className="text-base font-semibold uppercase tracking-[0.08em] text-white sm:text-lg">
                    {selectedSection.title}
                  </h2>
                  <button
                    type="button"
                    onClick={saveSection}
                    className="shrink-0 rounded-md border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/85 transition-colors hover:bg-white/[0.08]"
                  >
                    Save
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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

      <SaveToast message={saveNotice} />
    </div>
  );
}
