"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Clapperboard,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import { MotionStudioPlayer } from "@/components/motion-studio/MotionStudioPlayer";
import { validateCourseForPublish } from "@/lib/lms/course-publish-validation";
import { isInstructionalAnimationComplete } from "@/lib/lms/instructional-animation";
import type { LmsCourseTree, LmsLesson } from "@/lib/lms/types";

type Summary = {
  title: string;
  durationMinutes: number;
  moduleCount: number;
  lessonCount: number;
  scenarioCount: number;
  assessmentCount: number;
  questionCount: number;
  questionBankCount?: number;
  finalAssessmentDrawCount?: number;
  animationLessonCount?: number;
  passMark?: number;
  certificateEnabled: boolean;
  learningObjectives?: string[];
};

type Props = {
  course: LmsCourseTree;
  summary: Summary;
  onClose: () => void;
  onPublished: (slug: string) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
};

function animationPayload(lesson: LmsLesson) {
  if (!isInstructionalAnimationComplete(lesson.content)) return null;
  return { ...lesson.content.spec, id: lesson.id };
}

export default function CourseReviewScreen({
  course,
  summary,
  onClose,
  onPublished,
  onRegenerate,
  regenerating,
}: Props) {
  const [title, setTitle] = useState(course.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  const bankCount = summary.questionBankCount ?? summary.questionCount;
  const drawCount = summary.finalAssessmentDrawCount ?? 0;
  const passMark = summary.passMark ?? course.passMark;

  const validation = useMemo(
    () => validateCourseForPublish(course, bankCount),
    [course, bankCount],
  );

  const animatedLessonCount = useMemo(() => {
    return course.modules
      .flatMap((m) => m.lessons)
      .filter((l) => l.content.type !== "assessment")
      .filter((l) => isInstructionalAnimationComplete(l.content)).length;
  }, [course]);

  async function publish() {
    if (!validation.ok) {
      setError(validation.errors.join(" "));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (title.trim() && title.trim() !== course.title) {
        await fetch(`/api/lms/courses/${encodeURIComponent(course.slug)}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() }),
        });
      }
      const res = await fetch(`/api/lms/courses/${encodeURIComponent(course.slug)}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { course?: { slug: string }; error?: string };
      if (!res.ok) throw new Error(data.error || "Publish failed.");
      onPublished(data.course?.slug || course.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1524] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f9a8d4]">
              <Sparkles className="h-3.5 w-3.5" />
              Review before publishing
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Course quality gate</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 block text-sm text-white/55">
          Course title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-[#C2185B]/50"
          />
        </label>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Modules", value: String(summary.moduleCount), icon: Target },
            { label: "Lessons", value: String(summary.lessonCount), icon: BookOpen },
            {
              label: "Animations",
              value: `${animatedLessonCount}/${summary.lessonCount - (summary.assessmentCount || 1)}`,
              icon: Clapperboard,
            },
            {
              label: "Pass mark",
              value: `${passMark}%`,
              icon: Award,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
            >
              <card.icon className="h-4 w-4 text-[#f9a8d4]" />
              <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/40">
                {card.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
          <p>
            Question bank: <strong>{bankCount}</strong> · Final assessment draws:{" "}
            <strong>{drawCount}</strong> · Scenarios: {summary.scenarioCount}
          </p>
        </div>

        {!validation.ok ? (
          <div className="mt-4 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <p className="font-semibold">Publishing blocked</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validation.errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-emerald-200/90">
            All required animations, lessons, and assessment items are present.
          </p>
        )}

        {summary.learningObjectives?.length ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
              Learning objectives
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-white/70">
              {summary.learningObjectives.map((obj) => (
                <li key={obj} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C2185B]" />
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
            Lessons and animation previews
          </p>
          {course.modules.map((mod, mi) => (
            <div key={mod.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-sm font-semibold text-white">
                {mi + 1}. {mod.title}
              </p>
              <ul className="mt-2 space-y-2">
                {mod.lessons.map((lesson) => {
                  const payload = animationPayload(lesson);
                  const hasAnimation = Boolean(payload);
                  return (
                    <li key={lesson.id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-white/85">{lesson.title}</p>
                        <span
                          className={`text-[10px] uppercase tracking-wide ${
                            hasAnimation ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
                          {lesson.lessonType}
                          {hasAnimation ? " · animated" : ""}
                        </span>
                      </div>
                      {payload ? (
                        <button
                          type="button"
                          className="mt-2 text-xs text-cyan-300 underline"
                          onClick={() =>
                            setExpandedLessonId((id) => (id === lesson.id ? null : lesson.id))
                          }
                        >
                          {expandedLessonId === lesson.id ? "Hide preview" : "Preview animation"}
                        </button>
                      ) : lesson.lessonType !== "assessment" ? (
                        <p className="mt-1 text-xs text-rose-200/80">Missing instructional animation</p>
                      ) : null}
                      {expandedLessonId === lesson.id && payload ? (
                        <div className="mt-2 rounded-lg border border-white/10 p-2">
                          <MotionStudioPlayer payload={payload} variant="compact" />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {onRegenerate ? (
            <button
              type="button"
              disabled={busy || regenerating}
              onClick={onRegenerate}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50"
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate from PDF
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy || !validation.ok}
            onClick={() => void publish()}
            className="inline-flex items-center gap-2 rounded-full bg-[#C2185B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a3134c] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Publish course
          </button>
        </div>
      </div>
    </div>
  );
}
