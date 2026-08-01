"use client";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type ImageContent = Extract<LessonContent, { type: "image" }>;

type Props = {
  lesson: LmsLesson;
  content: ImageContent;
  onComplete: () => void;
};

export default function ImageLesson({ lesson, content, onComplete }: Props) {
  const layout = content.layout ?? "full";

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Visual
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
      </header>

      <figure
        className={
          layout === "card"
            ? "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            : layout === "split"
              ? "grid gap-6 md:grid-cols-2 md:items-center"
              : "space-y-3"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.src}
          alt={content.alt}
          className={
            layout === "card"
              ? "w-full rounded-xl object-cover"
              : "w-full rounded-2xl border border-white/10 object-cover shadow-lg shadow-black/30"
          }
        />
        {content.caption || layout === "split" ? (
          <figcaption className="space-y-2 text-sm text-white/65">
            {content.caption ? <p>{content.caption}</p> : null}
            <p className="text-white/45">{content.alt}</p>
          </figcaption>
        ) : null}
      </figure>

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
