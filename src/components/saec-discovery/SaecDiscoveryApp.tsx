"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  Save,
  Send,
  Settings2,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import SaecDiscoveryLogo from "@/components/saec-discovery/SaecDiscoveryLogo";
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
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={inputId} className="block text-[13px] leading-snug text-white/85">
        {question.label}
      </label>
      {question.note && !question.examples?.length ? (
        <p className="text-[10px] leading-snug text-white/40">{question.note}</p>
      ) : null}
      {question.examples?.length ? (
        <div className="space-y-1 pt-0.5">
          {question.note ? (
            <p className="text-[9px] leading-snug text-white/35">{question.note}</p>
          ) : null}
          <ul className="grid list-none gap-x-4 gap-y-0.5 text-[9px] leading-snug text-white/35 sm:grid-cols-2">
            {question.examples.map((example) => (
              <li key={example} className="flex gap-1.5">
                <span className="text-sky-400/70">•</span>
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
      <div
        className={cn(
          "grid min-h-0 gap-x-4 gap-y-2",
          emphasize
            ? "min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,38%)_minmax(0,1fr)] lg:items-stretch"
            : "grid-cols-1 lg:grid-cols-[minmax(0,38%)_minmax(0,1fr)] lg:items-start",
        )}
      >
        <div className="flex min-w-0 gap-2.5">
          {questionNumber > 0 ? <QuestionNumber n={questionNumber} /> : null}
          {labelBlock}
        </div>
        <OptionalTextarea
          id={inputId}
          value={value}
          onChange={onChange}
          rows={emphasize ? 7 : answerRows}
          className={emphasize ? "min-h-[8rem] lg:min-h-0 lg:flex-1" : undefined}
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

function SectionHeader({
  section,
  onSave,
}: {
  section: SectionDef;
  onSave: () => void;
}) {
  const Icon = section.iconComponent;
  return (
    <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-sky-400/25 bg-sky-500/10 text-sky-200">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-white sm:text-base">
          {section.title}
        </h2>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/85 transition-colors hover:bg-white/[0.08]"
      >
        <Save className="h-3 w-3" strokeWidth={2} />
        Save
      </button>
    </div>
  );
}

function CommentsBlock({
  sectionId,
  value,
  onChange,
  rows = 3,
}: {
  sectionId: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="shrink-0 pt-2">
      <label
        htmlFor={`${sectionId}-comments`}
        className="mb-1.5 block text-[13px] font-medium text-white/85"
      >
        Any other comments
      </label>
      <OptionalTextarea
        id={`${sectionId}-comments`}
        value={value}
        onChange={onChange}
        rows={rows}
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {section.intro ? (
        <p className="mb-3 shrink-0 text-[12px] leading-snug text-white/55">{section.intro}</p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        {regular.map((question, index) => (
          <QuestionBlock
            key={question.id}
            sectionId={section.id}
            question={question}
            index={index + 1}
            layout="row"
            answerRows={2}
            value={draft[question.id] ?? ""}
            onChange={(value) => updateDraft(question.id, value)}
          />
        ))}
        {emphasized ? (
          <div className="min-h-0 flex-1 pt-1">
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
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 lg:grid-cols-2 lg:grid-rows-3 lg:gap-x-4 lg:gap-y-2">
        {questions.map((question, index) => (
          <QuestionBlock
            key={question.id}
            sectionId={section.id}
            question={question}
            index={index + 1}
            layout="stacked"
            answerRows={2}
            value={draft[question.id] ?? ""}
            onChange={(value) => updateDraft(question.id, value)}
          />
        ))}
      </div>
      <CommentsBlock
        sectionId={section.id}
        value={draft[SAEC_DISCOVERY_COMMENTS_KEY] ?? ""}
        onChange={(value) => updateDraft(SAEC_DISCOVERY_COMMENTS_KEY, value)}
        rows={2}
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
  const compact = functions.length >= 5;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="grid shrink-0 gap-3 border-b border-white/10 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <span>Function</span>
        <span>Software</span>
      </div>
      <div className={cn("min-h-0 flex-1", compact ? "space-y-1" : "space-y-1.5")}>
        {functions.map((functionName) => (
          <div
            key={functionName}
            className="grid gap-1 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-center md:gap-4"
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
              className={cn(
                "w-full rounded-md border border-white/10 bg-[#070f1a] px-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sky-400/50",
                compact ? "py-1" : "py-1.5",
              )}
            />
          </div>
        ))}
      </div>
      <CommentsBlock
        sectionId={section.id}
        value={draft[SAEC_DISCOVERY_COMMENTS_KEY] ?? ""}
        onChange={(value) => updateDraft(SAEC_DISCOVERY_COMMENTS_KEY, value)}
        rows={compact ? 2 : 3}
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
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [draftSavedLabel, setDraftSavedLabel] = useState<string | null>(null);

  const showNotice = useCallback((message: string) => {
    setSaveNotice(message);
    window.setTimeout(() => setSaveNotice(null), 2200);
  }, []);

  const markDraftSaved = useCallback(() => {
    const now = Date.now();
    setDraftSavedAt(now);
    setDraftSavedLabel(formatDraftSavedAgo(now));
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
    markDraftSaved();
    showNotice("Section saved");
  }, [flushDraftToStored, markDraftSaved, selectedSection, showNotice]);

  const saveDraft = useCallback(() => {
    let next = { ...stored };
    if (selectedSection) {
      next = flushDraftToStored(selectedSection, stored[selectedSection.id]?.completed ?? false);
    }
    persistState(next);
    markDraftSaved();
    showNotice("Draft saved");
  }, [flushDraftToStored, markDraftSaved, selectedSection, showNotice, stored]);

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

      <div className="relative flex min-h-0 flex-1 gap-3 px-4 py-3 sm:px-5 lg:gap-4 lg:px-6">
        {/* Left column: logo, navigation, secure panel */}
        <aside className="flex w-[210px] shrink-0 flex-col lg:w-[228px]">
          <div className="mb-3 shrink-0 pt-1">
            <SaecDiscoveryLogo height={34} maxWidth={140} priority />
          </div>

          <nav
            className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0b1524]/60"
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
                        "flex w-full items-center gap-2 px-2 py-[0.42rem] text-left transition-colors",
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
                      <span className="min-w-0 flex-1 text-[8.5px] font-semibold uppercase leading-snug tracking-[0.04em]">
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

        {/* Right column: header + questionnaire panel */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="mb-3 flex shrink-0 items-start justify-between gap-4">
            <div className="min-w-0 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
                SAEC Discovery
              </p>
              <h1 className="mt-1 text-[1.45rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.62rem]">
                Current Systems Discovery
              </h1>
              <p className="mt-1 text-[13px] text-white/55">
                Help understand SAECs systems. All questions are{" "}
                <span className="font-semibold text-sky-300">OPTIONAL</span>.
              </p>
              {(submittedAt || submitSuccessMessage || submitError) && (
                <div className="mt-2 space-y-1">
                  {submittedAt ? (
                    <p className="text-[11px] text-sky-200/75">
                      Previously submitted on {formatSubmittedAt(submittedAt)}.
                    </p>
                  ) : null}
                  {submitSuccessMessage ? (
                    <p className="text-[12px] text-emerald-200/90">{submitSuccessMessage}</p>
                  ) : null}
                  {submitError ? (
                    <p className="text-[12px] text-rose-200/90">{submitError}</p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveDraft}
                  className="inline-flex items-center gap-2 rounded-lg border border-sky-400/35 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/90 transition-colors hover:bg-sky-500/15"
                >
                  <Save className="h-3.5 w-3.5" strokeWidth={2} />
                  Save Draft
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
              {draftSavedLabel ? (
                <p className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/85">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                  {draftSavedLabel}
                </p>
              ) : null}
            </div>
          </header>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-sky-400/15 bg-[#0b1524]/80 p-4 shadow-[0_0_0_1px_rgba(47,128,237,0.08)] sm:p-5">
            {selectedSection ? (
              <>
                <SectionHeader section={selectedSection} onSave={saveSection} />
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
