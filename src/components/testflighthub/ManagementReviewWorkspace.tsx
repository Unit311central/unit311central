"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, History } from "lucide-react";

import type { TqmsManagementReview } from "@/lib/tqms-data";
import { tqmsStatusClass } from "@/lib/tqms-data";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsStatusPill,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type LocalAction = TqmsManagementReview["actions"][number];

export default function ManagementReviewWorkspace() {
  const store = useTqmsMockStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localActions, setLocalActions] = useState<Record<string, LocalAction[]>>({});

  const reviews = useMemo(
    () =>
      [...store.managementReviews].sort((a, b) =>
        b.reviewDate.localeCompare(a.reviewDate),
      ),
    [store.managementReviews],
  );

  const selected = reviews.find((r) => r.id === selectedId) ?? reviews[0] ?? null;

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    setLocalActions((current) => {
      const next = { ...current };
      for (const review of store.managementReviews) {
        if (!next[review.id]) {
          next[review.id] = review.actions.map((action) => ({ ...action }));
        }
      }
      return next;
    });
  }, [store.managementReviews]);

  const actions = selected ? localActions[selected.id] ?? selected.actions : [];

  function toggleAction(reviewId: string, actionId: string) {
    setLocalActions((current) => ({
      ...current,
      [reviewId]: (current[reviewId] ?? []).map((action) =>
        action.id === actionId ? { ...action, done: !action.done } : action,
      ),
    }));
  }

  const completedReviews = reviews.filter((r) => r.status === "Completed");
  const scheduledReviews = reviews.filter((r) => r.status !== "Completed");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <TqmsSection title="Review Periods" subtitle="Select a management review cycle.">
          {reviews.length === 0 ? (
            <TqmsEmpty message="No management reviews scheduled." />
          ) : (
            <ul className="space-y-2">
              {reviews.map((review) => (
                <li key={review.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(review.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                      selected?.id === review.id
                        ? "border-sky-400/40 bg-sky-500/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{review.period}</p>
                        <p className="mt-0.5 text-xs text-white/45">
                          {review.owner} · {review.reviewDate}
                        </p>
                      </div>
                      <TqmsStatusPill className={tqmsStatusClass(review.status)}>
                        {review.status}
                      </TqmsStatusPill>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </TqmsSection>

        {selected ? (
          <div className="space-y-4">
            <TqmsSection
              title={`Management Review — ${selected.period}`}
              subtitle={`Executive review led by ${selected.owner} · ${selected.reviewDate}`}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">
                    Inputs
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {selected.inputs.map((input) => (
                      <li
                        key={input}
                        className="rounded-lg border border-white/10 bg-[#0b1524]/80 px-3 py-2 text-sm text-white/80"
                      >
                        {input}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">
                    Outputs
                  </h4>
                  <ul className="mt-2 space-y-1.5">
                    {selected.outputs.map((output) => (
                      <li
                        key={output}
                        className="rounded-lg border border-white/10 bg-[#0b1524]/80 px-3 py-2 text-sm text-white/80"
                      >
                        {output}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TqmsSection>

            <TqmsSection
              title="Review Actions"
              subtitle="Action items with owners — toggle completion locally for meeting follow-up."
            >
              {actions.length === 0 ? (
                <TqmsEmpty message="No actions recorded for this review." />
              ) : (
                <ul className="space-y-2">
                  {actions.map((action) => (
                    <li
                      key={action.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleAction(selected.id, action.id)}
                          className={tqmsSecondaryButtonClass()}
                          aria-label={action.done ? "Mark incomplete" : "Mark complete"}
                        >
                          {action.done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          ) : (
                            <Circle className="h-4 w-4 text-white/40" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              action.done ? "text-white/45 line-through" : "text-white"
                            }`}
                          >
                            {action.title}
                          </p>
                          <p className="text-xs text-white/45">
                            {action.owner} · due {action.due}
                          </p>
                        </div>
                      </div>
                      <TqmsStatusPill className={tqmsStatusClass(action.done ? "Complete" : "In Progress")}>
                        {action.done ? "Done" : "Open"}
                      </TqmsStatusPill>
                    </li>
                  ))}
                </ul>
              )}
            </TqmsSection>
          </div>
        ) : null}
      </div>

      <TqmsSection
        title="Review History"
        subtitle="Completed and upcoming executive reviews."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-white/45">
              <History className="h-3.5 w-3.5" />
              Scheduled
            </h4>
            {scheduledReviews.length === 0 ? (
              <p className="text-sm text-white/45">No scheduled reviews.</p>
            ) : (
              <ul className="space-y-2">
                {scheduledReviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-white">{review.period}</p>
                    <p className="text-xs text-white/45">
                      {review.reviewDate} · {review.actions.length} actions
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-white/45">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </h4>
            {completedReviews.length === 0 ? (
              <p className="text-sm text-white/45">No completed reviews yet.</p>
            ) : (
              <ul className="space-y-2">
                {completedReviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-white">{review.period}</p>
                    <p className="text-xs text-white/45">
                      Completed {review.reviewDate} · {review.owner}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </TqmsSection>
    </div>
  );
}
