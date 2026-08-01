"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
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
      <ImmersiveLessonShell
        eyebrow="Branching path"
        title={lesson.title}
        onPrimary={onComplete}
        primaryLabel="Next"
      >
        <p className="text-sm text-white/55">Branching path is incomplete.</p>
      </ImmersiveLessonShell>
    );
  }

  const outcomeClass =
    node.outcome === "good"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
      : node.outcome === "bad"
        ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
        : "border-white/10 bg-white/[0.03] text-white/80";

  return (
    <ImmersiveLessonShell
      eyebrow="Branching path"
      title={lesson.title}
      sceneText={`${lesson.title} ${node.text} speak up report`}
      primaryLabel={node.end ? "Next" : "Choose a path"}
      primaryDisabled={!node.end}
      onPrimary={node.end ? onComplete : undefined}
      footer={
        node.end ? (
          <button
            type="button"
            onClick={() => setNodeId(content.startId)}
            className="text-xs text-white/55 underline-offset-2 hover:underline"
          >
            Restart path
          </button>
        ) : (
          "Select an option to continue the story"
        )
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={nodeId}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className={`rounded-2xl border p-5 ${outcomeClass}`}
        >
          <p className="text-base leading-relaxed">{node.text}</p>
        </motion.div>
      </AnimatePresence>

      {!node.end && node.choices?.length ? (
        <div className="mt-4 space-y-2">
          {node.choices.map((choice, i) => (
            <motion.button
              key={`${choice.to}-${choice.label}`}
              type="button"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => setNodeId(choice.to)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-white/80 transition hover:border-emerald-400/40 hover:bg-white/[0.05]"
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-[11px] font-semibold text-white/50">
                {String.fromCharCode(65 + i)}
              </span>
              {choice.label}
            </motion.button>
          ))}
        </div>
      ) : null}
    </ImmersiveLessonShell>
  );
}
