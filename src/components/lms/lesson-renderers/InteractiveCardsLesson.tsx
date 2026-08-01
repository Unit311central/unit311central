"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type CardsContent = Extract<LessonContent, { type: "interactive_cards" }>;

type Props = {
  lesson: LmsLesson;
  content: CardsContent;
  onComplete: () => void;
};

export default function InteractiveCardsLesson({ lesson, content, onComplete }: Props) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const revealedCount = Object.values(flipped).filter(Boolean).length;
  const allRevealed = content.cards.length > 0 && revealedCount >= content.cards.length;

  function toggle(id: string) {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Interactive cards
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
        {content.intro ? (
          <p className="mt-2 text-sm leading-relaxed text-white/60">{content.intro}</p>
        ) : null}
        <p className="mt-3 text-xs text-white/45">
          Reveal {revealedCount}/{content.cards.length} cards
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {content.cards.map((card) => {
          const isFlipped = Boolean(flipped[card.id]);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => toggle(card.id)}
              className="group relative h-52 text-left [perspective:1200px]"
            >
              <motion.div
                className="relative h-full w-full rounded-2xl border border-white/10 [transform-style:preserve-3d]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0d1b2e] to-[#0a1422] p-4 [backface-visibility:hidden]">
                  <div>
                    {card.icon ? (
                      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-sm text-emerald-200">
                        {card.icon}
                      </span>
                    ) : null}
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                    <p className="mt-2 text-sm text-white/55">{card.summary}</p>
                  </div>
                  <p className="text-[11px] uppercase tracking-wide text-emerald-300/70">
                    Click to reveal
                  </p>
                </div>
                <div className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key="body"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm leading-relaxed text-white/85"
                    >
                      {card.body}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-[11px] uppercase tracking-wide text-white/40">
                    Click to flip back
                  </p>
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onComplete}
        disabled={!allRevealed}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
