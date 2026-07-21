"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  GraduationCap,
  Layers,
  Play,
  UserPlus,
} from "lucide-react";

import { markLearningPathLessonDone } from "@/lib/tqms-mock-store";
import { tqmsStatusClass } from "@/lib/tqms-data";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsStatusPill,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

function formatHours(hours: number) {
  return `${hours}h est.`;
}

export default function QmsTrainingWorkspace() {
  const store = useTqmsMockStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const paths = useMemo(
    () => [...store.learningPaths].sort((a, b) => a.name.localeCompare(b.name)),
    [store.learningPaths],
  );

  function toggleExpand(pathId: string) {
    setExpandedId((current) => (current === pathId ? null : pathId));
  }

  function handleContinue(pathId: string) {
    const path = store.learningPaths.find((row) => row.id === pathId);
    if (!path) return;
    const next = path.lessons.find((lesson) => !lesson.done);
    if (!next) {
      setNotice(`"${path.name}" is already complete.`);
      return;
    }
    markLearningPathLessonDone(pathId, next.id);
    setNotice(`Marked "${next.title}" complete on ${path.name}.`);
  }

  function handleMarkLesson(pathId: string, lessonId: string, title: string) {
    markLearningPathLessonDone(pathId, lessonId);
    setNotice(`Lesson "${title}" marked complete.`);
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <TqmsSection
        title="QMS Learning Paths"
        subtitle="Structured quality curricula for operators, engineers, and auditors."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50">
            <GraduationCap className="h-3.5 w-3.5 text-sky-300" />
            {paths.length} paths · {paths.filter((p) => p.certificateAvailable).length} with certificates
          </span>
        }
      >
        {paths.length === 0 ? (
          <TqmsEmpty message="No learning paths configured yet." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {paths.map((path) => {
              const expanded = expandedId === path.id;
              const doneLessons = path.lessons.filter((lesson) => lesson.done).length;
              return (
                <article
                  key={path.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white">{path.name}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/55">{path.description}</p>
                    </div>
                    {path.certificateAvailable ? (
                      <TqmsStatusPill className="shrink-0 border-sky-400/30 bg-sky-500/10 text-sky-100">
                        <Award className="mr-1 inline h-3 w-3" />
                        Certificate
                      </TqmsStatusPill>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Completion</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                        {path.completionPercent}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Modules</p>
                      <p className="mt-0.5 flex items-center gap-1 text-lg font-semibold tabular-nums text-white">
                        <Layers className="h-3.5 w-3.5 text-white/40" />
                        {path.moduleCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Est. Time</p>
                      <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums text-white">
                        <Clock className="h-3.5 w-3.5 text-white/40" />
                        {formatHours(path.estimatedHours)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Assessment</p>
                      <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                        {path.assessmentScore !== null ? `${path.assessmentScore}%` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${path.completionPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    {doneLessons} of {path.lessons.length} lessons complete
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={tqmsSecondaryButtonClass()}
                      onClick={() => toggleExpand(path.id)}
                    >
                      {expanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      {expanded ? "Close" : "Open"}
                    </button>
                    <button
                      type="button"
                      className={tqmsPrimaryButtonClass(path.completionPercent >= 100)}
                      disabled={path.completionPercent >= 100}
                      onClick={() => handleContinue(path.id)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Continue
                    </button>
                    <button
                      type="button"
                      className={tqmsSecondaryButtonClass()}
                      onClick={() =>
                        setNotice(`Assign flow opened for "${path.name}" — select learners in Staff Training.`)
                      }
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign
                    </button>
                    {path.certificateAvailable && path.completionPercent >= 100 ? (
                      <button
                        type="button"
                        className={tqmsPrimaryButtonClass()}
                        onClick={() =>
                          setNotice(`Certificate for "${path.name}" is ready to download.`)
                        }
                      >
                        <Award className="h-3.5 w-3.5" />
                        View Certificate
                      </button>
                    ) : null}
                  </div>

                  {expanded ? (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-white/45">
                        <BookOpen className="h-3.5 w-3.5" />
                        Path modules
                      </p>
                      <ul className="space-y-2">
                        {path.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1524]/60 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">{lesson.title}</p>
                              <p className="text-xs text-white/45">
                                {lesson.kind} · {lesson.durationMins} min
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <TqmsStatusPill
                                className={tqmsStatusClass(lesson.done ? "Complete" : "In Progress")}
                              >
                                {lesson.done ? "Done" : "Pending"}
                              </TqmsStatusPill>
                              {!lesson.done ? (
                                <button
                                  type="button"
                                  className={tqmsPrimaryButtonClass()}
                                  onClick={() =>
                                    handleMarkLesson(path.id, lesson.id, lesson.title)
                                  }
                                >
                                  Mark complete
                                </button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </TqmsSection>
    </div>
  );
}
