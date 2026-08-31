"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileEdit, Loader2 } from "lucide-react";

import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_SECTIONS,
  readSectionAnswer,
  sectionIncludesComments,
} from "@/lib/saec-discovery/config";
import type {
  SaecDiscoveryDraftRecord,
  SaecDiscoverySubmissionRecord,
} from "@/lib/saec-discovery/types";
import { cn } from "@/lib/utils";

type FeedbackSelection =
  | { kind: "draft"; id: string }
  | { kind: "submission"; id: string };

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function AnswerText({ value }: { value: string }) {
  return (
    <p className={cn("text-sm whitespace-pre-wrap", value ? "text-white" : "italic text-white/35")}>
      {value || "Not provided"}
    </p>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.035] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-sky-200/90">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ResponseBody({ responses }: { responses: SaecDiscoverySubmissionRecord["responses"] }) {
  return (
    <div className="space-y-4">
      {SAEC_DISCOVERY_SECTIONS.map((section) => (
        <Section key={section.id} title={section.title}>
          {section.kind === "general" || section.kind === "reporting" ? (
            <div className="space-y-4">
              {(section.questions ?? []).map((question) => (
                <div key={question.id}>
                  <p className="text-sm font-medium text-white/80">{question.label}</p>
                  <div className="mt-2">
                    <AnswerText value={readSectionAnswer(responses, section.id, question.id)} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="hidden gap-6 border-b border-white/10 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 md:grid md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                <span>Function</span>
                <span>Software</span>
              </div>
              <div className="mt-3 divide-y divide-white/[0.06]">
                {(section.functions ?? []).map((entry) => (
                  <div
                    key={entry.id}
                    className="grid gap-2 py-3 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start md:gap-6"
                  >
                    <p className="text-sm text-white/80">{entry.label}</p>
                    <AnswerText value={readSectionAnswer(responses, section.id, entry.id)} />
                  </div>
                ))}
              </div>
            </>
          )}

          {sectionIncludesComments(section) ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-white/80">{SAEC_DISCOVERY_COMMENTS_KEY}</p>
              <div className="mt-2">
                <AnswerText
                  value={readSectionAnswer(responses, section.id, SAEC_DISCOVERY_COMMENTS_KEY)}
                />
              </div>
            </div>
          ) : null}
        </Section>
      ))}
    </div>
  );
}

function ListButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
        selected
          ? "border-sky-400/35 bg-sky-500/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
      )}
    >
      {children}
    </button>
  );
}

