"use client";

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { Loader2, Plus, Sparkles, Upload, UserPlus, Users, X } from "lucide-react";

import CoursePlayer from "@/components/lms/CoursePlayer";
import CourseReviewScreen from "@/components/lms/CourseReviewScreen";
import {
  ABHI_COMPLIANCE_COURSES,
  type AbhiComplianceCourse,
} from "@/lib/abhi-training-courses";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import type { LmsCertificate, LmsCourse, LmsCourseTree, LmsEnrolment } from "@/lib/lms/types";
import { cn } from "@/lib/utils";
import CreateCourseWizard from "./CreateCourseWizard";
import WorkspaceErrorBoundary from "./WorkspaceErrorBoundary";
import {
  TqmsSection,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

function useTrainingBrand() {
  const isTalanton =
    typeof window !== "undefined" ? isBrowserTalantonImpactSurface() : false;
  return {
    isTalanton,
    orgName: isTalanton ? "Talanton Impact" : "ABHI",
    generatorLabel: isTalanton
      ? "Talanton Impact AI Course Generator"
      : "ABHI AI Course Generator",
    accentText: isTalanton ? "text-emerald-300" : "text-[#f9a8d4]",
    accentBorder: isTalanton ? "border-emerald-400/25" : "border-[#C2185B]/25",
    accentGradient: isTalanton
      ? "from-emerald-500/15 via-transparent to-transparent"
      : "from-[#C2185B]/15 via-transparent to-transparent",
    description: isTalanton
      ? "PDF or Word (policies, handbooks, ESG, investment process, portfolio SOPs). AI builds modules, scenarios, assessments, and certificate settings for review."
      : "PDF or Word (Anti-Bribery, GDPR, handbook, MHRA, SOPs, exhibitor guides). AI builds modules, scenarios, assessments, and certificate settings for review.",
  };
}

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

type CatalogRow = AbhiComplianceCourse & {
  enrolmentStatus?: LmsEnrolment["status"] | null;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "certificates", label: "Certificates" },
];

const MANDATORY_BY_SLUG = new Map(
  ABHI_COMPLIANCE_COURSES.map((course) => [course.slug, course.mandatory] as const),
);

function toCatalogRow(
  course: Pick<LmsCourse, "id" | "slug" | "title" | "category" | "durationMinutes">,
  enrolment?: LmsEnrolment | null,
): CatalogRow {
  const status: CatalogRow["status"] =
    enrolment?.status === "completed"
      ? "completed"
      : enrolment?.status === "in_progress"
        ? "in_progress"
        : "assigned";
  return {
    id: course.id,
    slug: course.slug,
    title: course.title.replace(/\s+for ABHI$/i, ""),
    category: course.category || "Compliance",
    durationMinutes: course.durationMinutes || 30,
    mandatory: MANDATORY_BY_SLUG.get(course.slug) ?? true,
    progressPct: enrolment?.progressPct ?? 0,
    status,
    enrolmentStatus: enrolment?.status ?? null,
  };
}

function statusLabel(course: CatalogRow) {
  if (course.enrolmentStatus === "completed") return "Completed";
  if (course.enrolmentStatus === "in_progress") return "In progress";
  if (course.enrolmentStatus === "assigned") return "Assigned";
  if (course.mandatory) return "Mandatory";
  return "Optional";
}

