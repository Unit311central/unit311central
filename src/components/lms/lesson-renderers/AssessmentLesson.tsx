"use client";

import { useCallback, useEffect, useState } from "react";

import QuestionCarousel from "@/components/lms/QuestionCarousel";
import type { LmsLesson } from "@/lib/lms/types";
import { sceneForQuestion } from "@/lib/lms/question-scenes";

type DrawnQuestion = {
  id: string;
  questionType: string;
  stem: string;
  choices: { id: string; label: string }[];
  difficulty?: string;
  imageUrl?: string | null;
  sceneLabel?: string | null;
};

type Props = {
  lesson: LmsLesson;
  courseSlug: string;
  enrolmentId: string;
  passMark?: number;
  onComplete: (result: { score: number; passed: boolean }) => void;
};

type DrawResponse = {
  questions?: DrawnQuestion[];
  passMark?: number;
  enrolmentId?: string;
  error?: string;
};

type SubmitResponse = {
  score?: number;
  passed?: boolean;
  attemptId?: string;
  passMark?: number;
  error?: string;
};

export default function AssessmentLesson({
  lesson,
  courseSlug,
  enrolmentId,
  passMark = 80,
  onComplete,
}: Props) {
  const contentPass =
    lesson.content.type === "assessment" ? lesson.content.passMark : passMark;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DrawnQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [apiPassMark, setApiPassMark] = useState(contentPass);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(
    null,
  );
  const [carouselKey, setCarouselKey] = useState(0);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/lms/assessment/draw", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug }),
      });
      const data = (await res.json()) as DrawResponse;
      if (!res.ok) throw new Error(data.error || "Failed to draw assessment.");
      const drawn = (data.questions ?? []).map((q) => {
        const scene = sceneForQuestion({
          stem: q.stem,
          id: q.id,
          imageUrl: q.imageUrl,
          sceneLabel: q.sceneLabel,
        });
        return {
          ...q,
          imageUrl: scene.imageUrl,
          sceneLabel: scene.label,
        };
      });
      setQuestions(drawn);
      if (typeof data.passMark === "number") setApiPassMark(data.passMark);
      setCarouselKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assessment.");
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  async function submit(answers: Record<string, string>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/lms/assessment/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          enrolmentId,
          questionIds: questions.map((q) => q.id),
          answers,
        }),
      });
      const data = (await res.json()) as SubmitResponse;
      if (!res.ok) throw new Error(data.error || "Submit failed.");
      const score = data.score ?? 0;
      const threshold = data.passMark ?? apiPassMark;
      const passed = Boolean(data.passed ?? score >= threshold);
      setResult({ score, passed });
      if (passed) onComplete({ score, passed });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/55">
        Preparing your assessment…
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-3 py-10 text-center">
        <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
        <button
          type="button"
          onClick={() => void loadQuestions()}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white"
        >
          Retry draw
        </button>
      </div>
    );
  }

  return (
    <div className="h-full">
      {error ? (
        <p className="mb-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      <QuestionCarousel
        key={carouselKey}
        eyebrow="Final assessment"
        title={lesson.title}
        subtitle={`One question at a time · Pass mark ${apiPassMark}%`}
        questions={questions}
        locked={Boolean(result?.passed)}
        submitting={submitting}
        submitLabel="Submit assessment"
        onSubmit={(answers) => void submit(answers)}
        onRetry={
          result && !result.passed
            ? () => {
                void loadQuestions();
              }
            : undefined
        }
        resultBanner={
          result ? (
            <div
              className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                result.passed
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                  : "border-amber-400/40 bg-amber-500/10 text-amber-100"
              }`}
            >
              Score: <strong>{result.score}%</strong> —{" "}
              {result.passed ? "Passed" : `Need ${apiPassMark}% to pass`}
              {result.passed ? (
                <button
                  type="button"
                  onClick={() => onComplete(result)}
                  className="ml-3 underline underline-offset-2"
                >
                  Finish course
                </button>
              ) : null}
            </div>
          ) : null
        }
      />
    </div>
  );
}
