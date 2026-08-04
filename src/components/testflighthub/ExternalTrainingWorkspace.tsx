"use client";

import { useMemo } from "react";
import { BookOpen, ExternalLink } from "lucide-react";

import { isOaExternalCourse } from "@/lib/onwardair/training-data";
import { tqmsStatusClass } from "@/lib/tqms-data";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsStatusPill,
} from "./tqms-ui";

export default function ExternalTrainingWorkspace() {
  const store = useTqmsMockStore();
  const courses = useMemo(
    () => store.courses.filter(isOaExternalCourse).sort((a, b) => a.title.localeCompare(b.title)),
    [store.courses],
  );

  return (
    <div className="space-y-5">
      <TqmsSection
        title="External Courses"
        subtitle="Vendor, regulator, and third-party programmes for Houston staff — not hosted on OnwardAir LMS."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50">
            <ExternalLink className="h-3.5 w-3.5 text-amber-300" />
            {courses.length} catalogue items
          </span>
        }
      >
        {courses.length === 0 ? (
          <TqmsEmpty message="No external courses seeded for this workspace." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-2 py-2 font-semibold">Course</th>
                  <th className="px-2 py-2 font-semibold">Provider</th>
                  <th className="px-2 py-2 font-semibold">Duration</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-white/5 text-white/80">
                    <td className="px-2 py-3">
                      <p className="font-medium text-white">{course.title}</p>
                      <p className="text-[11px] text-white/40">
                        {course.code}
                        {course.description ? ` · ${course.description}` : ""}
                      </p>
                    </td>
                    <td className="px-2 py-3 text-[12px]">{course.owner}</td>
                    <td className="px-2 py-3 tabular-nums">{course.durationHours}h</td>
                    <td className="px-2 py-3">
                      <TqmsStatusPill className={tqmsStatusClass(course.status)}>
                        {course.status}
                      </TqmsStatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TqmsSection>

      <p className="flex items-start gap-2 text-xs text-white/40">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        External courses are tracked for planning and compliance. Enrolment and certificates are
        managed with the provider; Staff Courses remain the internal LMS catalogue.
      </p>
    </div>
  );
}
