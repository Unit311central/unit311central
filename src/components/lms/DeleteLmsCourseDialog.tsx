"use client";

import { Loader2 } from "lucide-react";

import type { LmsCourseDeletionImpact, LmsCourseListItem } from "@/lib/lms/types";

export default function DeleteLmsCourseDialog({
  open,
  course,
  impact,
  impactLoading,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  course: LmsCourseListItem | null;
  impact: LmsCourseDeletionImpact | null;
  impactLoading: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open || !course) return null;

  const isPublished = course.status === "published";
  const titleId = "delete-lms-course-title";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1220] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
      >
        <h2 id={titleId} className="text-base font-semibold text-white">
          Delete course?
        </h2>
        <p className="mt-2 text-sm text-white/60">
          You are about to permanently delete{" "}
          <span className="font-medium text-white">{course.title}</span>. This action cannot be
          undone.
        </p>
        {isPublished ? (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-50">
            <p className="font-medium">Published course</p>
            <p className="mt-1 text-amber-100/90">
              Learners will lose access immediately. Deleting this course also permanently removes
              its assignments, enrolments, in-progress and completed learner progress, assessment
              attempts, and issued certificates tied to this course.
            </p>
            {impactLoading ? (
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-amber-100/80">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Loading impact summary…
              </p>
            ) : impact ? (
              <ul className="mt-2 list-inside list-disc text-xs text-amber-100/85">
                <li>{impact.enrolmentCount} learner enrolment(s)</li>
                <li>{impact.certificateCount} issued certificate(s)</li>
                <li>{impact.assignmentCount} assignment(s)</li>
                <li>{impact.attemptCount} assessment attempt(s)</li>
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/50">
            Draft course modules, lessons, and question banks for this course will be removed.
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-white/12 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.05] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-400/40 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Delete course
          </button>
        </div>
      </div>
    </div>
  );
}
