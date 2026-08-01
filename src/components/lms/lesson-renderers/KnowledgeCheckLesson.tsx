"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type KCContent = Extract<LessonContent, { type: "knowledge_check" }>;

type Props = {
  lesson: LmsLesson;
  content: KCContent;
  onComplete: () => void;
};

export default function KnowledgeCheckLesson({ lesson, content, onComplete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const answered = selectedId !== null;
  const correct = selectedId === content.correctId;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Knowledge check
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
        <p className="mt-3 text-base leading-relaxed text-white/80">{content.prompt}</p>
      </header>

      <div className="space-y-2">
        {content.choices.map((choice) => {
          const active = selectedId === choice.id;
          const showCorrect = answered && choice.id === content.correctId;
          const showWrong = answered && active && !correct;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={answered}
              onClick={() => setSelectedId(choice.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                showCorrect
                  ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                  : showWrong
                    ? "border-rose-400/50 bg-rose-500/15 text-rose-100"
                    : active
                      ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border px-4 py-3 text-sm ${
              correct
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border-amber-400/40 bg-amber-500/10 text-amber-100"
            }`}
          >
            <p className="mb-1 font-semibold">{correct ? "Correct" : "Not quite"}</p>
            <p className="leading-relaxed opacity-90">{content.explanation}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={onComplete}
        disabled={!answered}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
