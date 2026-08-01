"use client";

import type { LmsLesson } from "@/lib/lms/types";

type Props = {
  lesson: LmsLesson;
  onComplete: () => void;
};

export default function UnsupportedLesson({ lesson, onComplete }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
        Unsupported lesson type
      </p>
      <h2 className="text-2xl font-semibold text-white">{lesson.title}</h2>
      <p className="text-sm text-white/55">
        This lesson uses type{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-200">
          {lesson.lessonType}
        </code>
        , which is not yet supported in this player.
      </p>
      <button
        type="button"
        onClick={onComplete}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
      >
        Mark complete & continue
      </button>
    </div>
  );
}