export default function SaecFeedbackWorkspace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<SaecDiscoveryDraftRecord[]>([]);
  const [submissions, setSubmissions] = useState<SaecDiscoverySubmissionRecord[]>([]);
  const [selection, setSelection] = useState<FeedbackSelection | null>(null);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/saec-discovery/feedback", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        drafts?: SaecDiscoveryDraftRecord[];
        submissions?: SaecDiscoverySubmissionRecord[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load SAEC Feedback.");
      }
      const nextDrafts = payload.drafts ?? [];
      const nextSubmissions = payload.submissions ?? [];
      setDrafts(nextDrafts);
      setSubmissions(nextSubmissions);
      setSelection((current) => {
        if (current) {
          if (current.kind === "draft" && nextDrafts.some((draft) => draft.id === current.id)) {
            return current;
          }
          if (
            current.kind === "submission" &&
            nextSubmissions.some((submission) => submission.id === current.id)
          ) {
            return current;
          }
        }
        if (nextSubmissions[0]) {
          return { kind: "submission", id: nextSubmissions[0].id };
        }
        if (nextDrafts[0]) {
          return { kind: "draft", id: nextDrafts[0].id };
        }
        return null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load SAEC Feedback.");
      setDrafts([]);
      setSubmissions([]);
      setSelection(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const selectedDraft = useMemo(
    () => (selection?.kind === "draft" ? drafts.find((draft) => draft.id === selection.id) ?? null : null),
    [drafts, selection],
  );

  const selectedSubmission = useMemo(
    () =>
      selection?.kind === "submission"
        ? submissions.find((submission) => submission.id === selection.id) ?? null
        : null,
    [selection, submissions],
  );

  const summaryLabel = useMemo(() => {
    if (selectedSubmission) {
      const index = submissions.findIndex((entry) => entry.id === selectedSubmission.id);
      const number = submissions.length - index;
      return `Submission ${number}${index === 0 ? " (Latest)" : ""}`;
    }
    if (selectedDraft) {
      return "Draft";
    }
    return null;
  }, [selectedDraft, selectedSubmission, submissions]);

  return (
    <div className="space-y-5 pb-8">
      <header className="rounded-2xl border border-white/12 bg-white/[0.035] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
          SAEC Feedback
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">SAEC</h1>
        <p className="mt-1 text-sm text-white/55">Current Systems — Discovery Response</p>

        {loading ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading SAEC Feedback…
          </div>
        ) : error ? (
          <p className="mt-5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {drafts.length > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-amber-100">
                <FileEdit className="h-3.5 w-3.5" />
                {drafts.length} draft{drafts.length === 1 ? "" : "s"}
              </span>
            ) : null}
            {submissions.length > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {submissions.length} submission{submissions.length === 1 ? "" : "s"}
              </span>
            ) : null}
            {!drafts.length && !submissions.length ? (
              <p className="text-sm text-white/50">
                No SAEC Discovery drafts or submissions have been recorded yet.
              </p>
            ) : null}
          </div>
        )}
      </header>

      {!loading && !error && (drafts.length > 0 || submissions.length > 0) ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-6">
            {drafts.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                  Drafts
                </h2>
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  {drafts.map((draft) => (
                    <ListButton
                      key={draft.id}
                      selected={selection?.kind === "draft" && selection.id === draft.id}
                      onClick={() => setSelection({ kind: "draft", id: draft.id })}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-200/90">
                        Draft
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-white/70">
                        <p>
                          <span className="text-white/45">Last saved:</span>{" "}
                          {formatWhen(draft.lastSavedAt)}
                        </p>
                        <p>
                          <span className="text-white/45">Status:</span> Draft
                        </p>
                        {draft.ownerEmail ? (
                          <p>
                            <span className="text-white/45">Owner:</span> {draft.ownerEmail}
                          </p>
                        ) : null}
                      </div>
                    </ListButton>
                  ))}
                </div>
              </section>
            ) : null}

            {submissions.length > 0 ? (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                  Submissions
                </h2>
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                  {submissions.map((submission, index) => (
                    <ListButton
                      key={submission.id}
                      selected={
                        selection?.kind === "submission" && selection.id === submission.id
                      }
                      onClick={() => setSelection({ kind: "submission", id: submission.id })}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-200/80">
                        Submission {submissions.length - index}
                        {index === 0 ? " (Latest)" : ""}
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-white/70">
                        <p>
                          <span className="text-white/45">Submitted:</span>{" "}
                          {formatWhen(submission.submittedAt)}
                        </p>
                        <p>
                          <span className="text-white/45">ID:</span> {submission.id}
                        </p>
                        {submission.submittedByEmail ? (
                          <p>
                            <span className="text-white/45">By:</span> {submission.submittedByEmail}
                          </p>
                        ) : null}
                      </div>
                    </ListButton>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="min-w-0 space-y-4">
            {summaryLabel ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-200/80">
                  {summaryLabel}
                </p>
                {selectedDraft ? (
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
                    <span>
                      <span className="text-white/45">Last saved:</span>{" "}
                      {formatWhen(selectedDraft.lastSavedAt)}
                    </span>
                    <span>
                      <span className="text-white/45">Status:</span> Draft
                    </span>
                    <span>
                      <span className="text-white/45">ID:</span> {selectedDraft.id}
                    </span>
                  </div>
                ) : null}
                {selectedSubmission ? (
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/70">
                    <span>
                      <span className="text-white/45">Submitted:</span>{" "}
                      {formatWhen(selectedSubmission.submittedAt)}
                    </span>
                    <span>
                      <span className="text-white/45">ID:</span> {selectedSubmission.id}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {selectedDraft ? <ResponseBody responses={selectedDraft.responses} /> : null}
            {selectedSubmission ? <ResponseBody responses={selectedSubmission.responses} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
