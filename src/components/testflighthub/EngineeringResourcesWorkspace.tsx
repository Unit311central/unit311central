"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";

import {
  ENG_STATUSES,
  engStatusClass,
  type EngActivity,
  type EngEngineer,
  type EngProject,
} from "@/lib/engineering-data";
import {
  assignEngineerProject,
  updateEngineerAllocation,
} from "@/lib/engineering-mock-store";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";
import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";
import { useEngineeringMockStore } from "./useEngineeringMockStore";
import {
  WsEmpty,
  WsInputClass,
  WsLabelClass,
  WsSection,
  WsSlideOver,
  WsStatusPill,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
} from "./domain-workspace-ui";

const SLIDE_TABS = [
  "Overview",
  "Projects",
  "Skills",
  "Certifications",
  "Training",
  "Performance",
  "Equipment",
  "Leave",
  "Timesheets",
  "Notes",
  "Documents",
  "Activity",
] as const;

type SlideTab = (typeof SLIDE_TABS)[number];

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className={WsLabelClass()}>{label}</p>
      <div className="mt-1 text-sm text-white/85">{value ?? "—"}</div>
    </div>
  );
}

function engineerActivity(activity: EngActivity[], engineer: EngEngineer) {
  return activity.filter(
    (item) =>
      item.detail.includes(engineer.id) ||
      item.detail.includes(engineer.name) ||
      item.detail.includes(engineer.currentProject),
  );
}

function mockCertifications(engineer: EngEngineer) {
  const base = ["ISO 27001 awareness", "Secure SDLC"];
  if (engineer.skills.some((s) => s.toLowerCase().includes("aws") || s.toLowerCase().includes("vercel"))) {
    base.push("Cloud operations foundation");
  }
  if (engineer.department === "Quality") base.push("ISTQB Foundation");
  return base;
}

