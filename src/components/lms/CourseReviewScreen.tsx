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

import ProcedureAnimationPlayer from "@/components/lms/ProcedureAnimationPlayer";
import type { LmsCourseTree } from "@/lib/lms/types";

type Summary = {
  title: string;
  durationMinutes: number;
  moduleCount: number;
  lessonCount: number;
  scenarioCount: number;
  assessmentCount: number;
  questionCount: number;
  animationCount?: number;
  certificateEnabled: boolean;
  learningObjectives?: string[];
  templateFallback?: boolean;
  generationSource?: "ai" | "document_template";
};

type Props = {
  course: LmsCourseTree;
  summary: Summary;
  onClose: () => void;
  onPublished: (slug: string) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
};

export default function CourseReviewScreen({
  course,
  summary,
  onClose,
  onPublished,
  onRegenerate,
  regenerating,
}: Props) {
  const [title, setTitle] = useState(course.title);
  const [tree, setTree] = useState(course);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenLessonId, setRegenLessonId] = useState<string | null>(null);

  const animationLessons = useMemo(
    () =>
      tree.modules.flatMap((mod) =>
        mod.lessons
          .filter(
            (l) =>
              l.lessonType === "procedure_animation" &&
              l.content.type === "procedure_animation",
          )
          .map((l) => ({ moduleTitle: mod.title, lesson: l })),
      ),
    [tree],
  );

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      if (title.trim() && title.trim() !== tree.title) {
        await fetch(`/api/lms/courses/${encodeURIComponent(tree.slug)}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim() }),
        });
      }
      const res = await fetch(`/api/lms/courses/${encodeURIComponent(tree.slug)}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { course?: { slug: string }; error?: string };
      if (!res.ok) throw new Error(data.error || "Publish failed.");
      onPublished(data.course?.slug || tree.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b1524] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f9a8d4]">
              <Sparkles className="h-3.5 w-3.5" />
              AI built a complete course
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Review before publishing</h2>
            {summary.templateFallback || summary.generationSource === "document_template" ? (
              <p className="mt-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-50">
                Template fallback: AI generation did not complete. This draft was built only from
                detected procedure steps in your document. Review carefully before publishing.
              </p>
            ) : null}
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
            { label: "Duration", value: `${summary.durationMinutes} min`, icon: BookOpen },
            { label: "Modules", value: String(summary.moduleCount), icon: Target },
            { label: "Scenarios", value: String(summary.scenarioCount), icon: Sparkles },
            {
              label: "Animations",
              value: String(summary.animationCount ?? animationLessons.length),
              icon: Clapperboard,
            },
            {
              label: "Certificate",
              value: summary.certificateEnabled ? "On" : "Off",
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

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Modules</p>
          <ol className="mt-2 space-y-2">
            {tree.modules.map((mod, i) => (
              <li
                key={mod.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <p className="text-sm font-semibold text-white">
                  {i + 1}. {mod.title}
                </p>
                <p className="mt-0.5 text-xs text-white/45">
                  {mod.lessons.length} lessons ·{" "}
                  {mod.lessons.map((l) => l.lessonType).join(", ")}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {animationLessons.length > 0 ? (
          <div className="mt-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
              Animation preview
            </p>
            {animationLessons.map(({ moduleTitle, lesson }) => (
              <div key={lesson.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-white/70">
                    <span className="text-white/45">{moduleTitle} ·</span> {lesson.title}
                  </p>
                  <button
                    type="button"
                    disabled={Boolean(regenLessonId)}
                    onClick={() => {
                      void (async () => {
                        setRegenLessonId(lesson.id);
                        setError(null);
                        try {
                          const res = await fetch(
                            `/api/lms/lessons/${encodeURIComponent(lesson.id)}/regenerate-animation`,
                            {
                              method: "POST",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ courseSlug: tree.slug }),
                            },
                          );
                          const data = (await res.json()) as {
                            course?: LmsCourseTree;
                            error?: string;
                          };
                          if (!res.ok || !data.course) {
                            throw new Error(data.error || "Regeneration failed.");
                          }
                          setTree(data.course);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Regeneration failed.");
                        } finally {
                          setRegenLessonId(null);
                        }
                      })();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:bg-white/5 disabled:opacity-50"
                  >
                    {regenLessonId === lesson.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Regenerate animation
                  </button>
                </div>
                {lesson.content.type === "procedure_animation" ? (
                  <ProcedureAnimationPlayer spec={lesson.content.spec} compact />
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-xs text-white/40">
          Final assessment: {summary.assessmentCount} · Question bank: {summary.questionCount} ·
          Pass mark {tree.passMark}%
        </p>

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
              Regenerate
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
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
