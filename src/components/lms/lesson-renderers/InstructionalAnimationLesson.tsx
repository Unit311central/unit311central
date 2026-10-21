"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import { MotionStudioPlayer } from "@/components/motion-studio/MotionStudioPlayer";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";
import { activeScene } from "@/lib/motion-studio/playback";

type AnimationContent = Extract<LessonContent, { type: "instructional_animation" }>;

type Props = {
  lesson: LmsLesson;
  content: AnimationContent;
  onComplete: () => void;
};

export default function InstructionalAnimationLesson({ lesson, content, onComplete }: Props) {
  const reducedMotion = useReducedMotion() ?? false;
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(!reducedMotion);

  const payload = useMemo(
    () => ({
      ...content.spec,
      id: lesson.id,
    }),
    [content.spec, lesson.id],
  );

  const steps = content.steps;
  const scene = steps[stepIndex];
  const stepStartMs = payload.scenes[stepIndex]?.startMs ?? 0;

  return (
    <ImmersiveLessonShell
      eyebrow="Instructional animation"
      title={content.title || lesson.title}
      sceneText={scene ? `${scene.heading} ${scene.body}` : lesson.title}
      onPrimary={onComplete}
      primaryLabel="Continue"
    >
      {content.synopsis ? (
        <p className="mb-4 text-sm leading-relaxed text-white/70">{content.synopsis}</p>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
        <MotionStudioPlayer
          payload={payload}
          autoPlay={autoPlay}
          variant="compact"
          dataTestId={`instructional-animation-${lesson.id}`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAutoPlay((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/85"
        >
          {autoPlay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {autoPlay ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAutoPlay(false);
            setStepIndex(0);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/85"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Replay
        </button>
        <button
          type="button"
          disabled={stepIndex <= 0}
          onClick={() => {
            setAutoPlay(false);
            setStepIndex((i) => Math.max(0, i - 1));
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1.5 text-xs text-white/85 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Step back
        </button>
        <button
          type="button"
          disabled={stepIndex >= steps.length - 1}
          onClick={() => {
            setAutoPlay(false);
            setStepIndex((i) => Math.min(steps.length - 1, i + 1));
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1.5 text-xs text-white/85 disabled:opacity-40"
        >
          Step forward
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-white/45">
          Step {stepIndex + 1} of {steps.length}
          {scene ? ` · ${scene.heading}` : ""}
        </span>
      </div>

      {scene ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-semibold text-white">{scene.heading}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{scene.body}</p>
          {scene.narration && scene.narration !== scene.body ? (
            <p className="mt-2 text-xs text-white/50">{scene.narration}</p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-white/40">
        Narration sync: {activeScene(payload, stepStartMs)?.title ?? "—"}
      </p>
    </ImmersiveLessonShell>
  );
}
