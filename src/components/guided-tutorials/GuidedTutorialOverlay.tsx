"use client";

import { CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { stepRequiresWidePanel, stepUsesDomHighlight } from "@/lib/guided-tutorials/step-presentation";
import { isBrowserWolfCentralSurface } from "@/lib/wolf/wolf-surface";

import TutorialStepBody from "./TutorialStepBody";
import { useOptionalGuidedTutorial } from "./GuidedTutorialProvider";

function CalloutArrow({ side }: { side: "top" | "left" }) {
  if (side === "left") {
    return (
      <span
        aria-hidden
        className="absolute -left-2 top-8 h-4 w-4 rotate-45 border-b border-l border-sky-400/40 bg-[#0b1524]/98"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-sky-400/40 bg-[#0b1524]/98"
    />
  );
}

export default function GuidedTutorialOverlay() {
  if (typeof window !== "undefined" && isBrowserWolfCentralSurface()) return null;
  const guided = useOptionalGuidedTutorial();
  if (!guided || guided.phase === "idle") return null;

  const tutorial = guided.tutorial;
  const total = Math.max(guided.steps.length, 1);
  const isComplete = guided.phase === "complete";
  const step = guided.currentStep;
  const rect = guided.highlightRect;
  const showSpotlight = Boolean(rect && !isComplete && stepUsesDomHighlight(step));
  const widePanel = stepRequiresWidePanel(step);
  const pad = 6;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[68]"
        style={{
          background: "color-mix(in srgb, #020617 55%, transparent)",
        }}
      />

      {showSpotlight && rect ? (
        <>
          <div
            aria-hidden
            className="unit311-ai-spotlight pointer-events-none fixed z-[70] rounded-xl border-2 border-sky-300/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)]"
            style={{
              top: Math.max(4, rect.top - pad),
              left: Math.max(4, rect.left - pad),
              width: rect.width + pad * 2,
              height: rect.height + pad * 2,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none fixed z-[70] h-0 w-0"
            style={{
              top: rect.top + rect.height / 2,
              left: rect.right + 8,
            }}
          >
            <div className="h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-sky-300/70 bg-transparent" />
          </div>
        </>
      ) : null}

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isComplete ? "Tutorial complete" : `Tutorial: ${tutorial?.title ?? "Learn"}`}
        className="pointer-events-none fixed top-[4.75rem] right-[max(1rem,env(safe-area-inset-right))] z-[71] sm:top-[5.25rem]"
        style={{ width: widePanel ? "min(420px, calc(100vw - 1.5rem))" : "min(360px, calc(100vw - 1.5rem))" }}
      >
        <div className="pointer-events-auto overflow-hidden rounded-2xl border border-white/12 bg-[#0b1524]/98 text-white shadow-2xl">
          <div className="border-b border-white/8 bg-gradient-to-r from-sky-500/10 to-transparent px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/90">
                  {isComplete ? "Tutorial complete" : "Learn"}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold">
                  {guided.contextPath || tutorial?.title || "Guided learning"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Exit tutorial"
                onClick={guided.closeTutorial}
                className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {!isComplete ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-white/45">
                  <span>
                    Step {guided.stepIndex + 1} of {total}
                  </span>
                  <span>{Math.round(((guided.stepIndex + 1) / total) * 100)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-sky-400 transition-all duration-300"
                    style={{ width: `${((guided.stepIndex + 1) / total) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative px-4 py-4">
            {!isComplete && step ? <CalloutArrow side={showSpotlight ? "left" : "top"} /> : null}

            {isComplete ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <h3 className="mt-3 text-base font-semibold">Nice work!</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  You finished the {tutorial?.title ?? "tutorial"}. Reopen Learn any time from the
                  header when you are on this screen.
                </p>
                <button
                  type="button"
                  onClick={guided.closeTutorial}
                  className="mt-4 w-full rounded-xl border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-100"
                >
                  Done
                </button>
              </div>
            ) : step ? (
              <>
                <TutorialStepBody step={step} hasTarget={Boolean(rect && stepUsesDomHighlight(step))} />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={guided.prevStep}
                    disabled={guided.stepIndex === 0}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/65 hover:bg-white/[0.05] disabled:opacity-35"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={guided.nextStep}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                      guided.stepIndex >= total - 1
                        ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
                        : "border-sky-400/35 bg-sky-500/15 text-sky-100",
                    )}
                  >
                    {guided.stepIndex >= total - 1 ? "Finish" : "Next"}
                  </button>
                  <button
                    type="button"
                    onClick={guided.closeTutorial}
                    className="ml-auto text-xs text-white/40 hover:text-white/60"
                  >
                    Exit
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
