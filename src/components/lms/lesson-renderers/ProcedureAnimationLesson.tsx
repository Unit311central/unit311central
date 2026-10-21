"use client";

import { useState } from "react";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import ProcedureAnimationPlayer from "@/components/lms/ProcedureAnimationPlayer";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type ProcedureAnimationContent = Extract<LessonContent, { type: "procedure_animation" }>;

type Props = {
  lesson: LmsLesson;
  content: ProcedureAnimationContent;
  onComplete: () => void;
};

export default function ProcedureAnimationLesson({ lesson, content, onComplete }: Props) {
  const [watched, setWatched] = useState(false);

  return (
    <ImmersiveLessonShell
      eyebrow="Animated procedure"
      title={content.title || lesson.title}
      sceneText={`${lesson.title} ${content.spec.nodes.map((n) => n.label).join(" ")}`}
      onPrimary={watched ? onComplete : undefined}
      primaryLabel={watched ? "Continue" : "Watch the animation, then continue"}
      primaryDisabled={!watched}
    >
      <ProcedureAnimationPlayer
        spec={content.spec}
        onFinished={() => setWatched(true)}
      />
      {!watched ? (
        <p className="mt-2 text-xs text-white/45">
          Use Play to step through the procedure. The final state stays visible for review.
        </p>
      ) : null}
    </ImmersiveLessonShell>
  );
}
