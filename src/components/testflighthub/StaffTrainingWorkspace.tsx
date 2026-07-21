"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState, startTransition } from "react";

import {
  TQMS_LEARNER_STATUSES,
  TQMS_PANEL_TABS,
  tqmsStatusClass,
  type TqmsLearner,
  type TqmsPanelTab,
} from "@/lib/tqms-data";
import {
  addLearnerNote,
  assignCourse,
  createCourse,
  issueCertificate,
  recordCompletion,
  removeAssignment,
  type TqmsMockState,
} from "@/lib/tqms-mock-store";
import { cn } from "@/lib/utils";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsSlideOver,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type Filters = {
  search: string;
  department: string;
  location: string;
  role: string;
  manager: string;
  status: string;
  learningPath: string;
};

const ALL = "all";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function defaultCertExpiry() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function uniqueValues(learners: TqmsLearner[], pick: (row: TqmsLearner) => string) {
  return [...new Set(learners.map(pick))].sort();
}

function computeLearnerStats(learnerId: string, store: TqmsMockState) {
  const assignments = store.assignments.filter((row) => row.learnerId === learnerId);
  const certificates = store.certificates.filter((row) => row.learnerId === learnerId);
  const assignedCount = assignments.length;
  const completedCount = assignments.filter((row) => row.status === "Completed").length;
  const progress =
    assignments.length === 0
      ? 0
      : Math.round(assignments.reduce((sum, row) => sum + row.progress, 0) / assignments.length);
  const mandatoryOutstanding = assignments.filter(
    (row) => row.mandatory && row.status !== "Completed",
  ).length;
  const nextRenewal =
    certificates.length === 0
      ? null
      : [...certificates].sort(
          (a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt),
        )[0]?.expiresAt ?? null;

  return {
    assignments,
    certificates,
    assignedCount,
    completedCount,
    progress,
    mandatoryOutstanding,
    certCount: certificates.length,
    nextRenewal,
  };
}

function filterSelectClass() {
  return cn(tqmsInputClass(), "mt-0 py-1.5 text-xs");
}

