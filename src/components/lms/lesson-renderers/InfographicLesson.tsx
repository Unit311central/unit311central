"use client";

import { motion } from "framer-motion";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type InfographicContent = Extract<LessonContent, { type: "infographic" }>;

type Props = {
  lesson: LmsLesson;
  content: InfographicContent;
  onComplete: () => void;
};

export default function InfographicLesson({ lesson, content, onComplete }: Props) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Infographic
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          {content.title || lesson.title}
        </h2>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-semibold text-emerald-200">
                {item.icon || String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-base font-semibold text-white">{item.label}</h3>
            </div>
            <p className="text-sm leading-relaxed text-white/65">{item.body}</p>
          </motion.div>
        ))}
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
