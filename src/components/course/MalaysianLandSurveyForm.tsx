"use client";

import { useState, type FormEvent } from "react";

import {
  COURSE_CHOICE_QUESTIONS,
  COURSE_COMMENT_MAX_LENGTH,
  COURSE_DUPLICATE_MESSAGE,
  COURSE_NAME_MAX_LENGTH,
  COURSE_QUESTION_5,
  type CourseChoiceQuestionId,
} from "@/lib/course/malaysian-land-survey";

type ChoiceState = Record<CourseChoiceQuestionId, string[]>;

const EMPTY_CHOICES: ChoiceState = {
  question1: [],
  question2: [],
  question3: [],
  question4: [],
};

export default function MalaysianLandSurveyForm() {
  const [participantName, setParticipantName] = useState("");
  const [choices, setChoices] = useState<ChoiceState>(EMPTY_CHOICES);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function toggle(questionId: CourseChoiceQuestionId, option: string) {
    setChoices((current) => {
      const selected = current[questionId];
      const next = selected.includes(option)
        ? selected.filter((entry) => entry !== option)
        : [...selected, option];
      return { ...current, [questionId]: next };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!participantName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/course/malaysian-land-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName,
          question1: choices.question1,
          question2: choices.question2,
          question3: choices.question3,
          question4: choices.question4,
          question5: comments,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 409) {
        setError(payload?.error || COURSE_DUPLICATE_MESSAGE);
        return;
      }
      if (!response.ok) {
        setError(payload?.error || "We could not submit your questionnaire. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("We could not submit your questionnaire. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a4d3a]">
            BCN Drone Center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Malaysian Land Surveying Course
          </h1>
          <p className="mt-3 text-base text-slate-700">Pre-course questionnaire</p>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
            Please answer the following questions to help us tailor the course to your professional
            experience. Your responses will help us make the presentations, demonstrations and
            practical exercises more relevant to your work.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            All questions are optional. You can answer as many or as few as you wish. Only your name
            is required.
          </p>
        </header>

        {submitted ? (
          <section className="rounded-2xl border border-emerald-200 bg-white px-6 py-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Thank you!</h2>
            <p className="mt-3 text-base text-slate-700">
              Your responses have been submitted successfully.
            </p>
          </section>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <label htmlFor="participant-name" className="block text-base font-semibold text-slate-950">
                Your name <span className="text-emerald-800">*</span>
              </label>
              <p className="mt-1 text-sm text-slate-500">Required</p>
              <input
                id="participant-name"
                name="participantName"
                type="text"
                required
                autoComplete="name"
                maxLength={COURSE_NAME_MAX_LENGTH}
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-slate-950 outline-none ring-[#1a4d3a] focus:border-[#1a4d3a] focus:ring-2"
              />
            </section>

            {COURSE_CHOICE_QUESTIONS.map((question) => (
              <fieldset
                key={question.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <legend className="text-base font-semibold text-slate-950">
                  Question {question.number}
                </legend>
                <p className="mt-2 text-base font-medium leading-6 text-slate-900">{question.title}</p>
                <p className="mt-1 text-sm text-slate-500">{question.hint}</p>
                <div className="mt-4 space-y-2">
                  {question.options.map((option) => {
                    const checked = choices[question.id].includes(option);
                    return (
                      <label
                        key={option}
                        className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 text-slate-800 hover:border-[#1a4d3a]/40"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-5 w-5 shrink-0 accent-[#1a4d3a]"
                          checked={checked}
                          onChange={() => toggle(question.id, option)}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <label htmlFor="question-5" className="block text-base font-semibold text-slate-950">
                Question {COURSE_QUESTION_5.number}
              </label>
              <p className="mt-2 text-base font-medium leading-6 text-slate-900">
                {COURSE_QUESTION_5.title}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {COURSE_QUESTION_5.hint} This question is optional.
              </p>
              <textarea
                id="question-5"
                name="question5"
                rows={6}
                maxLength={COURSE_COMMENT_MAX_LENGTH}
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                className="mt-4 w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-base leading-6 text-slate-950 outline-none ring-[#1a4d3a] focus:border-[#1a4d3a] focus:ring-2"
              />
              <p className="mt-2 text-right text-xs text-slate-500">
                {comments.length.toLocaleString("en-GB")} / {COURSE_COMMENT_MAX_LENGTH.toLocaleString("en-GB")}
              </p>
            </section>

            {error ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1a4d3a] px-5 py-3 text-base font-semibold text-white hover:bg-[#143d2e] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
