"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";
import { resolveQuestionScene } from "@/lib/lms/question-scenes";

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
  const scene = resolveQuestionScene(`${lesson.title} ${content.prompt}`);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a1628] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] lg:flex-row">
      <div className="relative h-48 shrink-0 overflow-hidden sm:h-56 lg:h-auto lg:w-[40%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scene.imageUrl} alt={scene.label} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/35 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#0a1628]/20 lg:to-[#0a1628]" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
            Knowledge check · {scene.label}
          </p>
          <p className="mt-1 text-sm text-white/85">{scene.caption}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-7">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{lesson.title}</h2>
        <p className="mt-4 text-base leading-relaxed text-white/85">{content.prompt}</p>

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

        <button
          type="button"
          onClick={onComplete}
          disabled={!answered}
          className="mt-auto rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
