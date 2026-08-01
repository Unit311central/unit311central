"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import {
  ABHI_COMPLIANCE_COURSES,
  type AbhiComplianceCourse,
} from "@/lib/abhi-training-courses";
import { cn } from "@/lib/utils";
import CreateCourseWizard from "./CreateCourseWizard";
import {
  TqmsSection,
  TqmsStatusPill,
  tqmsPrimaryButtonClass,
} from "./tqms-ui";

export type AbhiComplianceTrainingMode = "dashboard" | "courses";

type TabId = "assigned" | "in_progress" | "completed" | "certificates";

const TABS: { id: TabId; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "certificates", label: "Certificates" },
];

function statusLabel(course: AbhiComplianceCourse) {
  if (course.mandatory) return "Mandatory";
  return "Optional";
}

function statusPillClass(course: AbhiComplianceCourse) {
  if (course.status === "completed") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }
  if (course.status === "in_progress") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  return "border-sky-400/30 bg-sky-500/10 text-sky-100";
}

function CourseTable({
  rows,
  actionLabel = "Launch",
}: {
  rows: AbhiComplianceCourse[];
  actionLabel?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-3 py-2.5">Course</th>
            <th className="px-3 py-2.5">Category</th>
            <th className="px-3 py-2.5">Duration</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">Progress</th>
            <th className="px-3 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((course) => (
            <tr key={course.id} className="border-t border-white/8 text-white/80">
              <td className="px-3 py-2.5 font-medium text-white">{course.title}</td>
              <td className="px-3 py-2.5">{course.category}</td>
              <td className="px-3 py-2.5">{course.durationMinutes} min</td>
              <td className="px-3 py-2.5">
                <TqmsStatusPill className={statusPillClass(course)}>
                  {statusLabel(course)}
                </TqmsStatusPill>
              </td>
              <td className="px-3 py-2.5 tabular-nums">{course.progressPct}%</td>
              <td className="px-3 py-2.5 text-right">
                <button
                  type="button"
                  className="inline-flex rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400"
                  onClick={() => {
                    window.alert(
                      `${course.title} will launch in the ABHI LMS player once the full course pack is deployed. Slug: ${course.slug}`,
                    );
                  }}
                >
                  {actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DashboardAssignedView() {
  const [tab, setTab] = useState<TabId>("assigned");
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    if (tab === "assigned") return ABHI_COMPLIANCE_COURSES;
    if (tab === "in_progress") {
      return ABHI_COMPLIANCE_COURSES.filter((c) => c.status === "in_progress");
    }
    if (tab === "completed") {
      return ABHI_COMPLIANCE_COURSES.filter((c) => c.status === "completed");
    }
    return [];
  }, [tab]);

  const title =
    tab === "assigned"
      ? "Assigned Courses"
      : tab === "in_progress"
        ? "In Progress"
        : tab === "completed"
          ? "Completed"
          : "Certificates";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              tab === item.id
                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/80",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <TqmsSection
        title={title}
        subtitle="Compliance programme for ABHI staff — same course set as the Talanton Assigned catalogue."
      >
        {loading ? (
          <p className="mb-3 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
          </p>
        ) : null}

        {tab === "certificates" ? (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-3 py-2.5">Course</th>
                  <th className="px-3 py-2.5">Certificate #</th>
                  <th className="px-3 py-2.5">Score</th>
                  <th className="px-3 py-2.5">Issued</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/8 text-white/55">
                  <td className="px-3 py-6" colSpan={4}>
                    Certificates appear here after staff complete LMS assessments.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-white/45">
            No courses in this view yet.
          </p>
        ) : (
          <CourseTable
            rows={filtered}
            actionLabel={tab === "in_progress" ? "Resume" : "Launch"}
          />
        )}
      </TqmsSection>
    </div>
  );
}

function CoursesCatalogView() {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="space-y-4">
      <TqmsSection
        title="Courses"
        subtitle="ABHI compliance courses (Anti-Bribery through Modern Slavery)."
        actions={
          <button type="button" onClick={() => setWizardOpen(true)} className={tqmsPrimaryButtonClass()}>
            <Plus className="h-3.5 w-3.5" />
            Create Course
          </button>
        }
      >
        <CourseTable rows={ABHI_COMPLIANCE_COURSES} />
      </TqmsSection>

      {wizardOpen ? <CreateCourseWizard onClose={() => setWizardOpen(false)} /> : null}
    </div>
  );
}

export default function AbhiComplianceTrainingWorkspace({
  mode,
}: {
  mode: AbhiComplianceTrainingMode;
}) {
  if (mode === "dashboard") return <DashboardAssignedView />;
  return <CoursesCatalogView />;
}
