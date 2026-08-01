"use client";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type ImageContent = Extract<LessonContent, { type: "image" }>;

type Props = {
  lesson: LmsLesson;
  content: ImageContent;
  onComplete: () => void;
};

export default function ImageLesson({ lesson, content, onComplete }: Props) {
  return (
    <ImmersiveLessonShell
      eyebrow="Visual"
      title={lesson.title}
      subtitle={content.caption || content.alt}
      imageUrl={content.src}
      sceneText={`${lesson.title} ${content.alt} ${content.caption ?? ""}`}
      onPrimary={onComplete}
      primaryLabel="Next"
      wide
    >
      <div className="overflow-hidden rounded-2xl border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={content.src} alt={content.alt} className="max-h-[42vh] w-full object-cover" />
      </div>
      {content.caption ? (
        <p className="mt-4 text-sm leading-relaxed text-white/70">{content.caption}</p>
      ) : null}
    </ImmersiveLessonShell>
  );
}
