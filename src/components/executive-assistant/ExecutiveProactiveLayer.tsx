"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  DailyExecutiveBrief,
  ProactiveNotification,
  ReleaseIntelligence,
} from "@/lib/ai-operating-assistant/executive-types";
import {
  acceptReleaseTour,
  bootstrapReleaseVisit,
  dismissNotification,
  handleExecutiveActionHref,
  hasSeenDailyBrief,
  markDailyBriefSeen,
  readDismissedNotificationIds,
  startWorkflowGuide,
  WORKFLOW_GUIDE_EVENT,
  type WorkflowGuideEventDetail,
} from "@/lib/ai-operating-assistant/proactive-client";
import { markReleaseSeen } from "@/lib/ai-operating-assistant/release-intelligence";
import { cn } from "@/lib/utils";
import { Bell, Sparkles, X } from "lucide-react";

import ExplanationPanel from "./ExplanationPanel";

type ProactiveBundle = {
  brief: DailyExecutiveBrief | null;
  notifications: ProactiveNotification[];
  release: ReleaseIntelligence | null;
};

export default function ExecutiveProactiveLayer({
  activeView,
  roleView,
  onOpenAssistant,
}: {
  activeView?: string | null;
  roleView?: string | null;
  onOpenAssistant?: () => void;
}) {
  const [brief, setBrief] = useState<DailyExecutiveBrief | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);
  const [release, setRelease] = useState<ReleaseIntelligence | null>(null);
  const [showRelease, setShowRelease] = useState(false);
  const [workflowGuide, setWorkflowGuide] = useState<WorkflowGuideEventDetail | null>(null);

  useEffect(() => {
    const onWorkflow = (event: Event) => {
      const detail = (event as CustomEvent<WorkflowGuideEventDetail>).detail;
      if (detail) setWorkflowGuide(detail);
    };
    window.addEventListener(WORKFLOW_GUIDE_EVENT, onWorkflow as EventListener);
    return () => window.removeEventListener(WORKFLOW_GUIDE_EVENT, onWorkflow as EventListener);
  }, []);

  const load = useCallback(async () => {
    const lastSeenAt = bootstrapReleaseVisit();
    try {
      const response = await fetch("/api/executive-assistant/proactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeView: activeView ?? "home",
          roleView,
          lastSeenAt,
          include: "brief,notifications,release",
        }),
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as ProactiveBundle;
      const dismissed = new Set(readDismissedNotificationIds());
      setNotifications(
        activeView === "home"
          ? []
          : (data.notifications ?? []).filter((entry) => !dismissed.has(entry.id)).slice(0, 3),
      );

      const briefPending = Boolean(data.brief && !hasSeenDailyBrief());
      // Home dashboard already centres the Daily Brief — skip floating card there.
      if (briefPending && data.brief && activeView !== "home") {
        setBrief(data.brief);
        setShowBrief(true);
      } else if (data.release?.offerTour) {
        setRelease(data.release);
        setShowRelease(true);
      }
      if (activeView === "home" && data.brief) {
        markDailyBriefSeen();
      }
    } catch {
      // proactive layer is optional if offline / unauthenticated edge cases
    }
  }, [activeView, roleView]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      {workflowGuide ? (
        <div className="safe-area-px pointer-events-none fixed top-[max(4.25rem,env(safe-area-inset-top))] left-1/2 z-[59] w-[min(420px,calc(100vw-1.5rem))] -translate-x-1/2">
          <div className="pointer-events-auto rounded-2xl border border-emerald-400/30 bg-[#0b1524]/96 p-3 text-white shadow-xl backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
              Workflow · {workflowGuide.name} · Step {workflowGuide.stepIndex + 1} of{" "}
              {workflowGuide.totalSteps}
            </p>
            <p className="mt-1 text-sm font-semibold">{workflowGuide.title}</p>
            <p className="mt-1 text-xs text-white/65">{workflowGuide.instruction}</p>
            <div className="mt-2 flex gap-2">
              {workflowGuide.stepIndex < workflowGuide.totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    startWorkflowGuide(workflowGuide.workflowId, workflowGuide.stepIndex + 1)
                  }
                  className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-100"
                >
                  Next step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setWorkflowGuide(null)}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-100"
                >
                  Done
                </button>
              )}
              <button
                type="button"
                onClick={() => setWorkflowGuide(null)}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/55"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRelease && release ? (
        <div className="safe-area-px pointer-events-none fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-[57] w-[min(360px,calc(100vw-1.5rem))] md:left-auto md:right-[max(5.5rem,env(safe-area-inset-right))]">
          <div className="pointer-events-auto rounded-2xl border border-violet-400/30 bg-[#0b1524]/95 p-4 text-white shadow-xl backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/90">
              Release intelligence
            </p>
            <p className="mt-1 text-sm font-semibold">{release.message}</p>
            <ul className="mt-2 space-y-1">
              {release.unseenFeatures.slice(0, 3).map((feature) => (
                <li key={feature.id} className="text-xs text-white/65">
                  · {feature.title}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenAssistant?.();
                  acceptReleaseTour(release.tourViewId ?? "home");
                  setShowRelease(false);
                }}
                className="rounded-lg border border-violet-400/40 bg-violet-500/20 px-2.5 py-1.5 text-xs font-semibold text-violet-100"
              >
                Yes, 90-second tour
              </button>
              <button
                type="button"
                onClick={() => {
                  markReleaseSeen();
                  setShowRelease(false);
                }}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBrief && brief ? (
        <div className="safe-area-px pointer-events-none fixed inset-x-0 top-[max(4.5rem,env(safe-area-inset-top))] z-[58] flex justify-center px-3">
          <div className="pointer-events-auto w-[min(520px,100%)] rounded-2xl border border-sky-400/30 bg-[#0b1524]/96 p-4 text-white shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/90">
                  <Sparkles className="h-3 w-3" />
                  Daily executive brief
                </p>
                <h3 className="mt-1 text-sm font-semibold">{brief.greeting}</h3>
                <p className="mt-1 text-xs text-white/60">{brief.headline}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss brief"
                onClick={() => {
                  markDailyBriefSeen();
                  setShowBrief(false);
                }}
                className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/[0.06]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Today&apos;s priorities
              </p>
              <ul className="space-y-1.5">
                {brief.priorities.slice(0, 4).map((priority) => (
                  <li key={priority} className="text-sm text-white/80">
                    · {priority}
                  </li>
                ))}
              </ul>
            </div>

            {brief.recommendedWorkflows.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {brief.recommendedWorkflows.slice(0, 3).map((workflowId) => (
                  <button
                    key={workflowId}
                    type="button"
                    onClick={() => {
                      markDailyBriefSeen();
                      setShowBrief(false);
                      startWorkflowGuide(workflowId, 0);
                    }}
                    className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-100"
                  >
                    Start · {workflowId.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            ) : null}

            {brief.insights[0]?.explanation ? (
              <div className="mt-3">
                <ExplanationPanel
                  compact
                  title={brief.insights[0].title}
                  explanation={brief.insights[0].explanation}
                  feedbackTargetId={brief.insights[0].id}
                  feedbackTargetType="brief"
                  contextView={activeView}
                />
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  markDailyBriefSeen();
                  setShowBrief(false);
                  onOpenAssistant?.();
                }}
                className="rounded-lg border border-sky-400/40 bg-sky-500/20 px-2.5 py-1.5 text-xs font-semibold text-sky-100"
              >
                Discuss with Assistant
              </button>
              <button
                type="button"
                onClick={() => {
                  markDailyBriefSeen();
                  setShowBrief(false);
                }}
                className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60"
              >
                Dismiss for today
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <div className="safe-area-px pointer-events-none fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-[56] flex w-[min(320px,calc(100vw-1.5rem))] flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "pointer-events-auto rounded-xl border bg-[#0b1524]/95 p-3 text-white shadow-lg backdrop-blur",
                notification.severity === "critical"
                  ? "border-rose-400/35"
                  : "border-amber-400/30",
              )}
            >
              <div className="flex items-start gap-2">
                <Bell
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    notification.severity === "critical" ? "text-rose-300" : "text-amber-300",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{notification.title}</p>
                  {typeof notification.confidence === "number" ? (
                    <p className="mt-0.5 text-[10px] text-white/45">
                      Confidence {Math.round(notification.confidence)}%
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-[11px] text-white/60">{notification.body}</p>
                  {notification.explanation ? (
                    <div className="mt-2">
                      <ExplanationPanel
                        compact
                        explanation={notification.explanation}
                        feedbackTargetId={notification.insightId}
                        feedbackTargetType="insight"
                        contextView={activeView}
                      />
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {notification.href ? (
                      <button
                        type="button"
                        onClick={() => handleExecutiveActionHref(notification.href!)}
                        className="rounded-md border border-white/15 px-2 py-1 text-[10px] text-white/80"
                      >
                        Open
                      </button>
                    ) : null}
                    {notification.workflowId ? (
                      <button
                        type="button"
                        onClick={() => startWorkflowGuide(notification.workflowId!, 0)}
                        className="rounded-md border border-sky-400/30 px-2 py-1 text-[10px] text-sky-100"
                      >
                        Guide me
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        dismissNotification(notification.id);
                        setNotifications((current) =>
                          current.filter((entry) => entry.id !== notification.id),
                        );
                      }}
                      className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/45"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
