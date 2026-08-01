"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type BranchingContent = Extract<LessonContent, { type: "branching" }>;

type Props = {
  lesson: LmsLesson;
  content: BranchingContent;
  onComplete: () => void;
};

export default function BranchingLesson({ lesson, content, onComplete }: Props) {
  const [nodeId, setNodeId] = useState(content.startId);
  const node = content.nodes[nodeId];

  if (!node) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8 text-center">
        <h2 className="text-2xl font-semibold text-white">{lesson.title}</h2>
        <p className="text-sm text-white/55">Branching path is incomplete.</p>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Continue
        </button>
      </div>
    );
  }

  const outcomeClass =
    node.outcome === "good"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
      : node.outcome === "bad"
        ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
        : "border-white/10 bg-white/[0.03] text-white/80";

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Branching path
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={nodeId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`rounded-2xl border p-5 ${outcomeClass}`}
        >
          <p className="text-base leading-relaxed">{node.text}</p>
        </motion.div>
      </AnimatePresence>

      {!node.end && node.choices?.length ? (
        <div className="space-y-2">
          {node.choices.map((choice) => (
            <button
              key={`${choice.to}-${choice.label}`}
              type="button"
              onClick={() => setNodeId(choice.to)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/80 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setNodeId(content.startId)}
            className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.05]"
          >
            Restart path
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
