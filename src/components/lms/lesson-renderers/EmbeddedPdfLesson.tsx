"use client";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type PdfContent = Extract<LessonContent, { type: "embedded_pdf" }>;

type Props = {
  lesson: LmsLesson;
  content: PdfContent;
  onComplete: () => void;
};

export default function EmbeddedPdfLesson({ lesson, content, onComplete }: Props) {
  const height = content.height ?? 640;

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          PDF
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {content.title || lesson.title}
        </h2>
      </header>

      <div
        className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-xl shadow-black/30"
        style={{ height }}
      >
        <iframe title={content.title || lesson.title} src={content.url} className="h-full w-full" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={content.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-emerald-300/80 underline-offset-2 hover:underline"
        >
          Open in new tab
        </a>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
