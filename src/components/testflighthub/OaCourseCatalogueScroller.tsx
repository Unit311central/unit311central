"use client";

import type { ReactNode } from "react";
import { BookOpen, Play } from "lucide-react";

import CoursePlayer from "@/components/lms/CoursePlayer";
import { getPlayableLmsCourseTree, getPlayableLmsCourseTreeById } from "@/lib/lms/tqms-course-trees";
import type { LmsCourseTree } from "@/lib/lms/types";
import type { TqmsCourse } from "@/lib/tqms-data";
import { tqmsStatusClass } from "@/lib/tqms-data";
import { cn } from "@/lib/utils";
import { TqmsEmpty, TqmsStatusPill, tqmsPrimaryButtonClass } from "./tqms-ui";

type Props = {
  title: string;
  subtitle: string;
  courses: TqmsCourse[];
  emptyMessage: string;
  launchCourseId: string | null;
  onLaunch: (courseId: string) => void;
  onClosePlayer: () => void;
  /** Optional header actions (upload, manual builder, etc.). */
  actions?: ReactNode;
};

export function OaCourseCatalogueScroller({
  title,
  subtitle,
  courses,
  emptyMessage,
  launchCourseId,
  onLaunch,
  onClosePlayer,
  actions,
}: Props) {
  const activeTree: LmsCourseTree | null = launchCourseId
    ? getPlayableLmsCourseTreeById(
        launchCourseId,
        courses.find((course) => course.id === launchCourseId) ?? null,
      )
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-white/45">{subtitle}</p>
        </div>
        {actions}
      </div>

      {courses.length === 0 ? (
        <TqmsEmpty message={emptyMessage} />
      ) : (
        <>
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex snap-x snap-mandatory gap-3 px-1">
              {courses.map((course) => {
                const tree = getPlayableLmsCourseTree(course);
                const lessonCount =
                  tree?.modules.reduce((n, m) => n + m.lessons.length, 0) ?? 0;
                return (
                  <article
                    key={course.id}
                    className="flex w-[min(100%,280px)] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                        {course.category}
                      </span>
                      <TqmsStatusPill className={tqmsStatusClass(course.status)}>
                        {course.status}
                      </TqmsStatusPill>
                    </div>
                    <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-white/40">
                      {course.code}
                    </p>
                    <h4 className="mt-1 line-clamp-2 text-sm font-semibold text-white">
                      {course.title}
                    </h4>
                    <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-white/50">
                      {course.description || `${course.durationHours}h · ${course.owner}`}
                    </p>
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/40">
                      <BookOpen className="h-3 w-3" />
                      {lessonCount} lessons · {course.durationHours}h
                      {course.mandatory ? " · Mandatory" : ""}
                    </p>
                    <button
                      type="button"
                      className={cn("mt-3 w-full justify-center", tqmsPrimaryButtonClass(!tree))}
                      disabled={!tree}
                      onClick={() => onLaunch(course.id)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Open course
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Course</th>
                  <th className="px-3 py-2.5 font-semibold">Category</th>
                  <th className="px-3 py-2.5 font-semibold">Duration</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Access</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-white/5 text-white/80 last:border-0">
                    <td className="px-3 py-3">
                      <p className="font-medium text-white">{course.title}</p>
                      <p className="text-[11px] text-white/40">
                        {course.code} · {course.owner}
                      </p>
                    </td>
                    <td className="px-3 py-3">{course.category}</td>
                    <td className="px-3 py-3 tabular-nums">{course.durationHours}h</td>
                    <td className="px-3 py-3">
                      <TqmsStatusPill className={tqmsStatusClass(course.status)}>
                        {course.status}
                      </TqmsStatusPill>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className={tqmsPrimaryButtonClass()}
                        onClick={() => onLaunch(course.id)}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Launch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTree ? (
        <div className="fixed inset-0 z-[90] bg-[#070d18]">
          <CoursePlayer courseTree={activeTree} onClose={onClosePlayer} />
        </div>
      ) : null}
    </div>
  );
}
