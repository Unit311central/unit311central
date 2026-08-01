"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { sceneForQuestion, type QuestionScene } from "@/lib/lms/question-scenes";
import { cn } from "@/lib/utils";

export type CarouselQuestion = {
  id: string;
  stem: string;
  choices: { id: string; label: string }[];
  imageUrl?: string | null;
  sceneLabel?: string | null;
  /** When set, reveal correctness after answer (quiz / knowledge style). */
  correctId?: string;
  explanation?: string;
};

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  questions: CarouselQuestion[];
  locked?: boolean;
  submitting?: boolean;
  resultBanner?: React.ReactNode;
  submitLabel?: string;
  onSubmit: (answers: Record<string, string>) => void;
  onRetry?: () => void;
};

export default function QuestionCarousel({
  eyebrow,
  title,
  subtitle,
  questions,
  locked = false,
  submitting = false,
  resultBanner,
  submitLabel = "Submit assessment",
  onSubmit,
  onRetry,
}: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  const current = questions[index] ?? null;
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]).length,
    [answers, questions],
  );
  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);
  const isLast = index >= questions.length - 1;
  const currentAnswered = current ? Boolean(answers[current.id]) : false;
  const currentConfirmed = current ? Boolean(confirmed[current.id]) : false;
  const revealMode = Boolean(current?.correctId);

  const scene: QuestionScene | null = current
    ? sceneForQuestion({
        stem: current.stem,
        id: current.id,
        imageUrl: current.imageUrl,
        sceneLabel: current.sceneLabel,
      })
    : null;

  function selectChoice(choiceId: string) {
    if (!current || locked) return;
    setAnswers((prev) => ({ ...prev, [current.id]: choiceId }));
    if (revealMode) {
      setConfirmed((prev) => ({ ...prev, [current.id]: true }));
    }
  }

  function go(delta: number) {
    const next = index + delta;
    if (next < 0 || next >= questions.length) return;
    setDirection(delta);
    setIndex(next);
  }

  function handlePrimary() {
    if (!current) return;
    if (!currentAnswered) return;

    if (revealMode && !currentConfirmed) {
      setConfirmed((prev) => ({ ...prev, [current.id]: true }));
      return;
    }

    if (!isLast) {
      go(1);
      return;
    }

    if (allAnswered && !locked) onSubmit(answers);
  }

  const primaryLabel = (() => {
    if (submitting) return "Submitting…";
    if (!currentAnswered) return "Select an answer";
    if (revealMode && !currentConfirmed) return "Check answer";
    if (!isLast) return "Next question";
    if (locked) return "Finished";
    return submitLabel;
  })();

  return (
    <div className="relative mx-auto flex h-full min-h-[calc(100vh-9.5rem)] w-full max-w-5xl flex-col">
      <header className="mb-4 shrink-0">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-white/55">{subtitle}</p> : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
              Question
            </p>
            <p className="text-lg font-semibold tabular-nums text-emerald-200">
              {questions.length ? index + 1 : 0}
              <span className="text-white/35"> / {questions.length}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300"
            initial={false}
            animate={{
              width: `${questions.length ? ((index + 1) / questions.length) * 100 : 0}%`,
            }}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
          />
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {questions.map((q, i) => {
            const done = Boolean(answers[q.id]);
            const active = i === index;
            return (
              <button
                key={q.id}
                type="button"
                aria-label={`Go to question ${i + 1}`}
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full transition",
                  active
                    ? "bg-emerald-400"
                    : done
                      ? "bg-emerald-500/50"
                      : "bg-white/20 hover:bg-white/35",
                )}
              />
            );
          })}
        </div>
      </header>

      {resultBanner}

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a1628] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)]">
        <AnimatePresence mode="wait" custom={direction}>
          {current && scene ? (
            <motion.div
              key={current.id}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 72 : -72 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -72 : 72 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className="absolute inset-0 flex flex-col lg:flex-row"
            >
              <div className="relative h-44 shrink-0 overflow-hidden sm:h-56 lg:h-auto lg:w-[42%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scene.imageUrl}
                  alt={scene.label}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/35 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#0a1628]/20 lg:to-[#0a1628]" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
                    {scene.label}
                  </p>
                  <p className="mt-1 text-sm text-white/85">{scene.caption}</p>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  Answered {answeredCount} of {questions.length}
                </p>
                <h3 className="mt-3 text-xl font-semibold leading-snug text-white sm:text-2xl">
                  {current.stem}
                </h3>

                <div className="mt-6 space-y-3">
                  {current.choices.map((choice, choiceIndex) => {
                    const selected = answers[current.id] === choice.id;
                    const showReveal = revealMode && currentConfirmed;
                    const isCorrect = choice.id === current.correctId;
                    const showWrong = showReveal && selected && !isCorrect;
                    const showRight = showReveal && isCorrect;

                    return (
                      <motion.button
                        key={choice.id}
                        type="button"
                        disabled={locked || (revealMode && currentConfirmed)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * choiceIndex }}
                        onClick={() => selectChoice(choice.id)}
                        className={cn(
                          "group flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
                          showRight
                            ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-50"
                            : showWrong
                              ? "border-rose-400/45 bg-rose-500/15 text-rose-50"
                              : selected
                                ? "border-emerald-400/45 bg-emerald-500/10 text-white shadow-[0_0_0_1px_rgba(52,211,153,0.15)]"
                                : "border-white/10 bg-white/[0.03] text-white/80 hover:border-emerald-400/25 hover:bg-white/[0.05]",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                            selected
                              ? "border-emerald-300/50 bg-emerald-500/20 text-emerald-100"
                              : "border-white/15 bg-black/20 text-white/50",
                          )}
                        >
                          {String.fromCharCode(65 + choiceIndex)}
                        </span>
                        <span className="text-sm leading-relaxed sm:text-[15px]">
                          {choice.label}
                        </span>
                        {showRight ? (
                          <CheckCircle2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        ) : null}
                      </motion.button>
                    );
                  })}
                </div>

                {revealMode && currentConfirmed && current.explanation ? (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-white/70"
                  >
                    {current.explanation}
                  </motion.p>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => go(-1)}
                    className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/70 hover:bg-white/[0.04] disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>

                  <div className="flex flex-wrap gap-2">
                    {locked && onRetry ? (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.05]"
                      >
                        Try again
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={
                        !currentAnswered ||
                        submitting ||
                        (isLast && (!allAnswered || locked))
                      }
                      onClick={handlePrimary}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {primaryLabel}
                      {!isLast && currentAnswered ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : null}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
