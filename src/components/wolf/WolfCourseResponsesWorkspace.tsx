"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { wolfCardClass, wolfEyebrowClass, wolfMetricLabelClass, wolfMetricValueClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import {
  COURSE_CHOICE_QUESTIONS,
  COURSE_QUESTION_5,
  formatCourseSubmittedAt,
  summarizeCourseResponses,
  type CourseQuestionSummary,
  type CourseSubmissionRecord,
} from "@/lib/course/malaysian-land-survey";
import type { WolfCourseResponseView } from "@/lib/wolf/course-response-views";

type LoadState = {
  submissions: CourseSubmissionRecord[];
  loading: boolean;
  error: string | null;
};

function useCourseResponses(): LoadState & { reload: () => void } {
  const [submissions, setSubmissions] = useState<CourseSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const response = await fetch("/api/wolf/course/malaysian-land-survey", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { submissions?: CourseSubmissionRecord[]; error?: string }
        | null;
      if (!response.ok) {
        if (!background) setError(payload?.error || "Course responses could not be loaded.");
        return;
      }
      setSubmissions(payload?.submissions ?? []);
      setError(null);
    } catch {
      if (!background) setError("Course responses could not be loaded.");
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void reload(false), 0);
    const timer = window.setInterval(() => void reload(true), 20000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [reload]);

  return { submissions, loading, error, reload: () => void reload(false) };
}

