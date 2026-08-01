"use client";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type RichTextContent = Extract<LessonContent, { type: "rich_text" }>;

type Props = {
  lesson: LmsLesson;
  content: RichTextContent;
  onComplete: () => void;
};

function CalloutTone({ tone }: { tone?: "info" | "warning" | "success" }) {
  if (tone === "warning") return "border-amber-400/40 bg-amber-500/10 text-amber-100";
  if (tone === "success") return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  return "border-sky-400/40 bg-sky-500/10 text-sky-100";
}

export default function RichTextLesson({ lesson, content, onComplete }: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Reading
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {content.title || lesson.title}
        </h2>
      </header>

      <div className="space-y-4">
        {content.blocks.map((block, i) => {
          if (block.kind === "heading") {
            const Tag = (`h${block.level ?? 2}` as "h1" | "h2" | "h3");
            return (
              <Tag
                key={i}
                className={
                  block.level === 1
                    ? "text-2xl font-semibold text-white"
                    : block.level === 3
                      ? "text-lg font-semibold text-white/90"
                      : "text-xl font-semibold text-white"
                }
              >
                {block.text}
              </Tag>
            );
          }
          if (block.kind === "paragraph") {
            return (
              <p key={i} className="text-base leading-relaxed text-white/75">
                {block.text}
              </p>
            );
          }
          if (block.kind === "bullet_list") {
            return (
              <ul key={i} className="list-disc space-y-2 pl-5 text-white/75">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <div
              key={i}
              className={`rounded-xl border px-4 py-3 ${CalloutTone({ tone: block.tone })}`}
            >
              {block.title ? (
                <p className="mb-1 text-sm font-semibold">{block.title}</p>
              ) : null}
              <p className="text-sm leading-relaxed opacity-90">{block.text}</p>
            </div>
          );
        })}
      </div>

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
