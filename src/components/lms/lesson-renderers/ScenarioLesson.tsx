"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";
import { resolveQuestionScene } from "@/lib/lms/question-scenes";

type ScenarioContent = Extract<LessonContent, { type: "scenario" }>;

type Props = {
  lesson: LmsLesson;
  content: ScenarioContent;
  onComplete: () => void;
};

export default function ScenarioLesson({ lesson, content, onComplete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = content.choices.find((c) => c.id === selectedId) ?? null;
  const scene = resolveQuestionScene(
    `${lesson.title} ${content.story} ${content.character?.role ?? ""}`,
  );
  const heroImage = content.character?.imageUrl || scene.imageUrl;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a1628] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] lg:flex-row">
      <div className="relative h-52 shrink-0 overflow-hidden sm:h-64 lg:h-auto lg:w-[44%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage} alt={scene.label} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/40 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#0a1628]/25 lg:to-[#0a1628]" />
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
            Scenario · {scene.label}
          </p>
          {content.character ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-sm font-semibold text-white backdrop-blur">
                {content.character.name.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{content.character.name}</p>
                <p className="text-xs text-white/65">{content.character.role}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          What would you do?
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{lesson.title}</h2>
        <p className="mt-4 text-base leading-relaxed text-white/80">{content.story}</p>

        <div className="mt-6 space-y-3">
          {content.choices.map((choice, i) => {
            const active = selectedId === choice.id;
            return (
              <motion.button
                key={choice.id}
                type="button"
                disabled={Boolean(selected)}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => setSelectedId(choice.id)}
                className={`w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition ${
                  active
                    ? choice.correct
                      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                      : "border-amber-400/50 bg-amber-500/15 text-amber-100"
                    : "border-white/10 bg-white/[0.03] text-white/80 hover:border-emerald-400/30 hover:bg-white/[0.05] disabled:opacity-50"
                }`}
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-[11px] font-semibold text-white/55">
                  {String.fromCharCode(65 + i)}
                </span>
                {choice.label}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {selected ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                selected.correct
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                  : "border-amber-400/40 bg-amber-500/10 text-amber-100"
              }`}
            >
              <p className="mb-1 font-semibold">
                {selected.correct ? "Strong choice" : "Learning moment"}
              </p>
              <p className="leading-relaxed opacity-90">{selected.feedback}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <button
          type="button"
          onClick={onComplete}
          disabled={!selected}
          className="mt-auto inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
