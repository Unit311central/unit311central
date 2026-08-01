"use client";

import { useMemo, useState } from "react";

import QuestionCarousel from "@/components/lms/QuestionCarousel";
import type { LessonContent, LmsLesson } from "@/lib/lms/types";
import { sceneForQuestion } from "@/lib/lms/question-scenes";

type QuizContent = Extract<LessonContent, { type: "quiz" }>;

type Props = {
  lesson: LmsLesson;
  content: QuizContent;
  onComplete: () => void;
};

export default function QuizLesson({ lesson, content, onComplete }: Props) {
  const passMark = content.passMark ?? 80;
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [carouselKey, setCarouselKey] = useState(0);

  const questions = useMemo(
    () =>
      (content.inlineQuestions ?? []).map((q) => {
        const scene = sceneForQuestion({ stem: q.stem, id: q.id });
        return {
          id: q.id,
          stem: q.stem,
          choices: q.choices,
          correctId: q.correctId,
          explanation: q.explanation,
          imageUrl: scene.imageUrl,
          sceneLabel: scene.label,
        };
      }),
    [content.inlineQuestions],
  );

  const passed = score >= passMark;

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
    <QuestionCarousel
      key={carouselKey}
      eyebrow="Module quiz"
      title={lesson.title}
      subtitle={`Swipe through each question · Pass mark ${passMark}%`}
      questions={questions}
      locked={submitted && passed}
      submitLabel="See score"
      onSubmit={(answers) => {
        let correct = 0;
        for (const q of questions) {
          if (answers[q.id] === q.correctId) correct += 1;
        }
        const nextScore = Math.round((correct / questions.length) * 100);
        setScore(nextScore);
        setSubmitted(true);
        if (nextScore >= passMark) onComplete();
      }}
      onRetry={
        submitted && !passed
          ? () => {
              setSubmitted(false);
              setScore(0);
              setCarouselKey((k) => k + 1);
            }
          : undefined
      }
      resultBanner={
        submitted ? (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              passed
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : "border-amber-400/40 bg-amber-500/10 text-amber-100"
            }`}
          >
            Score: <strong>{score}%</strong> — {passed ? "Passed" : "Below pass mark"}
            {passed ? (
              <button
                type="button"
                onClick={onComplete}
                className="ml-3 underline underline-offset-2"
              >
                Continue
              </button>
            ) : null}
          </div>
        ) : null
      }
    />
  );
}
