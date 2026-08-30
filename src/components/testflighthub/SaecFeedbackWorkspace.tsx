"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_SECTIONS,
  readSectionAnswer,
  sectionIncludesComments,
} from "@/lib/saec-discovery/config";
import type { SaecDiscoverySubmissionRecord } from "@/lib/saec-discovery/types";
import { cn } from "@/lib/utils";

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

export default function SaecFeedbackWorkspace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<SaecDiscoverySubmissionRecord | null>(null);

  const loadSubmission = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/saec-discovery/feedback", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        submission?: SaecDiscoverySubmissionRecord | null;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load SAEC Feedback.");
      }
      setSubmission(payload.submission ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load SAEC Feedback.");
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubmission();
  }, [loadSubmission]);

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
            Loading submission…
          </div>
        ) : error ? (
          <p className="mt-5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : submission ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Submitted
            </span>
            <div className="text-sm text-white/70">
              <span className="text-white/45">Submitted:</span> {formatWhen(submission.submittedAt)}
            </div>
            <div className="text-sm text-white/70">
              <span className="text-white/45">Last updated:</span> {formatWhen(submission.updatedAt)}
            </div>
            {submission.submittedByEmail ? (
              <div className="text-sm text-white/70">
                <span className="text-white/45">Submitted by:</span> {submission.submittedByEmail}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-5 text-sm text-white/50">
            No SAEC Discovery submission has been recorded yet. Draft progress is stored locally on the
            client questionnaire only.
          </p>
        )}
      </header>

      {!loading && !error && submission ? (
        <div className="space-y-4">
          {SAEC_DISCOVERY_SECTIONS.map((section) => (
            <Section key={section.id} title={section.title}>
              {section.kind === "general" || section.kind === "reporting" ? (
                <div className="space-y-4">
                  {(section.questions ?? []).map((question) => (
                    <div key={question.id}>
                      <p className="text-sm font-medium text-white/80">{question.label}</p>
                      <div className="mt-2">
                        <AnswerText
                          value={readSectionAnswer(
                            submission.responses,
                            section.id,
                            question.id,
                          )}
                        />
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
                    {(section.functions ?? []).map((functionName) => (
                      <div
                        key={functionName}
                        className="grid gap-2 py-3 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start md:gap-6"
                      >
                        <p className="text-sm text-white/80">{functionName}</p>
                        <AnswerText
                          value={readSectionAnswer(
                            submission.responses,
                            section.id,
                            functionName,
                          )}
                        />
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
                      value={readSectionAnswer(
                        submission.responses,
                        section.id,
                        SAEC_DISCOVERY_COMMENTS_KEY,
                      )}
                    />
                  </div>
                </div>
              ) : null}
            </Section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
