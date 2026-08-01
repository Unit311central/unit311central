"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Menu,
  X,
} from "lucide-react";

import CourseCompletionCeremony from "@/components/lms/CourseCompletionCeremony";
import { LessonRenderer } from "@/components/lms/lesson-renderers";
import type { LmsCourseTree, LmsEnrolment, LmsLesson } from "@/lib/lms/types";
import { cn } from "@/lib/utils";

type Props = {
  courseSlug: string;
  companyPath?: string;
  onClose: () => void;
};

type LessonState = {
  completedLessonIds?: string[];
  [key: string]: unknown;
};

function flattenLessons(course: LmsCourseTree): LmsLesson[] {
  return course.modules.flatMap((m) => m.lessons);
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CoursePlayer({ courseSlug, companyPath, onClose }: Props) {
  const [course, setCourse] = useState<LmsCourseTree | null>(null);
  const [enrolment, setEnrolment] = useState<LmsEnrolment | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCeremony, setShowCeremony] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [certificateNumber, setCertificateNumber] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const timeBaseRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const enrolmentRef = useRef<LmsEnrolment | null>(null);
  const completedRef = useRef<Set<string>>(new Set());
  const lessonIndexRef = useRef(0);

  useEffect(() => {
    enrolmentRef.current = enrolment;
  }, [enrolment]);
  useEffect(() => {
    completedRef.current = completedIds;
  }, [completedIds]);
  useEffect(() => {
    lessonIndexRef.current = lessonIndex;
  }, [lessonIndex]);

  const lessons = useMemo(() => (course ? flattenLessons(course) : []), [course]);
  const currentLesson = lessons[lessonIndex] ?? null;
  const immersiveLesson = Boolean(currentLesson);
  const progressPct =
    lessons.length === 0 ? 0 : Math.round((completedIds.size / lessons.length) * 100);

  const saveProgress = useCallback(
    async (options?: {
      completed?: Set<string>;
      status?: LmsEnrolment["status"];
      lastLessonId?: string | null;
      score?: number | null;
    }) => {
      const enr = enrolmentRef.current;
      if (!enr) return null;
      const completed = options?.completed ?? completedRef.current;
      const lessonsCount = lessons.length || 1;
      const pct = Math.round((completed.size / lessonsCount) * 100);
      const elapsed =
        timeBaseRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000);
      const lastLesson =
        options?.lastLessonId ??
        lessons[lessonIndexRef.current]?.id ??
        enr.lastLessonId;

      setSaving(true);
      try {
        const res = await fetch(`/api/lms/enrolments/${enr.id}/progress`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progressPct: pct,
            lessonState: {
              ...(enr.lessonState ?? {}),
              completedLessonIds: [...completed],
            },
            timeSpentSeconds: elapsed,
            lastLessonId: lastLesson,
            status: options?.status,
          }),
        });
        const data = (await res.json()) as { enrolment?: LmsEnrolment; error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to save progress.");
        if (data.enrolment) {
          setEnrolment(data.enrolment);
          return data.enrolment;
        }
      } catch {
        /* keep local progress; retry on next tick */
      } finally {
        setSaving(false);
      }
      return null;
    },
    [lessons],
  );

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
      setError(null);
      try {
        const courseRes = await fetch(`/api/lms/courses/${encodeURIComponent(courseSlug)}`, {
          credentials: "include",
        });
        const courseData = (await courseRes.json()) as {
          course?: LmsCourseTree;
          error?: string;
        };
        if (!courseRes.ok || !courseData.course) {
          throw new Error(courseData.error || "Course not found.");
        }
        if (cancelled) return;
        const tree = courseData.course;
        setCourse(tree);

        const enrolRes = await fetch("/api/lms/enrolments", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseSlug,
            start: true,
          }),
        });
        const enrolData = (await enrolRes.json()) as {
          enrolment?: LmsEnrolment;
          error?: string;
        };
        if (!enrolRes.ok || !enrolData.enrolment) {
          throw new Error(enrolData.error || "Could not enrol.");
        }
        if (cancelled) return;

        const enr = enrolData.enrolment;
        setEnrolment(enr);
        timeBaseRef.current = enr.timeSpentSeconds || 0;
        sessionStartRef.current = Date.now();
        setTimeSpent(enr.timeSpentSeconds || 0);

        const state = (enr.lessonState ?? {}) as LessonState;
        const done = new Set(
          Array.isArray(state.completedLessonIds)
            ? state.completedLessonIds.map(String)
            : [],
        );
        setCompletedIds(done);

        const flat = flattenLessons(tree);
        let resumeIndex = 0;
        if (enr.lastLessonId) {
          const idx = flat.findIndex((l) => l.id === enr.lastLessonId);
          if (idx >= 0) resumeIndex = idx;
        } else if (done.size > 0) {
          const next = flat.findIndex((l) => !done.has(l.id));
          resumeIndex = next >= 0 ? next : Math.max(0, flat.length - 1);
        }
        setLessonIndex(resumeIndex);

        if (enr.status === "completed") {
          setShowCeremony(true);
          setFinalScore(enr.score);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load course.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [companyPath, courseSlug]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTimeSpent(
        timeBaseRef.current + Math.floor((Date.now() - sessionStartRef.current) / 1000),
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void saveProgress({ status: "in_progress" });
    }, 30000);
    return () => window.clearInterval(id);
  }, [saveProgress]);

  useEffect(() => {
    function onUnload() {
      void saveProgress({ status: "in_progress" });
    }
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [saveProgress]);

  async function handleLessonComplete(meta?: { score?: number; passed?: boolean }) {
    if (!currentLesson || !course) return;
    const nextCompleted = new Set(completedIds);
    nextCompleted.add(currentLesson.id);
    setCompletedIds(nextCompleted);

    const isLast = lessonIndex >= lessons.length - 1;
    const assessmentPassed = meta?.passed === true;
    const courseDone =
      (isLast && nextCompleted.size >= lessons.length) ||
      (currentLesson.lessonType === "assessment" && assessmentPassed);

    if (typeof meta?.score === "number") setFinalScore(meta.score);

    if (courseDone) {
      const saved = await saveProgress({
        completed: nextCompleted,
        status: "completed",
        lastLessonId: currentLesson.id,
        score: meta?.score ?? finalScore,
      });
      let certNumber: string | null = null;
      try {
        const certRes = await fetch("/api/lms/complete", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseSlug }),
        });
        const certData = (await certRes.json()) as {
          certificate?: { id: string; certificateNumber: string };
          error?: string;
        };
        if (certData.certificate?.certificateNumber) {
          certNumber = certData.certificate.certificateNumber;
          setCertificateUrl(
            `/api/lms/certificates/${encodeURIComponent(certNumber)}/pdf`,
          );
          setCertificateNumber(certNumber);
        }
      } catch {
        /* ceremony still shows */
      }
      void saved;
      setShowCeremony(true);
      return;
    }

    await saveProgress({
      completed: nextCompleted,
      status: "in_progress",
      lastLessonId: currentLesson.id,
    });

    if (!isLast) setLessonIndex((i) => i + 1);
  }

  function goToLesson(index: number) {
    setLessonIndex(index);
    void saveProgress({
      status: "in_progress",
      lastLessonId: lessons[index]?.id ?? null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07111f] text-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Toggle modules"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {course?.title ?? "Loading course…"}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
        <div className="hidden items-center gap-3 text-xs text-white/50 sm:flex">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock3 className="h-3.5 w-3.5" />
            {formatTime(timeSpent)}
          </span>
          <span className="tabular-nums">{progressPct}%</span>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        </div>
        <button
          type="button"
          onClick={() => {
            void saveProgress({ status: "in_progress" }).finally(onClose);
          }}
          className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white"
          aria-label="Close player"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "shrink-0 overflow-y-auto border-r border-white/10 bg-[#0a1628] transition-all",
            sidebarOpen && !immersiveLesson ? "w-72" : "w-0 overflow-hidden border-0",
            "absolute inset-y-14 left-0 z-20 lg:static lg:inset-auto",
            immersiveLesson && "lg:hidden",
          )}
        >
          <div className="p-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Modules
            </p>
            {course?.modules.map((mod) => (
              <div key={mod.id} className="mb-4">
                <p className="px-2 text-xs font-semibold text-white/70">{mod.title}</p>
                <ul className="mt-1 space-y-0.5">
                  {mod.lessons.map((lesson) => {
                    const flatIndex = lessons.findIndex((l) => l.id === lesson.id);
                    const done = completedIds.has(lesson.id);
                    const active = flatIndex === lessonIndex;
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => {
                            goToLesson(flatIndex);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition",
                            active
                              ? "bg-emerald-500/20 text-emerald-100"
                              : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                          )}
                        >
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          ) : (
                            <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/25" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <main
          className={cn(
            "relative min-w-0 flex-1 px-4 py-4 sm:px-8",
            immersiveLesson ? "overflow-hidden" : "overflow-y-auto",
          )}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-white/55">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading course…
            </div>
          ) : error ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-center">
              <p className="text-sm text-rose-100">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white"
              >
                Close
              </button>
            </div>
          ) : currentLesson ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLesson.id}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                className={cn(immersiveLesson && "h-full")}
              >
                <LessonRenderer
                  lesson={currentLesson}
                  courseId={course?.id}
                  courseSlug={courseSlug}
                  enrolmentId={enrolment?.id}
                  onComplete={(meta) => void handleLessonComplete(meta)}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-center text-sm text-white/50">No lessons in this course.</p>
          )}
        </main>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-white/10 px-4 py-3">
        <button
          type="button"
          disabled={lessonIndex <= 0}
          onClick={() => goToLesson(lessonIndex - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.04] disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <p className="text-xs text-white/45">
          Lesson {lessons.length ? lessonIndex + 1 : 0} of {lessons.length}
        </p>
        <button
          type="button"
          disabled={lessonIndex >= lessons.length - 1}
          onClick={() => goToLesson(lessonIndex + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 hover:bg-white/[0.04] disabled:opacity-30"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>

      {showCeremony && course ? (
        <CourseCompletionCeremony
          courseTitle={course.title}
          score={finalScore ?? enrolment?.score}
          certificateUrl={certificateUrl}
          certificateNumber={certificateNumber}
          onClose={onClose}
        />
      ) : null}
    </div>
  );
}
