"use client";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LmsLesson } from "@/lib/lms/types";

type Props = {
  lesson: LmsLesson;
  onComplete: () => void;
};

export default function UnsupportedLesson({ lesson, onComplete }: Props) {
  return (
    <ImmersiveLessonShell
      eyebrow="Unsupported lesson type"
      title={lesson.title}
      sceneText={lesson.title}
      onPrimary={onComplete}
      primaryLabel="Mark complete & continue"
    >
      <p className="text-sm text-white/60">
        This lesson uses type{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-200">
          {lesson.lessonType}
        </code>
        , which is not yet supported in this player.
      </p>
    </ImmersiveLessonShell>
  );
}
