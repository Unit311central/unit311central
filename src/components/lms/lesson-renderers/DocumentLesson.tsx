"use client";

import { Download, FileText } from "lucide-react";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type DocContent = Extract<LessonContent, { type: "document" }>;

type Props = {
  lesson: LmsLesson;
  content: DocContent;
  onComplete: () => void;
};

export default function DocumentLesson({ lesson, content, onComplete }: Props) {
  return (
    <ImmersiveLessonShell
      eyebrow="Documents"
      title={lesson.title}
      subtitle={content.intro}
      sceneText={`${lesson.title} ${content.intro ?? ""} policy document pack`}
      onPrimary={onComplete}
      primaryLabel="Next"
    >
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
    </ImmersiveLessonShell>
  );
}
