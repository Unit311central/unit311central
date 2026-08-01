"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
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
    <ImmersiveLessonShell
      eyebrow="Scenario"
      title={lesson.title}
      subtitle={
        content.character
          ? `${content.character.name} · ${content.character.role}`
          : undefined
      }
      imageUrl={heroImage}
      sceneText={`${lesson.title} ${content.story}`}
      primaryLabel="Next"
      primaryDisabled={!selected}
      onPrimary={onComplete}
      footer={selected ? "Decision locked in" : "Choose one response"}
    >
      <p className="text-base leading-relaxed text-white/85">{content.story}</p>

      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
          What would you do?
        </p>
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
    </ImmersiveLessonShell>
  );
}