function statusPillClass(course: CatalogRow) {
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
  course: CatalogRow;
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
  onLaunch,
  showAssign = false,
}: {
  rows: CatalogRow[];
  actionLabel?: string;
  onAssign?: (course: CatalogRow) => void;
  onLaunch?: (course: CatalogRow) => void;
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
                    onClick={() => onLaunch?.(course)}
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

function PlayerOverlay({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-[#070d18]">
      <WorkspaceErrorBoundary title="Course player" onReset={onClose}>
        <CoursePlayer courseSlug={slug} onClose={onClose} />
      </WorkspaceErrorBoundary>
    </div>
  );
}

function DashboardAssignedView() {
  const [tab, setTab] = useState<TabId>("assigned");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [certificates, setCertificates] = useState<LmsCertificate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [launchSlug, setLaunchSlug] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogRes, certRes] = await Promise.all([
        fetch("/api/lms/catalog", { cache: "no-store", credentials: "include" }),
        fetch("/api/lms/certificates", { cache: "no-store", credentials: "include" }),
      ]);
      const catalogData = await catalogRes.json();
      const certData = await certRes.json();
      if (!catalogRes.ok) throw new Error(catalogData.error ?? "Failed to load catalog");

      const items = (catalogData.courses ?? []) as Array<LmsCourse & { enrolment?: LmsEnrolment | null }>;
      setRows(
        items.map((item) =>
          toCatalogRow(item, item.enrolment ?? null),
        ),
      );
      setCertificates(
        certRes.ok && Array.isArray(certData.certificates)
          ? (certData.certificates as LmsCertificate[])
          : [],
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load training");
      setRows(ABHI_COMPLIANCE_COURSES.map((c) => ({ ...c, enrolmentStatus: null })));
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void reload();
    });
  }, [reload]);

  const filtered = useMemo(() => {
    if (tab === "assigned") return rows;
    if (tab === "in_progress") return rows.filter((c) => c.status === "in_progress");
    if (tab === "completed") return rows.filter((c) => c.status === "completed");
    return [];
  }, [tab, rows]);

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
        subtitle={
          isBrowserTalantonImpactSurface()
            ? "Your Talanton Impact training programme — launch courses in the live LMS player."
            : "Your ABHI compliance programme — launch courses in the live LMS player."
        }
      >
        {loading ? (
          <p className="mb-3 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
          </p>
        ) : null}
        {error ? (
          <p className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {error}
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
                {certificates.length === 0 ? (
                  <tr className="border-t border-white/8 text-white/55">
                    <td className="px-3 py-6" colSpan={4}>
                      Certificates appear here after you complete LMS assessments.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="border-t border-white/8 text-white/80">
                      <td className="px-3 py-2.5 font-medium text-white">{cert.courseTitle}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-sky-200/90">
                        {cert.certificateNumber}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{cert.score}%</td>
                      <td className="px-3 py-2.5 tabular-nums text-white/60">
                        {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("en-GB") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-white/45">
            No courses in this view yet. Ask an administrator to assign training from Courses.
          </p>
        ) : (
          <CourseTable
            rows={filtered}
            actionLabel={tab === "in_progress" ? "Resume" : "Launch"}
            onLaunch={(course) => setLaunchSlug(course.slug)}
          />
        )}
      </TqmsSection>

      {launchSlug ? (
        <PlayerOverlay
          slug={launchSlug}
          onClose={() => {
            setLaunchSlug(null);
            void reload();
          }}
        />
      ) : null}
    </div>
  );
}

function CoursesCatalogView() {
  const brand = useTrainingBrand();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [assignCourse, setAssignCourse] = useState<CatalogRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CatalogRow[]>(() =>
    typeof window !== "undefined" && isBrowserTalantonImpactSurface()
      ? []
      : ABHI_COMPLIANCE_COURSES,
  );
  const [launchSlug, setLaunchSlug] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [reviewCourse, setReviewCourse] = useState<LmsCourseTree | null>(null);
  const [reviewSummary, setReviewSummary] = useState<{
    title: string;
    durationMinutes: number;
    moduleCount: number;
    lessonCount: number;
    scenarioCount: number;
    assessmentCount: number;
    questionCount: number;
    certificateEnabled: boolean;
    learningObjectives?: string[];
  } | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const fallback =
      typeof window !== "undefined" && isBrowserTalantonImpactSurface()
        ? []
        : ABHI_COMPLIANCE_COURSES;
    try {
      const response = await fetch("/api/lms/courses?all=1", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load courses");
      const courses = (data.courses ?? []) as LmsCourse[];
      setRows(
        courses.length > 0
          ? courses.map((course) => toCatalogRow(course, null))
          : fallback,
      );
    } catch {
      setRows(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void reload();
    });
  }, [reload]);

  async function generateFromFile(file: File) {
    setGenerating(true);
    setGenError(null);
    setLastFile(file);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/lms/generate-from-document", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = (await res.json()) as {
        course?: LmsCourseTree;
        summary?: {
          title: string;
          durationMinutes: number;
          moduleCount: number;
          lessonCount: number;
          scenarioCount: number;
          assessmentCount: number;
          questionCount: number;
          certificateEnabled: boolean;
          learningObjectives?: string[];
        };
        error?: string;
      };
      if (!res.ok || !data.course || !data.summary) {
        throw new Error(data.error || "Course generation failed.");
      }
      setReviewCourse(data.course);
      setReviewSummary(data.summary);
      void reload();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Course generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-3xl border bg-gradient-to-br p-5",
          brand.accentBorder,
          brand.accentGradient,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p
              className={cn(
                "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]",
                brand.accentText,
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {brand.generatorLabel}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Upload a policy — get a complete interactive course
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-white/55">{brand.description}</p>
          </div>
          <button
            type="button"
            disabled={generating}
            onClick={() => fileInputRef.current?.click()}
            className={cn(tqmsPrimaryButtonClass(), "inline-flex items-center gap-2")}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {generating ? "Building course…" : "Upload PDF / Word"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void generateFromFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {genError ? (
          <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {genError}
          </p>
        ) : null}
      </div>

      <TqmsSection
        title="Courses"
        subtitle="Modern vertical learning experience. Assign to staff or launch the player."
        actions={
          <>
            <button
              type="button"
              onClick={() => setAssignCourse(rows[0] ?? null)}
              className={tqmsSecondaryButtonClass()}
              disabled={rows.length === 0}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assign to staff
            </button>
            <button type="button" onClick={() => setWizardOpen(true)} className={tqmsSecondaryButtonClass()}>
              <Plus className="h-3.5 w-3.5" />
              Manual builder
            </button>
          </>
        }
      >
        {loading ? (
          <p className="mb-3 flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading LMS catalogue…
          </p>
        ) : null}
        <CourseTable
          rows={rows}
          showAssign
          onAssign={setAssignCourse}
          onLaunch={(course) => setLaunchSlug(course.slug)}
        />
      </TqmsSection>

      {wizardOpen ? (
        <CreateCourseWizard
          suggestedCode={`ABHI-${String(rows.length + 1).padStart(3, "0")}`}
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

      {reviewCourse && reviewSummary ? (
        <CourseReviewScreen
          course={reviewCourse}
          summary={reviewSummary}
          regenerating={generating}
          onClose={() => {
            setReviewCourse(null);
            setReviewSummary(null);
          }}
          onRegenerate={
            lastFile
              ? () => {
                  void generateFromFile(lastFile);
                }
              : undefined
          }
          onPublished={(slug) => {
            setReviewCourse(null);
            setReviewSummary(null);
            setNotice(`“${slug}” published. Open it from the catalogue when ready.`);
            void reload();
          }}
        />
      ) : null}

      {launchSlug ? (
        <PlayerOverlay
          slug={launchSlug}
          onClose={() => {
            setLaunchSlug(null);
            void reload();
          }}
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
  return (
    <WorkspaceErrorBoundary title="Training">
      {mode === "dashboard" ? <DashboardAssignedView /> : <CoursesCatalogView />}
    </WorkspaceErrorBoundary>
  );
}
