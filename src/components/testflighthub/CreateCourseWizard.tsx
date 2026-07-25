"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  TQMS_COURSE_STATUSES,
  type TqmsCourse,
  type TqmsCoursePage,
  type TqmsCourseQuestion,
  type TqmsCourseStatus,
} from "@/lib/tqms-data";
import { cn } from "@/lib/utils";
import {
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

const STEPS = ["Details", "Pages", "Questions", "Preview"] as const;

const CATEGORIES = [
  "Operations",
  "Safety",
  "Compliance",
  "Engineering",
  "HR",
  "Finance",
  "Technology",
  "Leadership",
] as const;

type CreateCourseWizardProps = {
  suggestedCode: string;
  onClose: () => void;
  onSubmit: (course: Omit<TqmsCourse, "id">) => void;
};

function blankPage(index: number): TqmsCoursePage {
  return {
    id: `page-${Date.now()}-${index}`,
    title: `Page ${index + 1}`,
    body: "",
    imageName: null,
    imageDataUrl: null,
  };
}

function blankQuestion(index: number): TqmsCourseQuestion {
  return {
    id: `q-${Date.now()}-${index}`,
    prompt: "",
    answers: ["", "", "", ""],
    correctIndex: 0,
    pageId: null,
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className={tqmsLabelClass()}>{children}</span>;
}

export default function CreateCourseWizard({
  suggestedCode,
  onClose,
  onSubmit,
}: CreateCourseWizardProps) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState(suggestedCode);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Operations");
  const [owner, setOwner] = useState("People Ops");
  const [durationHours, setDurationHours] = useState(2);
  const [mandatory, setMandatory] = useState(false);
  const [status, setStatus] = useState<TqmsCourseStatus>("Draft");
  const [description, setDescription] = useState("");

  const [pages, setPages] = useState<TqmsCoursePage[]>([blankPage(0)]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [questions, setQuestions] = useState<TqmsCourseQuestion[]>([blankQuestion(0)]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const activePage = pages[activePageIndex] ?? pages[0];

  const previewSlides = useMemo(() => {
    const content = pages.map((page, index) => ({
      kind: "page" as const,
      key: page.id,
      label: `Page ${index + 1}`,
      page,
    }));
    const quiz = questions
      .filter((q) => q.prompt.trim())
      .map((question, index) => ({
        kind: "question" as const,
        key: question.id,
        label: `Question ${index + 1}`,
        question,
      }));
    return [...content, ...quiz];
  }, [pages, questions]);

  useEffect(() => {
    setPreviewIndex(0);
  }, [step]);

  function updatePage(id: string, patch: Partial<TqmsCoursePage>) {
    setPages((current) => current.map((page) => (page.id === id ? { ...page, ...patch } : page)));
  }

  function updateQuestion(id: string, patch: Partial<TqmsCourseQuestion>) {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    );
  }

  function handleImage(file: File | undefined) {
    if (!activePage) return;
    if (!file) {
      updatePage(activePage.id, { imageName: null, imageDataUrl: null });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updatePage(activePage.id, {
        imageName: file.name,
        imageDataUrl: typeof reader.result === "string" ? reader.result : null,
      });
    };
    reader.readAsDataURL(file);
  }

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (!title.trim()) return "Course title is required.";
      if (!code.trim()) return "Course code is required.";
      return null;
    }
    if (index === 1) {
      if (pages.length === 0) return "Add at least one page.";
      if (pages.some((page) => !page.title.trim())) return "Every page needs a title.";
      if (pages.every((page) => !page.body.trim() && !page.imageDataUrl)) {
        return "Add content or an image on at least one page.";
      }
      return null;
    }
    if (index === 2) {
      const filled = questions.filter((q) => q.prompt.trim());
      if (filled.length === 0) return "Add at least one question.";
      for (const question of filled) {
        const answers = question.answers.map((a) => a.trim()).filter(Boolean);
        if (answers.length < 2) return "Each question needs at least two answers.";
        if (question.correctIndex < 0 || question.correctIndex >= question.answers.length) {
          return "Mark a correct answer for each question.";
        }
        if (!question.answers[question.correctIndex]?.trim()) {
          return "The correct answer option cannot be blank.";
        }
      }
      return null;
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  }

  function handlePublish() {
    for (let index = 0; index < STEPS.length - 1; index += 1) {
      const message = validateStep(index);
      if (message) {
        setError(message);
        setStep(index);
        return;
      }
    }
    const cleanedQuestions = questions
      .filter((q) => q.prompt.trim())
      .map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        answers: q.answers.map((a) => a.trim()),
      }));

    onSubmit({
      code: code.trim(),
      title: title.trim(),
      category,
      mandatory,
      durationHours: Math.max(0.5, Number(durationHours) || 1),
      status,
      owner: owner.trim() || "People Ops",
      description: description.trim(),
      pages: pages.map((page, index) => ({
        ...page,
        title: page.title.trim() || `Page ${index + 1}`,
        body: page.body.trim(),
      })),
      questions: cleanedQuestions,
    });
  }

  const previewSlide = previewSlides[previewIndex] ?? null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b1524] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
              Create course
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {STEPS[step]} · Step {step + 1} of {STEPS.length}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/50 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (index < step) {
                  setError(null);
                  setStep(index);
                }
              }}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                index === step
                  ? "bg-sky-500/20 text-sky-200"
                  : index < step
                    ? "bg-white/[0.05] text-white/70 hover:text-white"
                    : "bg-white/[0.03] text-white/35",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {error ? (
            <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          {step === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <FieldLabel>Course title</FieldLabel>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Site Safety Induction"
                  className={tqmsInputClass()}
                />
              </label>
              <label>
                <FieldLabel>Course code</FieldLabel>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className={cn(tqmsInputClass(), "font-mono")}
                />
              </label>
              <label>
                <FieldLabel>Category</FieldLabel>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as (typeof CATEGORIES)[number])
                  }
                  className={tqmsInputClass()}
                >
                  {CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <FieldLabel>Owner</FieldLabel>
                <input
                  value={owner}
                  onChange={(event) => setOwner(event.target.value)}
                  className={tqmsInputClass()}
                />
              </label>
              <label>
                <FieldLabel>Duration (hours)</FieldLabel>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={durationHours}
                  onChange={(event) => setDurationHours(Number(event.target.value))}
                  className={tqmsInputClass()}
                />
              </label>
              <label>
                <FieldLabel>Publish status</FieldLabel>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TqmsCourseStatus)}
                  className={tqmsInputClass()}
                >
                  {TQMS_COURSE_STATUSES.filter((option) => option !== "Archived").map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={mandatory}
                  onChange={(event) => setMandatory(event.target.checked)}
                  className="h-4 w-4 accent-sky-400"
                />
                <span className="text-sm text-white/80">Mandatory course</span>
              </label>
              <label className="sm:col-span-2">
                <FieldLabel>Description</FieldLabel>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What learners will cover…"
                  className={cn(tqmsInputClass(), "resize-none")}
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Pages
                  </p>
                  <button
                    type="button"
                    className={tqmsSecondaryButtonClass()}
                    onClick={() => {
                      const next = blankPage(pages.length);
                      setPages((current) => [...current, next]);
                      setActivePageIndex(pages.length);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
                <ul className="space-y-1">
                  {pages.map((page, index) => (
                    <li key={page.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActivePageIndex(index)}
                        className={cn(
                          "min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                          index === activePageIndex
                            ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                            : "border-white/10 bg-white/[0.03] text-white/65 hover:text-white",
                        )}
                      >
                        <span className="block truncate font-medium">
                          {page.title || `Page ${index + 1}`}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {index + 1}/{pages.length}
                          {index < pages.length - 1 ? " · Next →" : " · End"}
                        </span>
                      </button>
                      {pages.length > 1 ? (
                        <button
                          type="button"
                          aria-label="Remove page"
                          className="rounded-lg border border-white/10 p-2 text-white/40 hover:text-rose-200"
                          onClick={() => {
                            setPages((current) => current.filter((row) => row.id !== page.id));
                            setActivePageIndex((current) => Math.max(0, Math.min(current, pages.length - 2)));
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>

              {activePage ? (
                <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <label>
                    <FieldLabel>Page title</FieldLabel>
                    <input
                      value={activePage.title}
                      onChange={(event) => updatePage(activePage.id, { title: event.target.value })}
                      className={tqmsInputClass()}
                    />
                  </label>
                  <label>
                    <FieldLabel>Page content</FieldLabel>
                    <textarea
                      rows={8}
                      value={activePage.body}
                      onChange={(event) => updatePage(activePage.id, { body: event.target.value })}
                      placeholder="Write the lesson content for this page…"
                      className={cn(tqmsInputClass(), "resize-none")}
                    />
                  </label>
                  <div>
                    <FieldLabel>Image</FieldLabel>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleImage(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-[#0a1422]/60 px-4 py-6 text-center hover:border-sky-400/40"
                    >
                      {activePage.imageDataUrl ? (
                        <img
                          src={activePage.imageDataUrl}
                          alt={activePage.imageName ?? "Page image"}
                          className="h-36 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <ImagePlus className="h-7 w-7 text-white/35" />
                      )}
                      <span className="text-sm text-white/70">
                        {activePage.imageName ?? "Click to upload an image"}
                      </span>
                    </button>
                    {activePage.imageName ? (
                      <button
                        type="button"
                        className="mt-2 text-xs text-white/45 underline-offset-2 hover:underline"
                        onClick={() => {
                          updatePage(activePage.id, { imageName: null, imageDataUrl: null });
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-white/40">
                    Learners advance with Next from page {activePageIndex + 1}
                    {activePageIndex < pages.length - 1
                      ? ` to “${pages[activePageIndex + 1]?.title || `Page ${activePageIndex + 2}`}”.`
                      : " into the quiz."}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-white/55">
                  Add quiz questions and mark the correct answer for each.
                </p>
                <button
                  type="button"
                  className={tqmsSecondaryButtonClass()}
                  onClick={() => setQuestions((current) => [...current, blankQuestion(current.length)])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add question
                </button>
              </div>
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
                      Question {index + 1}
                    </p>
                    {questions.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs text-white/40 hover:text-rose-200"
                        onClick={() =>
                          setQuestions((current) => current.filter((row) => row.id !== question.id))
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <label>
                    <FieldLabel>Question</FieldLabel>
                    <textarea
                      rows={2}
                      value={question.prompt}
                      onChange={(event) =>
                        updateQuestion(question.id, { prompt: event.target.value })
                      }
                      placeholder="Ask something about the course content…"
                      className={cn(tqmsInputClass(), "resize-none")}
                    />
                  </label>
                  <label>
                    <FieldLabel>Linked page (optional)</FieldLabel>
                    <select
                      value={question.pageId ?? ""}
                      onChange={(event) =>
                        updateQuestion(question.id, {
                          pageId: event.target.value || null,
                        })
                      }
                      className={tqmsInputClass()}
                    >
                      <option value="">Whole course</option>
                      {pages.map((page, pageIndex) => (
                        <option key={page.id} value={page.id}>
                          {page.title || `Page ${pageIndex + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="space-y-2">
                    <FieldLabel>Answers</FieldLabel>
                    {question.answers.map((answer, answerIndex) => (
                      <div key={`${question.id}-${answerIndex}`} className="flex items-center gap-2">
                        <button
                          type="button"
                          title="Mark as correct"
                          onClick={() =>
                            updateQuestion(question.id, { correctIndex: answerIndex })
                          }
                          className={cn(
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                            question.correctIndex === answerIndex
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                              : "border-white/10 text-white/35 hover:text-white/70",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <input
                          value={answer}
                          onChange={(event) => {
                            const next = [...question.answers];
                            next[answerIndex] = event.target.value;
                            updateQuestion(question.id, { answers: next });
                          }}
                          placeholder={`Answer ${answerIndex + 1}`}
                          className={tqmsInputClass()}
                        />
                      </div>
                    ))}
                    <p className="text-[11px] text-white/35">
                      Tick marks the correct answer.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-semibold text-white">{title || "Untitled course"}</p>
                <p className="mt-1 text-xs text-white/45">
                  {code} · {category} · {durationHours}h · {mandatory ? "Mandatory" : "Optional"} ·{" "}
                  {status}
                </p>
                {description ? (
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{description}</p>
                ) : null}
                <p className="mt-3 text-[11px] text-white/40">
                  {pages.length} page{pages.length === 1 ? "" : "s"} ·{" "}
                  {questions.filter((q) => q.prompt.trim()).length} question
                  {questions.filter((q) => q.prompt.trim()).length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0a1422] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Learner preview scroller
                  </p>
                  <span className="text-[11px] text-white/45">
                    {previewSlides.length === 0
                      ? "No slides"
                      : `${previewIndex + 1} / ${previewSlides.length}`}
                  </span>
                </div>

                {previewSlide?.kind === "page" ? (
                  <div className="space-y-3">
                    <p className="text-xs text-sky-200/80">{previewSlide.label}</p>
                    <h3 className="text-base font-semibold text-white">
                      {previewSlide.page.title}
                    </h3>
                    {previewSlide.page.imageDataUrl ? (
                      <img
                        src={previewSlide.page.imageDataUrl}
                        alt={previewSlide.page.imageName ?? "Page image"}
                        className="max-h-56 w-full rounded-xl object-cover"
                      />
                    ) : null}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                      {previewSlide.page.body || "No content on this page yet."}
                    </p>
                  </div>
                ) : null}

                {previewSlide?.kind === "question" ? (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-200/80">{previewSlide.label}</p>
                    <h3 className="text-base font-semibold text-white">
                      {previewSlide.question.prompt}
                    </h3>
                    <ul className="space-y-2">
                      {previewSlide.question.answers.map((answer, answerIndex) => (
                        <li
                          key={`${previewSlide.question.id}-${answerIndex}`}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm",
                            previewSlide.question.correctIndex === answerIndex
                              ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                              : "border-white/10 bg-white/[0.03] text-white/70",
                          )}
                        >
                          {answer || `Answer ${answerIndex + 1}`}
                          {previewSlide.question.correctIndex === answerIndex
                            ? " · Correct"
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {previewSlides.length === 0 ? (
                  <p className="text-sm text-white/45">Add pages and questions to preview the flow.</p>
                ) : null}

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={previewIndex <= 0}
                    className={tqmsSecondaryButtonClass(previewIndex <= 0)}
                    onClick={() => setPreviewIndex((current) => Math.max(0, current - 1))}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={previewIndex >= previewSlides.length - 1}
                    className={tqmsPrimaryButtonClass(previewIndex >= previewSlides.length - 1)}
                    onClick={() =>
                      setPreviewIndex((current) =>
                        Math.min(previewSlides.length - 1, current + 1),
                      )
                    }
                  >
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => (step === 0 ? onClose() : setStep((current) => current - 1))}
            className={tqmsSecondaryButtonClass()}
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className={tqmsPrimaryButtonClass()}>
              Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button type="button" onClick={handlePublish} className={tqmsPrimaryButtonClass()}>
              {status === "Published" ? "Publish course" : "Save draft course"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
