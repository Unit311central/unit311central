"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  SAEC_DISCOVERY_MODULES,
  readModuleSoftwareAnswer,
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
            No SAEC Discovery submission has been recorded yet.
          </p>
        )}
      </header>

      {!loading && !error && submission ? (
        <div className="space-y-4">
          {SAEC_DISCOVERY_MODULES.map((module) => (
            <Section key={module.id} title={module.title}>
              <div className="hidden gap-6 border-b border-white/10 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 md:grid md:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
                <span>Function</span>
                <span>Software</span>
              </div>
              <div className="mt-3 divide-y divide-white/[0.06]">
                {module.functions.map((functionName) => {
                  const answer = readModuleSoftwareAnswer(
                    submission.responses,
                    module.id,
                    functionName,
                  );
                  return (
                    <div
                      key={functionName}
                      className="grid gap-2 py-3 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start md:gap-6"
                    >
                      <p className="text-sm text-white/80">{functionName}</p>
                      <p
                        className={cn(
                          "text-sm",
                          answer ? "text-white" : "italic text-white/35",
                        )}
                      >
                        {answer || "Not provided"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
