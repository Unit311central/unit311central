"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FilePenLine, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";

import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_SECTIONS,
  readSectionAnswer,
  sectionIncludesComments,
} from "@/lib/saec-discovery/config";
import type {
  SaecDiscoveryDraftRecord,
  SaecDiscoveryState,
  SaecDiscoverySubmissionRecord,
} from "@/lib/saec-discovery/types";
import { cn } from "@/lib/utils";

type Selection =
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

function setSectionAnswer(
  responses: SaecDiscoveryState,
  sectionId: string,
  key: string,
  value: string,
): SaecDiscoveryState {
  const section = responses[sectionId] ?? { completed: false, responses: {} };
  return {
    ...responses,
    [sectionId]: {
      ...section,
      responses: {
        ...section.responses,
        [key]: value,
      },
    },
  };
}

function AnswerText({ value }: { value: string }) {
  return (
    <p className={cn("text-sm whitespace-pre-wrap", value ? "text-white" : "italic text-white/35")}>
      {value || "Not provided"}
    </p>
  );
}

function SectionBlock({
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

function DiscoveryResponses({
  responses,
  editing = false,
  onChange,
}: {
  responses: SaecDiscoveryState;
  editing?: boolean;
  onChange?: (sectionId: string, key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {SAEC_DISCOVERY_SECTIONS.map((section) => (
        <SectionBlock key={section.id} title={section.title}>
          {section.kind === "general" || section.kind === "reporting" ? (
            <div className="space-y-4">
              {(section.questions ?? []).map((question) => (
                <div key={question.id}>
                  <p className="text-sm font-medium text-white/80">{question.label}</p>
                  <div className="mt-2">
                    {editing && onChange ? (
                      <textarea
                        value={readSectionAnswer(responses, section.id, question.id)}
                        onChange={(event) => onChange(section.id, question.id, event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-white/10 bg-[#070f1a] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sky-400/50"
                      />
                    ) : (
                      <AnswerText value={readSectionAnswer(responses, section.id, question.id)} />
                    )}
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
                    {editing && onChange ? (
                      <input
                        type="text"
                        value={readSectionAnswer(responses, section.id, entry.id)}
                        onChange={(event) => onChange(section.id, entry.id, event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[#070f1a] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sky-400/50"
                      />
                    ) : (
                      <AnswerText value={readSectionAnswer(responses, section.id, entry.id)} />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {sectionIncludesComments(section) ? (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-sm font-medium text-white/80">{SAEC_DISCOVERY_COMMENTS_KEY}</p>
              <div className="mt-2">
                {editing && onChange ? (
                  <textarea
                    value={readSectionAnswer(responses, section.id, SAEC_DISCOVERY_COMMENTS_KEY)}
                    onChange={(event) =>
                      onChange(section.id, SAEC_DISCOVERY_COMMENTS_KEY, event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-lg border border-white/10 bg-[#070f1a] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-sky-400/50"
                  />
                ) : (
                  <AnswerText
                    value={readSectionAnswer(responses, section.id, SAEC_DISCOVERY_COMMENTS_KEY)}
                  />
                )}
              </div>
            </div>
          ) : null}
        </SectionBlock>
      ))}
    </div>
  );
}

function ListDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">{label}</p>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function RecordButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left transition-colors",
        active
          ? "border-sky-400/35 bg-sky-500/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
      )}
    >
      {children}
    </button>
  );
}

function AdminButton({
  tone = "neutral",
  onClick,
  disabled,
  children,
}: {
  tone?: "neutral" | "danger" | "primary";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        tone === "danger" &&
          "border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15",
        tone === "primary" &&
          "border-sky-400/35 bg-sky-500/10 text-sky-100 hover:bg-sky-500/15",
        tone === "neutral" &&
          "border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]",
      )}
    >
      {children}
    </button>
  );
}

export default function SaecFeedbackWorkspace() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [drafts, setDrafts] = useState<SaecDiscoveryDraftRecord[]>([]);
  const [submissions, setSubmissions] = useState<SaecDiscoverySubmissionRecord[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const [editResponses, setEditResponses] = useState<SaecDiscoveryState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFeedback = useCallback(async (opts?: { soft?: boolean }) => {
    if (opts?.soft) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch(`/api/internal/saec-discovery/feedback?_=${Date.now()}`, {
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
      setLastRefreshedAt(new Date());
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    const onFocus = () => {
      void loadFeedback({ soft: true });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadFeedback]);

  useEffect(() => {
    setEditingSubmissionId(null);
    setEditResponses(null);
  }, [selection?.id, selection?.kind]);

  const selectedDraft = useMemo(
    () =>
      selection?.kind === "draft"
        ? (drafts.find((draft) => draft.id === selection.id) ?? null)
        : null,
    [drafts, selection],
  );

  const selectedSubmission = useMemo(
    () =>
      selection?.kind === "submission"
        ? (submissions.find((submission) => submission.id === selection.id) ?? null)
        : null,
    [selection, submissions],
  );

  const summaryLabel = useMemo(() => {
    const parts: string[] = [];
    if (drafts.length > 0) {
      parts.push(`${drafts.length} draft${drafts.length === 1 ? "" : "s"}`);
    }
    if (submissions.length > 0) {
      parts.push(`${submissions.length} submission${submissions.length === 1 ? "" : "s"}`);
    }
    return parts.length > 0 ? parts.join(" · ") : "No draft or submission yet";
  }, [drafts.length, submissions.length]);

  const showActionMessage = useCallback((message: string) => {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(null), 2600);
  }, []);

  const deleteDraft = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "Remove this server-side draft? The questionnaire user can still recreate a draft by typing again.",
        )
      ) {
        return;
      }
      setDeletingId(id);
      try {
        const response = await fetch(`/api/internal/saec-discovery/drafts/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to delete draft.");
        }
        showActionMessage("Draft removed.");
        await loadFeedback({ soft: true });
      } catch (deleteError) {
        showActionMessage(
          deleteError instanceof Error ? deleteError.message : "Unable to delete draft.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [loadFeedback, showActionMessage],
  );

  const deleteSubmission = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "Permanently delete this SAEC Discovery submission? This cannot be undone.",
        )
      ) {
        return;
      }
      setDeletingId(id);
      try {
        const response = await fetch(
          `/api/internal/saec-discovery/submissions/${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to delete submission.");
        }
        showActionMessage("Submission deleted.");
        await loadFeedback({ soft: true });
      } catch (deleteError) {
        showActionMessage(
          deleteError instanceof Error ? deleteError.message : "Unable to delete submission.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [loadFeedback, showActionMessage],
  );

  const startEditingSubmission = useCallback((submission: SaecDiscoverySubmissionRecord) => {
    setEditingSubmissionId(submission.id);
    setEditResponses(structuredClone(submission.responses));
  }, []);

  const cancelEditingSubmission = useCallback(() => {
    setEditingSubmissionId(null);
    setEditResponses(null);
  }, []);

  const saveEditedSubmission = useCallback(async () => {
    if (!selectedSubmission || !editResponses || editingSubmissionId !== selectedSubmission.id) {
      return;
    }
    setSavingEdit(true);
    try {
      const response = await fetch(
        `/api/internal/saec-discovery/submissions/${encodeURIComponent(selectedSubmission.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ responses: editResponses }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save submission changes.");
      }
      showActionMessage("Submission updated.");
      setEditingSubmissionId(null);
      setEditResponses(null);
      await loadFeedback({ soft: true });
    } catch (saveError) {
      showActionMessage(saveError instanceof Error ? saveError.message : "Unable to save changes.");
    } finally {
      setSavingEdit(false);
    }
  }, [editResponses, editingSubmissionId, loadFeedback, selectedSubmission, showActionMessage]);

  const handleEditChange = useCallback((sectionId: string, key: string, value: string) => {
    setEditResponses((current) => (current ? setSectionAnswer(current, sectionId, key, value) : current));
  }, []);

  const isEditingSelected =
    Boolean(selectedSubmission && editingSubmissionId === selectedSubmission.id && editResponses);

  return (
    <div className="space-y-5 pb-8">
      <header className="rounded-2xl border border-white/12 bg-white/[0.035] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
              SAEC Feedback
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">SAEC</h1>
            <p className="mt-1 text-sm text-white/55">Current Systems — Discovery Response</p>
          </div>
          <AdminButton tone="neutral" onClick={() => void loadFeedback({ soft: true })} disabled={refreshing}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </AdminButton>
        </div>

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
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-white/85">
                {summaryLabel}
              </span>
              {submissions.length > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Latest submission {formatWhen(submissions[0]?.submittedAt)}
                </span>
              ) : null}
            </div>
            {lastRefreshedAt ? (
              <p className="text-xs text-white/40">
                Last refreshed {lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : null}
            {actionMessage ? (
              <p className="text-sm text-sky-200/90">{actionMessage}</p>
            ) : null}
          </div>
        )}
      </header>

      {!loading && !error ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="space-y-3">
              <ListDivider label="Drafts" />
              {drafts.length === 0 ? (
                <p className="text-sm text-white/45">No active draft saved on the server.</p>
              ) : (
                drafts.map((draft) => {
                  const active = selection?.kind === "draft" && selection.id === draft.id;
                  return (
                    <div key={draft.id} className="space-y-2">
                      <RecordButton
                        active={active}
                        onClick={() => setSelection({ kind: "draft", id: draft.id })}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-200/90">
                              Draft
                            </p>
                            <p className="mt-1 text-sm text-white/75">
                              <span className="text-white/45">Last saved:</span>{" "}
                              {formatWhen(draft.lastSavedAt)}
                            </p>
                            <p className="mt-1 text-sm text-white/75">
                              <span className="text-white/45">Status:</span> Draft
                            </p>
                            {draft.ownerEmail ? (
                              <p className="mt-1 text-sm text-white/60">
                                <span className="text-white/45">Owner:</span> {draft.ownerEmail}
                              </p>
                            ) : null}
                          </div>
                          <FilePenLine className="h-4 w-4 shrink-0 text-amber-200/70" />
                        </div>
                        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-200/80">
                          {active ? "Viewing draft" : "View draft"}
                        </p>
                      </RecordButton>
                      <div className="flex justify-end">
                        <AdminButton
                          tone="danger"
                          disabled={deletingId === draft.id}
                          onClick={() => void deleteDraft(draft.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </AdminButton>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-3">
              <ListDivider label="Submissions" />
              {submissions.length === 0 ? (
                <p className="text-sm text-white/45">No submissions recorded yet.</p>
              ) : (
                submissions.map((submission, index) => {
                  const active =
                    selection?.kind === "submission" && selection.id === submission.id;
                  const number = submissions.length - index;
                  return (
                    <div key={submission.id} className="space-y-2">
                      <RecordButton
                        active={active}
                        onClick={() => setSelection({ kind: "submission", id: submission.id })}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-200/80">
                          Submission {number}
                          {index === 0 ? " (Latest)" : ""}
                        </p>
                        <div className="mt-2 space-y-1 text-sm text-white/75">
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
                      </RecordButton>
                      <div className="flex justify-end gap-2">
                        <AdminButton
                          tone="neutral"
                          onClick={() => {
                            setSelection({ kind: "submission", id: submission.id });
                            startEditingSubmission(submission);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </AdminButton>
                        <AdminButton
                          tone="danger"
                          disabled={deletingId === submission.id}
                          onClick={() => void deleteSubmission(submission.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </AdminButton>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            {selectedDraft ? (
              <>
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-100/90">
                        Draft — working questionnaire state
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
                        <span>
                          <span className="text-white/45">Last saved:</span>{" "}
                          {formatWhen(selectedDraft.lastSavedAt)}
                        </span>
                        <span>
                          <span className="text-white/45">ID:</span> {selectedDraft.id}
                        </span>
                        {selectedDraft.ownerEmail ? (
                          <span>
                            <span className="text-white/45">Owner:</span> {selectedDraft.ownerEmail}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <AdminButton
                      tone="danger"
                      disabled={deletingId === selectedDraft.id}
                      onClick={() => void deleteDraft(selectedDraft.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </AdminButton>
                  </div>
                </div>
                <DiscoveryResponses responses={selectedDraft.responses} />
              </>
            ) : null}

            {selectedSubmission ? (
              <>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-200/80">
                        Submission
                        {submissions[0]?.id === selectedSubmission.id ? " (Latest)" : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
                        <span>
                          <span className="text-white/45">Submitted:</span>{" "}
                          {formatWhen(selectedSubmission.submittedAt)}
                        </span>
                        <span>
                          <span className="text-white/45">ID:</span> {selectedSubmission.id}
                        </span>
                        {selectedSubmission.submittedByEmail ? (
                          <span>
                            <span className="text-white/45">By:</span>{" "}
                            {selectedSubmission.submittedByEmail}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isEditingSelected ? (
                        <>
                          <AdminButton tone="primary" disabled={savingEdit} onClick={() => void saveEditedSubmission()}>
                            {savingEdit ? "Saving…" : "Save"}
                          </AdminButton>
                          <AdminButton tone="neutral" disabled={savingEdit} onClick={cancelEditingSubmission}>
                            Cancel
                          </AdminButton>
                        </>
                      ) : (
                        <>
                          <AdminButton tone="neutral" onClick={() => startEditingSubmission(selectedSubmission)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </AdminButton>
                          <AdminButton
                            tone="danger"
                            disabled={deletingId === selectedSubmission.id}
                            onClick={() => void deleteSubmission(selectedSubmission.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </AdminButton>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <DiscoveryResponses
                  responses={isEditingSelected && editResponses ? editResponses : selectedSubmission.responses}
                  editing={Boolean(isEditingSelected && editResponses)}
                  onChange={handleEditChange}
                />
              </>
            ) : null}

            {!selectedDraft && !selectedSubmission ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/45">
                No draft or submission to display yet.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
