"use client";

import { useMemo, useState } from "react";

import type { LessonContent, LmsLesson } from "@/lib/lms/types";

type QuizContent = Extract<LessonContent, { type: "quiz" }>;

type Props = {
  lesson: LmsLesson;
  content: QuizContent;
  onComplete: () => void;
};

export default function QuizLesson({ lesson, content, onComplete }: Props) {
  const questions = content.inlineQuestions ?? [];
  const passMark = content.passMark ?? 80;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (questions.length === 0) return 0;
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctId) correct += 1;
    }
    return Math.round((correct / questions.length) * 100);
  }, [answers, questions]);

  const passed = score >= passMark;
  const allAnswered = questions.every((q) => answers[q.id]);

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8 text-center">
        <h2 className="text-2xl font-semibold text-white">{lesson.title}</h2>
        <p className="text-sm text-white/55">
          This quiz has no inline questions. Continue to proceed.
        </p>
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

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Module quiz
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
        <p className="mt-2 text-sm text-white/55">
          Pass mark: {passMark}% · {questions.length} questions
        </p>
      </header>

      <div className="space-y-5">
        {questions.map((q, index) => (
          <fieldset key={q.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <legend className="px-1 text-sm font-semibold text-white">
              {index + 1}. {q.stem}
            </legend>
            <div className="mt-3 space-y-2">
              {q.choices.map((choice) => {
                const selected = answers[q.id] === choice.id;
                const showResult = submitted;
                const isCorrect = choice.id === q.correctId;
                return (
                  <label
                    key={choice.id}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      showResult && isCorrect
                        ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
                        : showResult && selected && !isCorrect
                          ? "border-rose-400/50 bg-rose-500/15 text-rose-100"
                          : selected
                            ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                            : "border-white/10 bg-black/20 text-white/75"
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      name={q.id}
                      disabled={submitted}
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: choice.id }))
                      }
                    />
                    <span>{choice.label}</span>
                  </label>
                );
              })}
            </div>
            {submitted && q.explanation ? (
              <p className="mt-3 text-xs text-white/55">{q.explanation}</p>
            ) : null}
          </fieldset>
        ))}
      </div>

      {!submitted ? (
        <button
          type="button"
          disabled={!allAnswered}
          onClick={() => setSubmitted(true)}
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-40"
        >
          Submit quiz
        </button>
      ) : (
        <div className="space-y-3">
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              passed
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border-amber-400/40 bg-amber-500/10 text-amber-100"
            }`}
          >
            Score: <strong>{score}%</strong> — {passed ? "Passed" : "Below pass mark"}
          </div>
          <div className="flex flex-wrap gap-3">
            {!passed ? (
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.05]"
              >
                Retry
              </button>
            ) : null}
            <button
              type="button"
              onClick={onComplete}
              disabled={!passed}
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
