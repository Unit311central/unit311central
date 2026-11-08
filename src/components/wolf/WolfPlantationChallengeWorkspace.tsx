"use client";

import { useCallback, useEffect, useState } from "react";

import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import {
  PLANTATION_METRICS,
  formatPlantationHectares,
  formatPlantationSubmittedAt,
  formatPlantationTrees,
  plantationBarPercent,
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

const METRIC_BAR_CLASS: Record<PlantationMetricKey, string> = {
  section1Hectares: "bg-emerald-400",
  section2Hectares: "bg-cyan-300",
  section1Trees: "bg-amber-300",
  section2Trees: "bg-orange-300",
};

function MetricChart({
  metric,
  submissions,
}: {
  metric: (typeof PLANTATION_METRICS)[number];
  submissions: PlantationSubmissionRecord[];
}) {
  const ranked = rankPlantationSubmissions(submissions, metric.key);
  const max = ranked.reduce((highest, submission) => Math.max(highest, submission[metric.key]), 0);

  return (
    <section className={`${wolfCardClass} p-4 sm:p-5`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">{metric.label}</h2>
      <ol className="mt-4 space-y-3">
        {ranked.map((submission, index) => {
          const width = plantationBarPercent(submission[metric.key], max);
          return (
            <li key={submission.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <p className="min-w-0 truncate font-medium text-white">
                  <span className="mr-2 tabular-nums text-white/35">{index + 1}</span>
                  {submission.participantName}
                </p>
                <p className="shrink-0 tabular-nums text-white/80">{metricValue(submission, metric.key)}</p>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${METRIC_BAR_CLASS[metric.key]}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
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
  const [sortKey, setSortKey] = useState<PlantationMetricKey>("section1Hectares");
  const rows = rankPlantationSubmissions(submissions, sortKey);

  if (rows.length === 0) {
    return (
      <section className={`${wolfCardClass} p-5`}>
        <p className="text-sm text-white/55">No entries yet.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {PLANTATION_METRICS.map((metric) => (
          <MetricChart key={metric.key} metric={metric} submissions={submissions} />
        ))}
      </div>
      <section className={`${wolfCardClass} overflow-x-auto p-4 sm:p-5`}>
        <p className="mb-3 text-xs text-white/45">Largest value in the selected column is at the top.</p>
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
                <th className="px-2 py-2 font-medium">Name</th>
                {PLANTATION_METRICS.map((metric) => {
                  const selected = sortKey === metric.key;
                  return (
                    <th key={metric.key} className="px-2 py-2 font-medium" aria-sort={selected ? "descending" : "none"}>
                      <button
                        type="button"
                        onClick={() => setSortKey(metric.key)}
                        className={`uppercase tracking-wide ${selected ? "text-white" : "text-white/45 hover:text-white"}`}
                      >
                        {metric.label}
                        {selected ? <span aria-hidden="true"> ↓</span> : null}
                      </button>
                    </th>
                  );
                })}
                <th className="px-2 py-2 font-medium">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((submission) => (
                <tr key={submission.id} className="border-b border-white/8">
                  <td className="px-2 py-3 font-medium text-white">{submission.participantName}</td>
                  {PLANTATION_METRICS.map((metric) => (
                    <td key={metric.key} className="px-2 py-3 tabular-nums text-white/80">
                      {metricValue(submission, metric.key)}
                    </td>
                  ))}
                  <td className="px-2 py-3">
                    <DeleteButton busy={deletingId === submission.id} onDelete={() => onDelete(submission)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </section>
    </div>
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
            {PLANTATION_METRICS.map((metric) => (
              <th key={metric.key} className="px-2 py-2 font-medium">
                {metric.label}
              </th>
            ))}
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
