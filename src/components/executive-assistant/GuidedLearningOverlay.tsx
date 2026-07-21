"use client";

import { cn } from "@/lib/utils";
import { useOptionalGuidedLearning } from "./GuidedLearningProvider";

export default function GuidedLearningOverlay() {
  const guided = useOptionalGuidedLearning();
  if (!guided?.tourActive || !guided.currentStep) return null;

  const rect = guided.highlightRect;
  const pad = 8;

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-[#020617]/55" />

      {rect ? (
        <div
          className="unit311-ai-spotlight absolute rounded-xl border-2 border-sky-300"
          style={{
            top: Math.max(8, rect.top - pad),
            left: Math.max(8, rect.left - pad),
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      ) : null}

      <div className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[71] w-[min(440px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#0b1524] p-4 text-white shadow-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/90">
          Guided learning · Step {guided.stepIndex + 1} of {Math.max(guided.steps.length, 1)}
        </p>
        <h3 className="mt-1 text-sm font-semibold">{guided.currentStep.label}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          {guided.currentStep.explanation}
        </p>
        {!rect ? (
          <p className="mt-2 text-xs text-amber-200/90">
            This control is not marked on the page yet — explanation is still available from the page
            registry.
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={guided.prevStep}
            disabled={guided.stepIndex === 0}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/[0.06] disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={guided.nextStep}
            className="rounded-lg border border-sky-400/40 bg-sky-500/20 px-2.5 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/30"
          >
            {guided.stepIndex >= guided.steps.length - 1 ? "Done" : "Continue"}
          </button>
          <button
            type="button"
            onClick={guided.restartTour}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/[0.06]"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={guided.skipTour}
            className={cn(
              "ml-auto rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/50 hover:bg-white/[0.06]",
            )}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuidedLearningFirstVisitOffer({
  onOpenAssistant,
}: {
  onOpenAssistant?: () => void;
}) {
  const guided = useOptionalGuidedLearning();
  if (!guided?.firstVisitOffer) return null;

  return (
    <div className="safe-area-px pointer-events-none fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-[56] w-[min(320px,calc(100vw-1.5rem))]">
      <div className="pointer-events-auto rounded-2xl border border-sky-400/30 bg-[#0b1524]/95 p-4 text-white backdrop-blur">
        <p className="text-sm font-semibold">👋 Would you like a 30 second tour?</p>
        <p className="mt-1 text-xs text-white/60">
          I can walk you through {guided.firstVisitOffer.pageName} interactively — no static help
          pages.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onOpenAssistant?.();
              guided.acceptFirstVisitTour();
            }}
            className="rounded-lg border border-sky-400/40 bg-sky-500/20 px-2.5 py-1.5 text-xs font-semibold text-sky-100"
          >
            Yes, show me
          </button>
          <button
            type="button"
            onClick={guided.dismissFirstVisitTour}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
