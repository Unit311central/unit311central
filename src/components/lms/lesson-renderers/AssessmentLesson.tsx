"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { LmsLesson } from "@/lib/lms/types";

type DrawnQuestion = {
  id: string;
  questionType: string;
  stem: string;
  choices: { id: string; label: string }[];
  difficulty?: string;
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiPassMark, setApiPassMark] = useState(contentPass);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(
    null,
  );

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]).length,
    [answers, questions],
  );

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    try {
      const res = await fetch("/api/lms/assessment/draw", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug }),
      });
      const data = (await res.json()) as DrawResponse;
      if (!res.ok) throw new Error(data.error || "Failed to draw assessment.");
      setQuestions(data.questions ?? []);
      if (typeof data.passMark === "number") setApiPassMark(data.passMark);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assessment.");
    } finally {
      setLoading(false);
    }
  }, [courseSlug]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  async function submit() {
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

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Final assessment
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
        <p className="mt-2 text-sm text-white/55">
          Pass mark {apiPassMark}% · Answered {answeredCount}/{questions.length}
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-white/55">Drawing questions…</p>
      ) : error ? (
        <div className="space-y-3">
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
      ) : (
        <>
          <div className="sticky top-0 z-10 mb-2 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-[#07111f]/95 px-4 py-2 backdrop-blur">
            <span className="text-xs uppercase tracking-wide text-white/45">Progress</span>
            <span className="text-lg font-semibold tabular-nums text-emerald-300">
              {answeredCount}/{questions.length}
            </span>
          </div>

          {result ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                result.passed
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                  : "border-amber-400/40 bg-amber-500/10 text-amber-100"
              }`}
            >
              Live score: <strong>{result.score}%</strong> —{" "}
              {result.passed ? "Passed" : `Need ${apiPassMark}% to pass`}
            </div>
          ) : null}

          <div className="space-y-4">
            {questions.map((q, index) => (
              <fieldset
                key={q.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <legend className="px-1 text-sm font-semibold text-white">
                  {index + 1}. {q.stem}
                </legend>
                <div className="mt-3 space-y-2">
                  {q.choices.map((choice) => {
                    const selected = answers[q.id] === choice.id;
                    return (
                      <label
                        key={choice.id}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                          selected
                            ? "border-emerald-400/40 bg-emerald-500/10 text-white"
                            : "border-white/10 bg-black/20 text-white/75"
                        }`}
                      >
                        <input
                          type="radio"
                          className="mt-1"
                          name={q.id}
                          disabled={Boolean(result?.passed)}
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
              </fieldset>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {!result?.passed ? (
              <button
                type="button"
                disabled={!allAnswered || submitting}
                onClick={() => void submit()}
                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-40"
              >
                {submitting ? "Submitting…" : "Submit assessment"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onComplete(result)}
                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Finish course
              </button>
            )}
            {result && !result.passed ? (
              <button
                type="button"
                onClick={() => void loadQuestions()}
                className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white"
              >
                New draw
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
