"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type InfographicContent = Extract<LessonContent, { type: "infographic" }>;

type Props = {
  lesson: LmsLesson;
  content: InfographicContent;
  onComplete: () => void;
};

export default function InfographicLesson({ lesson, content, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const item = content.items[index];
  const isLast = index >= content.items.length - 1;

  if (!item) {
    return (
      <ImmersiveLessonShell
        eyebrow="Infographic"
        title={content.title || lesson.title}
        onPrimary={onComplete}
      >
        <p className="text-sm text-white/55">No items.</p>
      </ImmersiveLessonShell>
    );
  }

  return (
    <ImmersiveLessonShell
      eyebrow="Infographic"
      title={content.title || lesson.title}
      sceneText={`${lesson.title} ${item.label} ${item.body}`}
      footer={`Panel ${index + 1} of ${content.items.length}`}
      primaryLabel={isLast ? "Next" : "Next panel"}
      onPrimary={() => {
        if (isLast) onComplete();
        else setIndex((i) => i + 1);
      }}
    >
      <div className="mb-4 flex gap-1.5">
        {content.items.map((entry, i) => (
          <button
            key={entry.id}
            type="button"
            aria-label={`Panel ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full ${
              i === index ? "bg-emerald-400" : i < index ? "bg-emerald-500/50" : "bg-white/20"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-sm font-semibold text-emerald-200">
              {item.icon || String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-xl font-semibold text-white">{item.label}</h3>
          </div>
          <p className="text-base leading-relaxed text-white/75">{item.body}</p>
        </motion.div>
      </AnimatePresence>
    </ImmersiveLessonShell>
  );
}