function EngineerDetailPanel({
  engineer,
  projects,
  activity,
  tab,
  basePath,
}: {
  engineer: EngEngineer;
  projects: EngProject[];
  activity: EngActivity[];
  tab: SlideTab;
  basePath: ReturnType<typeof useInternalOperationsBasePath>;
}) {
  const relatedProjects = projects.filter(
    (p) => p.team.includes(engineer.name) || p.name === engineer.currentProject,
  );
  const history = engineerActivity(activity, engineer);

  if (tab === "Overview") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCell label="Role" value={engineer.role} />
        <InfoCell label="Department" value={engineer.department} />
        <InfoCell label="Manager" value={engineer.manager} />
        <InfoCell label="Location" value={engineer.location} />
        <InfoCell label="Current Project" value={engineer.currentProject} />
        <InfoCell label="Allocation" value={`${engineer.allocationPct}%`} />
        <InfoCell label="Billable" value={`${engineer.billablePct}%`} />
        <InfoCell label="Availability" value={engineer.availability} />
        <InfoCell label="Leave" value={engineer.leave} />
        <InfoCell
          label="Status"
          value={
            <WsStatusPill className={engStatusClass(engineer.status)}>{engineer.status}</WsStatusPill>
          }
        />
      </div>
    );
  }

  if (tab === "Projects") {
    if (!relatedProjects.length) return <WsEmpty message="No linked projects for this engineer." />;
    return (
      <ul className="space-y-2">
        {relatedProjects.map((project) => (
          <li key={project.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">{project.name}</p>
                <p className="text-xs text-white/45">
                  {project.kind} · {project.sprint} · {project.progress}%
                </p>
              </div>
              <WsStatusPill className={engStatusClass(project.health)}>{project.health}</WsStatusPill>
            </div>
          </li>
        ))}
        <Link href={getInternalNavHref("projects", basePath)} className={WsSecondaryButtonClass()}>
          Open Projects
        </Link>
      </ul>
    );
  }

  if (tab === "Skills") {
    return (
      <div className="flex flex-wrap gap-2">
        {engineer.skills.map((skill) => (
          <WsStatusPill key={skill} className="border-sky-400/30 bg-sky-500/10 text-sky-100">
            {skill}
          </WsStatusPill>
        ))}
      </div>
    );
  }

  if (tab === "Certifications") {
    const certs = mockCertifications(engineer);
    return (
      <ul className="space-y-2">
        {certs.map((cert) => (
          <li key={cert} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80">
            {cert}
          </li>
        ))}
      </ul>
    );
  }

  if (tab === "Training") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-white/70">
          Assigned modules: Platform security refresher, {engineer.department} standards update.
        </p>
        <Link href={getInternalNavHref("training", basePath)} className={WsPrimaryButtonClass()}>
          Staff Training
        </Link>
        <Link href={getInternalNavHref("qms-training", basePath)} className={WsSecondaryButtonClass()}>
          QMS Training
        </Link>
      </div>
    );
  }

  if (tab === "Performance") {
    return (
      <div className="space-y-3">
        <InfoCell label="Last Review" value="Q2 2026 — Exceeds expectations" />
        <InfoCell label="Goals" value={`Delivery on ${engineer.currentProject}; mentor junior engineers.`} />
        <Link href={getInternalNavHref("hr-performance", basePath)} className={WsSecondaryButtonClass()}>
          Performance Hub
        </Link>
      </div>
    );
  }

  if (tab === "Equipment") {
    return (
      <ul className="space-y-2 text-sm text-white/80">
        <li className="rounded-xl border border-white/10 px-3 py-2">MacBook Pro 14&quot; · {engineer.location}</li>
        <li className="rounded-xl border border-white/10 px-3 py-2">Dock + dual monitor</li>
        <li className="rounded-xl border border-white/10 px-3 py-2">YubiKey hardware token</li>
      </ul>
    );
  }

  if (tab === "Leave") {
    return (
      <div className="space-y-3">
        <InfoCell label="Current Leave" value={engineer.leave} />
        <InfoCell label="Balance" value={engineer.status === "On Leave" ? "Approved — annual" : "25 days remaining"} />
        <Link href={getInternalNavHref("hr-leave", basePath)} className={WsPrimaryButtonClass()}>
          Leave Management
        </Link>
        <Link href={getInternalNavHref("hr", basePath)} className={WsSecondaryButtonClass()}>
          HR Records
        </Link>
      </div>
    );
  }

  if (tab === "Timesheets") {
    const hours = Math.round((engineer.allocationPct / 100) * 40);
    return (
      <div className="space-y-2">
        <InfoCell label="This Week" value={`${hours}h logged · ${engineer.billablePct}% billable`} />
        <InfoCell label="Project Split" value={`${engineer.currentProject} (${hours - 2}h), Overheads (2h)`} />
      </div>
    );
  }

  if (tab === "Notes") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/75">
        {engineer.name} is a strong contributor in {engineer.department}. Preferred contact for{" "}
        {engineer.skills[0] ?? "delivery"} workstreams.
      </div>
    );
  }

  if (tab === "Documents") {
    return (
      <ul className="space-y-2 text-sm">
        <li className="rounded-xl border border-white/10 px-3 py-2 text-white/80">Employment contract (PDF)</li>
        <li className="rounded-xl border border-white/10 px-3 py-2 text-white/80">NDA — signed 2024</li>
        <li className="rounded-xl border border-white/10 px-3 py-2 text-white/80">Equipment handover form</li>
      </ul>
    );
  }

  if (!history.length) return <WsEmpty message="No activity recorded for this engineer yet." />;
  return (
    <ul className="space-y-2">
      {history.map((item) => (
        <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-xs text-white/45">{item.detail}</p>
            </div>
            <p className="shrink-0 text-[11px] text-white/40">{formatWhen(item.at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function EngineeringResourcesWorkspace() {
  const basePath = useInternalOperationsBasePath();
  const store = useEngineeringMockStore();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selected, setSelected] = useState<EngEngineer | null>(null);
  const [tab, setTab] = useState<SlideTab>("Overview");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignProject, setAssignProject] = useState("");
  const [assignPct, setAssignPct] = useState(80);
  const [allocPct, setAllocPct] = useState(80);

  const roles = useMemo(
    () => [...new Set(store.engineers.map((e) => e.role))].sort(),
    [store.engineers],
  );
  const locations = useMemo(
    () => [...new Set(store.engineers.map((e) => e.location))].sort(),
    [store.engineers],
  );
  const projectNames = useMemo(() => {
    const fromEngineers = store.engineers.map((e) => e.currentProject);
    const fromStore = store.projects.map((p) => p.name);
    return [...new Set([...fromStore, ...fromEngineers])].sort();
  }, [store.engineers, store.projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.engineers.filter((engineer) => {
      if (roleFilter !== "all" && engineer.role !== roleFilter) return false;
      if (locationFilter !== "all" && engineer.location !== locationFilter) return false;
      if (statusFilter !== "all" && engineer.status !== statusFilter) return false;
      if (projectFilter !== "all" && engineer.currentProject !== projectFilter) return false;
      if (!q) return true;
      return (
        engineer.name.toLowerCase().includes(q) ||
        engineer.role.toLowerCase().includes(q) ||
        engineer.department.toLowerCase().includes(q) ||
        engineer.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [store.engineers, query, roleFilter, locationFilter, statusFilter, projectFilter]);

  function openEngineer(engineer: EngEngineer) {
    setSelected(engineer);
    setTab("Overview");
    setAssignOpen(false);
    setAssignProject(engineer.currentProject === "Unassigned" ? store.projects[0]?.name ?? "" : engineer.currentProject);
    setAssignPct(engineer.allocationPct);
    setAllocPct(engineer.allocationPct);
  }

  function submitAssign() {
    if (!selected || !assignProject) return;
    assignEngineerProject(selected.id, assignProject, assignPct);
    setAssignOpen(false);
    setSelected((current) =>
      current ? { ...current, currentProject: assignProject, allocationPct: assignPct } : null,
    );
  }

  function submitAllocation() {
    if (!selected) return;
    updateEngineerAllocation(selected.id, allocPct);
    setSelected((current) => (current ? { ...current, allocationPct: allocPct } : null));
  }

  const liveSelected = selected
    ? store.engineers.find((e) => e.id === selected.id) ?? selected
    : null;

  return (
    <div className="space-y-5">
      <WsSection title="Engineer Directory" subtitle="Search, filter, and manage allocations.">
        <div className="grid gap-3 lg:grid-cols-5">
          <label className="lg:col-span-2">
            <span className={WsLabelClass()}>Search</span>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, role, skills…"
                className={cn(WsInputClass(), "pl-9")}
              />
            </div>
          </label>
          <label>
            <span className={WsLabelClass()}>Role</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={WsInputClass()}>
              <option value="all">All roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={WsLabelClass()}>Location</span>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className={WsInputClass()}>
              <option value="all">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={WsLabelClass()}>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={WsInputClass()}>
              <option value="all">All statuses</option>
              {ENG_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="lg:col-span-5 sm:max-w-xs">
            <span className={WsLabelClass()}>Project</span>
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={WsInputClass()}>
              <option value="all">All projects</option>
              {projectNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </WsSection>

      <WsSection
        title="Resources"
        subtitle={`${filtered.length} engineer${filtered.length === 1 ? "" : "s"} matching filters.`}
        actions={
          <Link href={getInternalNavHref("engineering-capacity", basePath)} className={WsSecondaryButtonClass()}>
            Capacity View
          </Link>
        }
      >
        {filtered.length === 0 ? (
          <WsEmpty message="No engineers match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  {[
                    "Engineer",
                    "Role",
                    "Department",
                    "Manager",
                    "Skills",
                    "Current Project",
                    "Allocation %",
                    "Billable %",
                    "Availability",
                    "Leave",
                    "Location",
                    "Status",
                  ].map((col) => (
                    <th key={col} className="px-3 py-2 font-medium">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((engineer) => (
                  <tr
                    key={engineer.id}
                    onClick={() => openEngineer(engineer)}
                    className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.04]"
                  >
                    <td className="px-3 py-2.5 font-medium text-white">{engineer.name}</td>
                    <td className="px-3 py-2.5 text-white/75">{engineer.role}</td>
                    <td className="px-3 py-2.5 text-white/75">{engineer.department}</td>
                    <td className="px-3 py-2.5 text-white/75">{engineer.manager}</td>
                    <td className="max-w-[160px] truncate px-3 py-2.5 text-white/60">{engineer.skills.join(", ")}</td>
                    <td className="px-3 py-2.5 text-white/75">{engineer.currentProject}</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/75">{engineer.allocationPct}%</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/75">{engineer.billablePct}%</td>
                    <td className="px-3 py-2.5 text-white/75">{engineer.availability}</td>
                    <td className="px-3 py-2.5 text-white/60">{engineer.leave}</td>
                    <td className="px-3 py-2.5 text-white/75">{engineer.location}</td>
                    <td className="px-3 py-2.5">
                      <WsStatusPill className={engStatusClass(engineer.status)}>{engineer.status}</WsStatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WsSection>

      {liveSelected ? (
        <WsSlideOver
          title={liveSelected.name}
          subtitle={`${liveSelected.role} · ${liveSelected.department}`}
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setAssignOpen((v) => !v)} className={WsPrimaryButtonClass()}>
                Assign Project
              </button>
              <button
                type="button"
                onClick={() => {
                  submitAllocation();
                  setTab("Activity");
                }}
                className={WsSecondaryButtonClass()}
              >
                Change Allocation
              </button>
              <button
                type="button"
                onClick={() => setTab("Activity")}
                className={WsSecondaryButtonClass()}
              >
                <History className="h-3.5 w-3.5" />
                View History
              </button>
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-1">
            {SLIDE_TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn(
                  "rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors",
                  tab === item
                    ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.06]",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          {assignOpen ? (
            <div className="mb-4 rounded-xl border border-sky-400/25 bg-sky-500/10 p-4">
              <p className="text-sm font-medium text-white">Assign project</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={WsLabelClass()}>Project</span>
                  <select
                    value={assignProject}
                    onChange={(e) => setAssignProject(e.target.value)}
                    className={WsInputClass()}
                  >
                    {store.projects.map((project) => (
                      <option key={project.id} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={WsLabelClass()}>Allocation %</span>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={assignPct}
                    onChange={(e) => setAssignPct(Number(e.target.value))}
                    className={WsInputClass()}
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button type="button" onClick={submitAssign} className={WsPrimaryButtonClass()}>
                    Save
                  </button>
                  <button type="button" onClick={() => setAssignOpen(false)} className={WsSecondaryButtonClass()}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium text-white">Quick allocation</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <label className="min-w-[120px]">
                <span className={WsLabelClass()}>Allocation %</span>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={allocPct}
                  onChange={(e) => setAllocPct(Number(e.target.value))}
                  className={WsInputClass()}
                />
              </label>
              <button type="button" onClick={submitAllocation} className={WsSecondaryButtonClass()}>
                Update
              </button>
            </div>
          </div>

          <EngineerDetailPanel
            engineer={liveSelected}
            projects={store.projects}
            activity={store.activity}
            tab={tab}
            basePath={basePath}
          />
        </WsSlideOver>
      ) : null}
    </div>
  );
}
