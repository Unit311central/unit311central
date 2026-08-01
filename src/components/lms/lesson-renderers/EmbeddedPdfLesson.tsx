"use client";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type PdfContent = Extract<LessonContent, { type: "embedded_pdf" }>;

type Props = {
  lesson: LmsLesson;
  content: PdfContent;
  onComplete: () => void;
};

export default function EmbeddedPdfLesson({ lesson, content, onComplete }: Props) {
  const height = Math.min(content.height ?? 480, 520);

  return (
    <ImmersiveLessonShell
      eyebrow="PDF"
      title={content.title || lesson.title}
      sceneText={`${lesson.title} policy reference document`}
      onPrimary={onComplete}
      primaryLabel="Next"
      wide
      footer={
        <a
          href={content.url}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-300/80 underline-offset-2 hover:underline"
        >
          Open in new tab
        </a>
      }
    >
      <div
        className="overflow-hidden rounded-2xl border border-white/10 bg-black/40"
        style={{ height }}
      >
        <iframe title={content.title || lesson.title} src={content.url} className="h-full w-full" />
      </div>
    </ImmersiveLessonShell>
  );
}
