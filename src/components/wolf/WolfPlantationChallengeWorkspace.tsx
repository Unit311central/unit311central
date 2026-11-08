"use client";

import { useCallback, useEffect, useState } from "react";

import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import {
  PLANTATION_METRICS,
  formatPlantationHectares,
  formatPlantationSubmittedAt,
  formatPlantationTrees,
  rankPlantationSubmissions,
  type PlantationMetricKey,
  type PlantationSubmissionRecord,
} from "@/lib/plantation/plantation-challenge";
import type { WolfPlantationChallengeView } from "@/lib/wolf/plantation-challenge-views";

type LoadState = {
  submissions: PlantationSubmissionRecord[];
  loading: boolean;
  error: string | null;
};

function usePlantationResponses(): LoadState & { reload: () => void } {
  const [submissions, setSubmissions] = useState<PlantationSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const response = await fetch("/api/wolf/plantation", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { submissions?: PlantationSubmissionRecord[]; error?: string }
        | null;
      if (!response.ok) {
        if (!background) setError(payload?.error || "Plantation challenge responses could not be loaded.");
        return;
      }
      setSubmissions(payload?.submissions ?? []);
      setError(null);
    } catch {
      if (!background) setError("Plantation challenge responses could not be loaded.");
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void reload(false), 0);
    const timer = window.setInterval(() => void reload(true), 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [reload]);

  return { submissions, loading, error, reload: () => void reload(false) };
}

function metricValue(submission: PlantationSubmissionRecord, key: PlantationMetricKey): string {
  if (key === "section1Hectares" || key === "section2Hectares") {
    return formatPlantationHectares(submission[key]);
  }
  return formatPlantationTrees(submission[key]);
}

function DeleteButton({
  busy,
  onDelete,
}: {
  busy: boolean;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onDelete}
      className="shrink-0 rounded-md border border-red-400/40 px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-500/15 disabled:opacity-50"
    >
      Delete
    </button>
  );
}

function Overview({
  submissions,
  deletingId,
  onDelete,
}: {
  submissions: PlantationSubmissionRecord[];
  deletingId: string | null;
  onDelete: (submission: PlantationSubmissionRecord) => void;
}) {
  const ranked = PLANTATION_METRICS.map((metric) => ({
    metric,
    rows: rankPlantationSubmissions(submissions, metric.key),
  }));
  const rowCount = submissions.length;

  return (
    <section className={`${wolfCardClass} overflow-x-auto p-4 sm:p-5`}>
      {rowCount === 0 ? (
        <p className="text-sm text-white/55">No entries yet.</p>
      ) : (
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
              <th className="px-2 py-2 font-medium"> </th>
              {PLANTATION_METRICS.map((metric) => (
                <th key={metric.key} className="px-2 py-2 font-medium">
                  {metric.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, index) => (
              <tr key={index} className="border-b border-white/8 align-top">
                <td className="px-2 py-3 tabular-nums text-white/40">{index + 1}</td>
                {ranked.map(({ metric, rows }) => {
                  const submission = rows[index];
                  return (
                    <td key={metric.key} className="px-2 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-white">{submission.participantName}</p>
                          <p className="mt-1 tabular-nums text-white/75">
                            {metricValue(submission, metric.key)}
                          </p>
                        </div>
                        <DeleteButton
                          busy={deletingId === submission.id}
                          onDelete={() => onDelete(submission)}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Details({
  submissions,
  deletingId,
  onDelete,
}: {
  submissions: PlantationSubmissionRecord[];
  deletingId: string | null;
  onDelete: (submission: PlantationSubmissionRecord) => void;
}) {
  if (submissions.length === 0) {
    return (
      <section className={`${wolfCardClass} p-5`}>
        <p className="text-sm text-white/55">No entries yet.</p>
      </section>
    );
  }

  return (
    <section className={`${wolfCardClass} overflow-x-auto p-4 sm:p-5`}>
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
            <th className="px-2 py-2 font-medium">Name</th>
            <th className="px-2 py-2 font-medium">Section 1 hectares</th>
            <th className="px-2 py-2 font-medium">Section 2 hectares</th>
            <th className="px-2 py-2 font-medium">Section 1 trees</th>
            <th className="px-2 py-2 font-medium">Section 2 trees</th>
            <th className="px-2 py-2 font-medium">Submitted</th>
            <th className="px-2 py-2 font-medium"> </th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id} className="border-b border-white/8">
              <td className="px-2 py-3 font-medium text-white">{submission.participantName}</td>
              <td className="px-2 py-3 tabular-nums text-white/80">
                {formatPlantationHectares(submission.section1Hectares)}
              </td>
              <td className="px-2 py-3 tabular-nums text-white/80">
                {formatPlantationHectares(submission.section2Hectares)}
              </td>
              <td className="px-2 py-3 tabular-nums text-white/80">
                {formatPlantationTrees(submission.section1Trees)}
              </td>
              <td className="px-2 py-3 tabular-nums text-white/80">
                {formatPlantationTrees(submission.section2Trees)}
              </td>
              <td className="px-2 py-3 text-white/55">{formatPlantationSubmittedAt(submission.submittedAt)}</td>
              <td className="px-2 py-3">
                <DeleteButton busy={deletingId === submission.id} onDelete={() => onDelete(submission)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function WolfPlantationChallengeWorkspace({ view }: { view: WolfPlantationChallengeView }) {
  const { submissions, loading, error, reload } = usePlantationResponses();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const title = view === "wolf-plantation-overview" ? "Overview" : "Details";

  async function onDelete(submission: PlantationSubmissionRecord) {
    if (!window.confirm(`Delete ${submission.participantName}?`)) return;
    setActionError(null);
    setDeletingId(submission.id);
    try {
      const response = await fetch("/api/wolf/plantation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submission.id }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setActionError(payload?.error || "The entry could not be deleted.");
        return;
      }
      reload();
    } catch {
      setActionError("The entry could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={wolfShellClass}>
      <header className="mb-6">
        <p className={wolfEyebrowClass}>Tools · Course responses · Plantation challenge</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
      </header>
      {loading ? <p className="text-sm text-white/55">Loading entries…</p> : null}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      {actionError ? <p className="mb-3 text-sm text-red-200">{actionError}</p> : null}
      {!loading && !error && view === "wolf-plantation-overview" ? (
        <Overview submissions={submissions} deletingId={deletingId} onDelete={onDelete} />
      ) : null}
      {!loading && !error && view === "wolf-plantation-details" ? (
        <Details submissions={submissions} deletingId={deletingId} onDelete={onDelete} />
      ) : null}
    </div>
  );
}
