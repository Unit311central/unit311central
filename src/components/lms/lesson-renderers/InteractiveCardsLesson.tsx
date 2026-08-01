"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import ImmersiveLessonShell from "@/components/lms/ImmersiveLessonShell";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type CardsContent = Extract<LessonContent, { type: "interactive_cards" }>;

type Props = {
  lesson: LmsLesson;
  content: CardsContent;
  onComplete: () => void;
};

export default function InteractiveCardsLesson({ lesson, content, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const card = content.cards[index];
  const revealedCount = Object.values(flipped).filter(Boolean).length;
  const allRevealed = content.cards.length > 0 && revealedCount >= content.cards.length;
  const isLast = index >= content.cards.length - 1;

  if (!card) {
    return (
      <ImmersiveLessonShell
        eyebrow="Interactive cards"
        title={lesson.title}
        onPrimary={onComplete}
        primaryLabel="Next"
      >
        <p className="text-sm text-white/55">No cards in this lesson.</p>
      </ImmersiveLessonShell>
    );
  }

  const isFlipped = Boolean(flipped[card.id]);

  return (
    <ImmersiveLessonShell
      eyebrow="Interactive cards"
      title={lesson.title}
      subtitle={content.intro}
      sceneText={`${lesson.title} ${card.title} ${card.body}`}
      footer={`Card ${index + 1} of ${content.cards.length} · Revealed ${revealedCount}/${content.cards.length}`}
      primaryLabel={isLast ? (allRevealed ? "Next" : "Reveal all cards first") : "Next card"}
      primaryDisabled={isLast ? !allRevealed : !isFlipped}
      onPrimary={() => {
        if (!isLast) {
          setIndex((i) => i + 1);
          return;
        }
        if (allRevealed) onComplete();
      }}
    >
      <div className="mb-4 flex gap-1.5">
        {content.cards.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Card ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2.5 w-2.5 rounded-full ${
              i === index
                ? "bg-emerald-400"
                : flipped[c.id]
                  ? "bg-emerald-500/50"
                  : "bg-white/20"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.button
          key={card.id}
          type="button"
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -36 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          onClick={() => setFlipped((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
          className="group relative h-64 w-full text-left [perspective:1200px]"
        >
          <motion.div
            className="relative h-full w-full rounded-2xl border border-white/10 [transform-style:preserve-3d]"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0d1b2e] to-[#0a1422] p-5 [backface-visibility:hidden]">
              <div>
                {card.icon ? (
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-sm text-emerald-200">
                    {card.icon}
                  </span>
                ) : null}
                <h3 className="text-2xl font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm text-white/60">{card.summary}</p>
              </div>
              <p className="text-[11px] uppercase tracking-wide text-emerald-300/70">
                Tap to reveal
              </p>
            </div>
            <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <p className="text-base leading-relaxed text-white/90">{card.body}</p>
              <p className="text-[11px] uppercase tracking-wide text-white/40">
                Tap to flip back
              </p>
            </div>
          </motion.div>
        </motion.button>
      </AnimatePresence>
    </ImmersiveLessonShell>
  );
}
