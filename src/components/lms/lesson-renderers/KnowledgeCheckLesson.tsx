"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
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
    <ImmersiveLessonShell
      eyebrow="Knowledge check"
      title={lesson.title}
      sceneText={`${lesson.title} ${content.prompt}`}
      primaryLabel="Next"
      primaryDisabled={!answered}
      onPrimary={onComplete}
      footer={answered ? (correct ? "Correct" : "Review the explanation") : "Pick an answer"}
    >
      <p className="text-base leading-relaxed text-white/85">{content.prompt}</p>

      <div className="mt-6 space-y-3">
        {content.choices.map((choice, i) => {
          const active = selectedId === choice.id;
          const showCorrect = answered && choice.id === content.correctId;
          const showWrong = answered && active && !correct;
          return (
            <motion.button
              key={choice.id}
              type="button"
              disabled={answered}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i }}
              onClick={() => setSelectedId(choice.id)}
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition ${
                showCorrect
                  ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                  : showWrong
                    ? "border-rose-400/50 bg-rose-500/15 text-rose-100"
                    : active
                      ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20"
              }`}
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-white/50">
                {String.fromCharCode(65 + i)}
              </span>
              <span>{choice.label}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered ? (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
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
    </ImmersiveLessonShell>
  );
}
