"use client";

import { Download, FileText } from "lucide-react";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type DocContent = Extract<LessonContent, { type: "document" }>;

type Props = {
  lesson: LmsLesson;
  content: DocContent;
  onComplete: () => void;
};

export default function DocumentLesson({ lesson, content, onComplete }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Documents
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
        {content.intro ? (
          <p className="mt-2 text-sm leading-relaxed text-white/60">{content.intro}</p>
        ) : null}
      </header>

      <ul className="space-y-2">
        {content.files.map((file) => (
          <li
            key={file.url}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{file.title}</p>
                <p className="text-xs text-white/45">
                  {[file.mime, file.sizeLabel].filter(Boolean).join(" · ") || "Download"}
                </p>
              </div>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-white/[0.05]"
            >
              <Download className="h-3.5 w-3.5" />
              Open
            </a>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onComplete}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
      >
        Continue
      </button>
    </div>
  );
}
