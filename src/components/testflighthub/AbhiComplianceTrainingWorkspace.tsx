"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { Loader2, Plus, UserPlus, Users, X } from "lucide-react";

import {
  ABHI_COMPLIANCE_COURSES,
  type AbhiComplianceCourse,
} from "@/lib/abhi-training-courses";
import { cn } from "@/lib/utils";
import CreateCourseWizard from "./CreateCourseWizard";
import {
  TqmsSection,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

export type AbhiComplianceTrainingMode = "dashboard" | "courses";

type TabId = "assigned" | "in_progress" | "completed" | "certificates";

type AssignableStaff = {
  employeeId: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  userId: string | null;
  alreadyAssigned: boolean;
};

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

function AssignCourseModal({
  course,
  onClose,
  onAssigned,
}: {
  course: AbhiComplianceCourse;
  onClose: () => void;
  onAssigned: (message: string) => void;
}) {
  const [staff, setStaff] = useState<AssignableStaff[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assignedCount, setAssignedCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/lms/assignments?courseSlug=${encodeURIComponent(course.slug)}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load staff");
      const rows = (data.staff ?? []) as AssignableStaff[];
      setStaff(rows);
      setAssignedCount(Number(data.assignedCount ?? 0));
      setSelected(
        new Set(rows.filter((row) => row.userId && !row.alreadyAssigned).map((row) => row.employeeId)),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [course.slug]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (row) =>
        row.fullName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q) ||
        row.role.toLowerCase().includes(q),
    );
  }, [query, staff]);

  const selectable = filtered.filter((row) => row.userId && !row.alreadyAssigned);
  const selectedCount = selectable.filter((row) => selected.has(row.employeeId)).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of selectable) next.add(row.employeeId);
      return next;
    });
  }

  function clearVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const row of selectable) next.delete(row.employeeId);
      return next;
    });
  }

  async function assign(assignAllActive: boolean) {
    setSaving(true);
    setError(null);
    try {
      const employeeIds = assignAllActive
        ? []
        : staff.filter((row) => selected.has(row.employeeId) && row.userId).map((row) => row.employeeId);
      if (!assignAllActive && employeeIds.length === 0) {
        throw new Error("Select at least one staff member with a login account.");
      }
      const response = await fetch("/api/lms/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: course.slug,
          employeeIds,
          assignAllActive,
          mandatory: course.mandatory,
          dueAt: dueAt ? new Date(`${dueAt}T17:00:00`).toISOString() : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Assignment failed");

      const parts = [
        `Assigned “${data.courseTitle}” to ${data.assigned} staff`,
        data.skipped ? `${data.skipped} already assigned` : null,
        data.missingAccounts ? `${data.missingAccounts} without login skipped` : null,
      ].filter(Boolean);
      onAssigned(`${parts.join(" · ")}.`);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Assignment failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b1524] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
              Assign course
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">{course.title}</h2>
            <p className="mt-1 text-sm text-white/50">
              {assignedCount} already assigned · pick internal staff to enrol
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/55 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 border-b border-white/10 px-5 py-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search staff by name, role, department…"
              className={tqmsInputClass()}
            />
            <input
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className={tqmsInputClass()}
              title="Due date"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={tqmsSecondaryButtonClass()} onClick={selectVisible}>
              Select visible
            </button>
            <button type="button" className={tqmsSecondaryButtonClass()} onClick={clearVisible}>
              Clear
            </button>
            <span className="self-center text-xs text-white/45">
              {selectedCount} selected · {selectable.length} assignable on this page
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <p className="flex items-center gap-2 py-10 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading staff…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/45">No matching staff.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((row) => {
                const disabled = !row.userId || row.alreadyAssigned;
                const checked = selected.has(row.employeeId);
                return (
                  <li key={row.employeeId}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                        disabled
                          ? "cursor-not-allowed border-white/8 bg-white/[0.02] opacity-60"
                          : checked
                            ? "border-emerald-400/35 bg-emerald-500/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        disabled={disabled}
                        checked={checked && !disabled}
                        onChange={() => toggle(row.employeeId)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{row.fullName}</p>
                        <p className="truncate text-xs text-white/45">
                          {row.role || "Role not set"}
                          {row.department ? ` · ${row.department}` : ""}
                        </p>
                        <p className="truncate text-[11px] text-white/35">{row.email || "No email"}</p>
                      </div>
                      {row.alreadyAssigned ? (
                        <TqmsStatusPill className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
                          Assigned
                        </TqmsStatusPill>
                      ) : !row.userId ? (
                        <TqmsStatusPill className="border-amber-400/30 bg-amber-500/10 text-amber-100">
                          No login
                        </TqmsStatusPill>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error ? (
          <p className="mx-5 mb-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            disabled={saving || loading}
            className={tqmsSecondaryButtonClass(saving || loading)}
            onClick={() => void assign(true)}
          >
            <Users className="h-3.5 w-3.5" />
            Assign all active staff
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={tqmsSecondaryButtonClass()} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || loading || selectedCount === 0}
              className={tqmsPrimaryButtonClass(saving || loading || selectedCount === 0)}
              onClick={() => void assign(false)}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              Assign selected ({selectedCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseTable({
  rows,
  actionLabel = "Launch",
  onAssign,
  showAssign = false,
}: {
  rows: AbhiComplianceCourse[];
  actionLabel?: string;
  onAssign?: (course: AbhiComplianceCourse) => void;
  showAssign?: boolean;
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
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {showAssign ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-lg border border-sky-400/35 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/25"
                      onClick={() => onAssign?.(course)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400"
                    onClick={() => {
                      window.alert(
                        `${course.title} will open in the ABHI LMS player. Slug: ${course.slug}`,
                      );
                    }}
                  >
                    {actionLabel}
                  </button>
                </div>
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
  const [assignCourse, setAssignCourse] = useState<AbhiComplianceCourse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {notice ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}
      <TqmsSection
        title="Courses"
        subtitle="ABHI compliance courses (Anti-Bribery through Modern Slavery). Assign any course to internal staff."
        actions={
          <>
            <button
              type="button"
              onClick={() => setAssignCourse(ABHI_COMPLIANCE_COURSES[0] ?? null)}
              className={tqmsSecondaryButtonClass()}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assign to staff
            </button>
            <button type="button" onClick={() => setWizardOpen(true)} className={tqmsPrimaryButtonClass()}>
              <Plus className="h-3.5 w-3.5" />
              Create Course
            </button>
          </>
        }
      >
        <CourseTable
          rows={ABHI_COMPLIANCE_COURSES}
          showAssign
          onAssign={setAssignCourse}
        />
      </TqmsSection>

      {wizardOpen ? (
        <CreateCourseWizard
          suggestedCode={`ABHI-${String(ABHI_COMPLIANCE_COURSES.length + 1).padStart(3, "0")}`}
          onClose={() => setWizardOpen(false)}
          onSubmit={(course) => {
            setWizardOpen(false);
            setNotice(
              course.status === "Published"
                ? `"${course.title}" published to the course builder.`
                : `"${course.title}" draft saved in the course builder.`,
            );
          }}
        />
      ) : null}

      {assignCourse ? (
        <AssignCourseModal
          course={assignCourse}
          onClose={() => setAssignCourse(null)}
          onAssigned={setNotice}
        />
      ) : null}
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
