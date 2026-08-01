"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type ScenarioContent = Extract<LessonContent, { type: "scenario" }>;

type Props = {
  lesson: LmsLesson;
  content: ScenarioContent;
  onComplete: () => void;
};

export default function ScenarioLesson({ lesson, content, onComplete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = content.choices.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Scenario
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
      </header>

      {content.character ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          {content.character.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.character.imageUrl}
              alt={content.character.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-200">
              {content.character.name.slice(0, 1)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{content.character.name}</p>
            <p className="text-xs text-white/50">{content.character.role}</p>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-5">
        <p className="text-base leading-relaxed text-white/80">{content.story}</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
          What would you do?
        </p>
        {content.choices.map((choice) => {
          const active = selectedId === choice.id;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={Boolean(selected)}
              onClick={() => setSelectedId(choice.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? choice.correct
                    ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                    : "border-amber-400/50 bg-amber-500/15 text-amber-100"
                  : "border-white/10 bg-white/[0.03] text-white/80 hover:border-emerald-400/30 hover:bg-white/[0.05] disabled:opacity-50"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl border px-4 py-3 text-sm ${
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
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