export default function StaffTrainingWorkspace() {
  const store = useTqmsMockStore();
  const [filters, setFilters] = useState<Filters>({
    search: "",
    department: ALL,
    location: ALL,
    role: ALL,
    manager: ALL,
    status: ALL,
    learningPath: ALL,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<TqmsPanelTab>("Overview");
  const [assignCourseId, setAssignCourseId] = useState("");
  const [certTitle, setCertTitle] = useState("");
  const [certExpiry, setCertExpiry] = useState(defaultCertExpiry);
  const [noteText, setNoteText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filterOptions = useMemo(
    () => ({
      departments: uniqueValues(store.learners, (row) => row.department),
      locations: uniqueValues(store.learners, (row) => row.location),
      roles: uniqueValues(store.learners, (row) => row.role),
      managers: uniqueValues(store.learners, (row) => row.manager),
      learningPaths: uniqueValues(store.learners, (row) => row.learningPath),
    }),
    [store.learners],
  );

  const courseById = useMemo(
    () => new Map(store.courses.map((course) => [course.id, course])),
    [store.courses],
  );

  const rows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return store.learners
      .filter((learner) => {
        if (filters.department !== ALL && learner.department !== filters.department) return false;
        if (filters.location !== ALL && learner.location !== filters.location) return false;
        if (filters.role !== ALL && learner.role !== filters.role) return false;
        if (filters.manager !== ALL && learner.manager !== filters.manager) return false;
        if (filters.status !== ALL && learner.status !== filters.status) return false;
        if (filters.learningPath !== ALL && learner.learningPath !== filters.learningPath) {
          return false;
        }
        if (!query) return true;
        return (
          learner.name.toLowerCase().includes(query) ||
          learner.role.toLowerCase().includes(query) ||
          learner.department.toLowerCase().includes(query) ||
          learner.learningPath.toLowerCase().includes(query)
        );
      })
      .map((learner) => ({ learner, stats: computeLearnerStats(learner.id, store) }));
  }, [filters, store]);

  const selected = store.learners.find((row) => row.id === selectedId) ?? null;
  const selectedStats = selected ? computeLearnerStats(selected.id, store) : null;
  const selectedAssessments = selected
    ? store.assessments.filter((row) => row.learnerId === selected.id)
    : [];
  const selectedNotes = selected ? store.notes.filter((row) => row.learnerId === selected.id) : [];
  const selectedPath =
    selected &&
    store.learningPaths.find(
      (path) =>
        path.name === selected.learningPath ||
        selected.learningPath.includes(path.name) ||
        path.name.includes(selected.learningPath),
    );
  const selectedHistory = selected
    ? store.activity.filter((item) => item.detail.includes(selected.name))
    : [];
  const assignableCourses = selected
    ? store.courses.filter(
        (course) =>
          course.status === "Published" &&
          !selectedStats?.assignments.some((row) => row.courseId === course.id),
      )
    : [];

  function patchFilters(patch: Partial<Filters>) {
    startTransition(() => setFilters((current) => ({ ...current, ...patch })));
  }

  function openLearner(id: string) {
    setSelectedId(id);
    setPanelTab("Overview");
    setAssignCourseId("");
    setCertTitle("");
    setCertExpiry(defaultCertExpiry());
    setNoteText("");
    setActionError(null);
  }

  function runAction(action: () => void) {
    setActionError(null);
    try {
      action();
      setNotice("Changes saved.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Action failed.");
    }
  }

  function handleCreateCourse() {
    createCourse({
      code: `TRN-${String(store.courses.length + 100).padStart(3, "0")}`,
      title: "Staff Operations Course",
      category: "Operations",
      mandatory: false,
      durationHours: 2,
      status: "Published",
      owner: "People Ops",
    });
    setNotice("Course published to the catalogue.");
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <TqmsSection
        title="Staff Training"
        subtitle="Assign courses, track completion, and manage certifications across the organisation."
        actions={
          <button type="button" onClick={handleCreateCourse} className={tqmsPrimaryButtonClass()}>
            <Plus className="h-3.5 w-3.5" />
            Create Course
          </button>
        }
      >
        <div className="grid gap-2 lg:grid-cols-4 xl:grid-cols-8">
          <label className="relative lg:col-span-2 xl:col-span-2">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
            <input
              value={filters.search}
              onChange={(event) => patchFilters({ search: event.target.value })}
              placeholder="Search employees…"
              className={cn(filterSelectClass(), "pl-9")}
            />
          </label>
          {(
            [
              ["Department", "department", filterOptions.departments],
              ["Location", "location", filterOptions.locations],
              ["Role", "role", filterOptions.roles],
              ["Manager", "manager", filterOptions.managers],
              ["Status", "status", [...TQMS_LEARNER_STATUSES]],
              ["Learning Path", "learningPath", filterOptions.learningPaths],
            ] as const
          ).map(([label, key, options]) => (
            <label key={key}>
              <span className={tqmsLabelClass()}>{label}</span>
              <select
                value={filters[key]}
                onChange={(event) => patchFilters({ [key]: event.target.value } as Partial<Filters>)}
                className={filterSelectClass()}
              >
                <option value={ALL}>All</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                <th className="px-3 py-2.5">Employee</th>
                <th className="px-3 py-2.5">Assigned Courses</th>
                <th className="px-3 py-2.5">Completed</th>
                <th className="px-3 py-2.5">Progress %</th>
                <th className="px-3 py-2.5">Mandatory Outstanding</th>
                <th className="px-3 py-2.5">Certificates</th>
                <th className="px-3 py-2.5">Next Renewal</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6">
                    <TqmsEmpty message="No employees match the current filters." />
                  </td>
                </tr>
              ) : (
                rows.map(({ learner, stats }) => (
                  <tr
                    key={learner.id}
                    onClick={() => openLearner(learner.id)}
                    className="cursor-pointer border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.04]"
                  >
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-white">{learner.name}</p>
                      <p className="text-xs text-white/45">
                        {learner.role} · {learner.department}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/80">{stats.assignedCount}</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/80">{stats.completedCount}</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/80">{stats.progress}%</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/80">
                      {stats.mandatoryOutstanding}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/80">{stats.certCount}</td>
                    <td className="px-3 py-2.5 text-white/65">{formatDate(stats.nextRenewal)}</td>
                    <td className="px-3 py-2.5">
                      <TqmsStatusPill className={tqmsStatusClass(learner.status)}>
                        {learner.status}
                      </TqmsStatusPill>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </TqmsSection>

      {selected && selectedStats ? (
        <TqmsSlideOver
          title={selected.name}
          subtitle={`${selected.role} · ${selected.department} · ${selected.learningPath}`}
          onClose={() => setSelectedId(null)}
        >
          {actionError ? (
            <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {actionError}
            </p>
          ) : null}

          <div className="mb-4 flex flex-wrap gap-1 border-b border-white/10 pb-2">
            {TQMS_PANEL_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPanelTab(tab)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  panelTab === tab
                    ? "bg-white/10 text-white"
                    : "text-white/45 hover:bg-white/[0.05] hover:text-white/75",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {panelTab === "Overview" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Manager", selected.manager],
                ["Location", selected.location],
                ["Start date", formatDate(selected.startDate)],
                ["Assigned courses", String(selectedStats.assignedCount)],
                ["Completed", String(selectedStats.completedCount)],
                ["Progress", `${selectedStats.progress}%`],
                ["Mandatory outstanding", String(selectedStats.mandatoryOutstanding)],
                ["Next renewal", formatDate(selectedStats.nextRenewal)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className={tqmsLabelClass()}>{label}</p>
                  <p className="mt-1 text-sm text-white">{value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {panelTab === "Courses" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <label className="min-w-[200px] flex-1">
                  <span className={tqmsLabelClass()}>Assign course</span>
                  <select
                    value={assignCourseId}
                    onChange={(event) => setAssignCourseId(event.target.value)}
                    className={tqmsInputClass()}
                  >
                    <option value="">Select course…</option>
                    {assignableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} — {course.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!assignCourseId}
                  className={tqmsPrimaryButtonClass(!assignCourseId)}
                  onClick={() =>
                    runAction(() => {
                      assignCourse(selected.id, assignCourseId);
                      setAssignCourseId("");
                    })
                  }
                >
                  Assign Course
                </button>
              </div>
              {selectedStats.assignments.length === 0 ? (
                <TqmsEmpty message="No courses assigned to this employee yet." />
              ) : (
                <ul className="space-y-2">
                  {selectedStats.assignments.map((assignment) => {
                    const course = courseById.get(assignment.courseId);
                    return (
                      <li
                        key={assignment.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {course?.title ?? "Unknown course"}
                            </p>
                            <p className="text-xs text-white/45">
                              Due {formatDate(assignment.dueDate)} · {assignment.progress}% complete
                            </p>
                          </div>
                          <TqmsStatusPill className={tqmsStatusClass(assignment.status)}>
                            {assignment.status}
                          </TqmsStatusPill>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {assignment.status !== "Completed" ? (
                            <button
                              type="button"
                              className={tqmsPrimaryButtonClass()}
                              onClick={() => runAction(() => recordCompletion(assignment.id))}
                            >
                              Record Completion
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={tqmsSecondaryButtonClass()}
                            onClick={() => runAction(() => removeAssignment(assignment.id))}
                          >
                            Remove Course
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}

          {panelTab === "Certificates" ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm font-medium text-white">Issue certificate</p>
                <label className="mt-3 block">
                  <span className={tqmsLabelClass()}>Title</span>
                  <input
                    value={certTitle}
                    onChange={(event) => setCertTitle(event.target.value)}
                    placeholder="Certificate title"
                    className={tqmsInputClass()}
                  />
                </label>
                <label className="mt-3 block">
                  <span className={tqmsLabelClass()}>Expiry date</span>
                  <input
                    type="date"
                    value={certExpiry}
                    onChange={(event) => setCertExpiry(event.target.value)}
                    className={tqmsInputClass()}
                  />
                </label>
                <button
                  type="button"
                  disabled={!certTitle.trim()}
                  className={cn("mt-3", tqmsPrimaryButtonClass(!certTitle.trim()))}
                  onClick={() =>
                    runAction(() => {
                      issueCertificate({
                        learnerId: selected.id,
                        title: certTitle.trim(),
                        expiresAt: certExpiry || defaultCertExpiry(),
                      });
                      setCertTitle("");
                      setCertExpiry(defaultCertExpiry());
                    })
                  }
                >
                  Issue Certificate
                </button>
              </div>
              {selectedStats.certificates.length === 0 ? (
                <TqmsEmpty message="No certificates on file for this employee." />
              ) : (
                <ul className="space-y-2">
                  {selectedStats.certificates.map((cert) => (
                    <li
                      key={cert.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <p className="text-sm font-medium text-white">{cert.title}</p>
                      <p className="text-xs text-white/45">
                        Issued {formatDate(cert.issuedAt)} · Expires {formatDate(cert.expiresAt)}
                      </p>
                      <p className="mt-1 text-xs text-white/40">Issuer: {cert.issuer}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {panelTab === "Assessments" ? (
            selectedAssessments.length === 0 ? (
              <TqmsEmpty message="No assessments scheduled for this employee." />
            ) : (
              <ul className="space-y-2">
                {selectedAssessments.map((assessment) => (
                  <li
                    key={assessment.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{assessment.title}</p>
                      <p className="text-xs text-white/45">Due {formatDate(assessment.dueDate)}</p>
                    </div>
                    <TqmsStatusPill className={tqmsStatusClass(assessment.status)}>
                      {assessment.score != null ? `${assessment.score}% · ${assessment.status}` : assessment.status}
                    </TqmsStatusPill>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {panelTab === "Learning Path" ? (
            selectedPath ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-sm font-medium text-white">{selectedPath.name}</p>
                  <p className="mt-1 text-sm text-white/50">{selectedPath.description}</p>
                  <p className="mt-2 text-xs text-white/45">
                    {selectedPath.completionPercent}% complete · {selectedPath.moduleCount} modules ·{" "}
                    {selectedPath.estimatedHours}h estimated
                  </p>
                </div>
                <ul className="space-y-2">
                  {selectedPath.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-white">{lesson.title}</p>
                        <p className="text-xs text-white/45">
                          {lesson.kind} · {lesson.durationMins} min
                        </p>
                      </div>
                      <TqmsStatusPill className={tqmsStatusClass(lesson.done ? "Complete" : "In Progress")}>
                        {lesson.done ? "Done" : "Pending"}
                      </TqmsStatusPill>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <TqmsEmpty message={`No structured learning path mapped to "${selected.learningPath}".`} />
            )
          ) : null}

          {panelTab === "History" ? (
            selectedHistory.length === 0 ? (
              <TqmsEmpty message="No recorded activity for this employee yet." />
            ) : (
              <ul className="space-y-2">
                {selectedHistory.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/45">{item.detail}</p>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {panelTab === "Notes" ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <label>
                  <span className={tqmsLabelClass()}>Add note</span>
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    rows={3}
                    placeholder="Training note for this employee…"
                    className={cn(tqmsInputClass(), "resize-none")}
                  />
                </label>
                <button
                  type="button"
                  disabled={!noteText.trim()}
                  className={cn("mt-3", tqmsPrimaryButtonClass(!noteText.trim()))}
                  onClick={() =>
                    runAction(() => {
                      addLearnerNote(selected.id, noteText.trim());
                      setNoteText("");
                    })
                  }
                >
                  Add Note
                </button>
              </div>
              {selectedNotes.length === 0 ? (
                <TqmsEmpty message="No notes recorded for this employee." />
              ) : (
                <ul className="space-y-2">
                  {selectedNotes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <p className="text-sm text-white">{note.text}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {note.author} · {formatDate(note.at.slice(0, 10))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}