function QuestionChart({ summary }: { summary: CourseQuestionSummary }) {
  return (
    <section className={`${wolfCardClass} p-5`}>
      <p className={wolfEyebrowClass}>Question {summary.number}</p>
      <h2 className="mt-2 text-lg font-semibold text-white">{summary.title}</h2>
      <p className="mt-2 text-sm text-white/55">
        {summary.answered} answered · {summary.unanswered} unanswered
      </p>
      {summary.answered === 0 ? (
        <p className="mt-4 text-sm text-white/45">No participants have answered this question yet.</p>
      ) : (
        <>
          <p className="mt-3 text-xs leading-5 text-white/40">
            Participants could select more than one answer. Percentages use the {summary.answered}{" "}
            {summary.answered === 1 ? "person" : "people"} who answered this question.
          </p>
          <ul className="mt-4 space-y-3">
            {summary.options.map((option) => (
              <li key={option.label}>
                <div className="flex items-start justify-between gap-3 text-sm text-white/85">
                  <span className="leading-5">{option.label}</span>
                  <span className="shrink-0 tabular-nums text-white/60">
                    {option.count} · {option.percent}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${option.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function answerList(answers: string[] | null) {
  if (!answers?.length) {
    return <p className="text-sm italic text-white/40">Not answered</p>;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-white/85">
      {answers.map((answer) => (
        <li key={answer}>{answer}</li>
      ))}
    </ul>
  );
}

function Overview({ submissions }: { submissions: CourseSubmissionRecord[] }) {
  const summary = useMemo(() => summarizeCourseResponses(submissions), [submissions]);
  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className={`${wolfCardClass} p-5`}>
          <p className={wolfMetricLabelClass}>Total submissions</p>
          <p className={`mt-2 ${wolfMetricValueClass}`}>{summary.total}</p>
        </div>
        {summary.questions.map((question) => (
          <div key={question.id} className={`${wolfCardClass} p-5`}>
            <p className={wolfMetricLabelClass}>Question {question.number} answered</p>
            <p className={`mt-2 ${wolfMetricValueClass}`}>{question.answered}</p>
            <p className="mt-1 text-xs text-white/40">{question.unanswered} unanswered</p>
          </div>
        ))}
        <div className={`${wolfCardClass} p-5`}>
          <p className={wolfMetricLabelClass}>Additional comments</p>
          <p className={`mt-2 ${wolfMetricValueClass}`}>{summary.commentsProvided}</p>
          <p className="mt-1 text-xs text-white/40">{summary.commentsUnanswered} left blank</p>
          {summary.commentsProvided > 0 ? (
            <a
              href="?view=wolf-course-details&focus=comments"
              className="mt-3 inline-flex text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              View comments in Details
            </a>
          ) : null}
        </div>
      </section>
      {summary.questions.map((question) => (
        <QuestionChart key={question.id} summary={question} />
      ))}
      <section className={`${wolfCardClass} p-5`}>
        <p className={wolfEyebrowClass}>Question 5</p>
        <h2 className="mt-2 text-lg font-semibold text-white">{COURSE_QUESTION_5.title}</h2>
        <p className="mt-3 text-sm text-white/70">
          {summary.commentsProvided}{" "}
          {summary.commentsProvided === 1 ? "participant left" : "participants left"} additional
          comments. Free-text comments are listed in Details, not in these charts.
        </p>
      </section>
    </div>
  );
}

function Details({ submissions }: { submissions: CourseSubmissionRecord[] }) {
  const searchParams = useSearchParams();
  const focusComments = searchParams.get("focus") === "comments";
  const [showAll, setShowAll] = useState(false);
  const showCommentsOnly = focusComments && !showAll;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = showCommentsOnly
    ? submissions.filter((submission) => Boolean(submission.question5))
    : submissions;
  const selected = submissions.find((submission) => submission.id === selectedId) ?? null;

  if (selected) {
    return (
      <section className={`${wolfCardClass} p-5 sm:p-6`}>
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
        >
          Back to all responses
        </button>
        <h2 className="mt-4 text-2xl font-semibold text-white">{selected.participantName}</h2>
        <p className="mt-1 text-sm text-white/50">
          Submitted {formatCourseSubmittedAt(selected.submittedAt)}
        </p>
        <div className="mt-6 space-y-5">
          {COURSE_CHOICE_QUESTIONS.map((question) => (
            <div key={question.id}>
              <p className={wolfEyebrowClass}>Question {question.number}</p>
              <p className="mt-1 text-sm font-medium text-white">{question.title}</p>
              <div className="mt-2">{answerList(selected[question.id])}</div>
            </div>
          ))}
          <div>
            <p className={wolfEyebrowClass}>Question {COURSE_QUESTION_5.number}</p>
            <p className="mt-1 text-sm font-medium text-white">{COURSE_QUESTION_5.title}</p>
            {selected.question5 ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/85">
                {selected.question5}
              </p>
            ) : (
              <p className="mt-2 text-sm italic text-white/40">Not answered</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${wolfCardClass} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Submissions</h2>
          <p className="mt-1 text-sm text-white/50">
            {showCommentsOnly
              ? "Showing responses that include additional comments."
              : "Select a name to open the full questionnaire."}
          </p>
        </div>
        {showCommentsOnly ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            Show all responses
          </button>
        ) : null}
      </div>
      {visible.length === 0 ? (
        <p className="px-5 py-8 text-sm text-white/50">
          {submissions.length === 0
            ? "No questionnaires have been submitted yet."
            : "No additional comments have been submitted yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-white/40">
              <tr>
                <th className="px-5 py-3 font-medium">Participant name</th>
                <th className="px-5 py-3 font-medium">Submission date and time</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((submission) => (
                <tr key={submission.id} className="border-t border-white/10">
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(submission.id)}
                      className="font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      {submission.participantName}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-white/70">
                    {formatCourseSubmittedAt(submission.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function WolfCourseResponsesWorkspace({ view }: { view: WolfCourseResponseView }) {
  const { submissions, loading, error, reload } = useCourseResponses();
  const title = view === "wolf-course-overview" ? "Overview" : "Details";

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={wolfEyebrowClass}>Tools · Course responses</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            Malaysian Land Surveying Course pre-course questionnaire. Counts come from stored
            submissions.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:border-white/30 hover:text-white"
        >
          Refresh
        </button>
      </header>
      {loading ? <p className="text-sm text-white/50">Loading responses…</p> : null}
      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {!loading && !error && view === "wolf-course-overview" ? <Overview submissions={submissions} /> : null}
      {!loading && !error && view === "wolf-course-details" ? <Details submissions={submissions} /> : null}
    </div>
  );
}
