"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { ManagedClient } from "@/lib/client-management-data";
import { ganttBarStyle, type ProjectTask } from "@/lib/project-detail-data";
import { getPortfolioProject } from "@/lib/project-portfolios";
import { formatProjectDate, type InternalProject } from "@/lib/projects-data";
import { fetchCachedJson, PLATFORM_CACHE_KEYS } from "@/lib/platform-fetch-cache";
import { createInitialUsers, type ManagedUser } from "@/lib/user-management-data";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Diamond,
  FolderOpen,
  Loader2,
  Milestone,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";

type ProjectDetailWorkspaceProps = {
  project: InternalProject;
  onBack?: () => void;
  clients?: ManagedClient[];
  /** When true, omit the back control (used inside master-detail layouts). */
  embedded?: boolean;
  /** Fired when task changes update project.progressPct for KPI strips / lists. */
  onProjectProgressChange?: (projectId: string, progressPct: number) => void;
};

const RESOURCE_MANUAL = "__manual__";

function panelClassName() {
  return "rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6";
}

function taskStatusLabel(progress: number) {
  if (progress >= 100) return "Complete";
  if (progress > 0) return "In progress";
  return "Not started";
}

function taskStatusClass(progress: number) {
  if (progress >= 100) return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
  if (progress > 0) return "border-sky-400/40 bg-sky-500/15 text-sky-300";
  return "border-white/15 bg-white/[0.04] text-white/55";
}

function inputClassName() {
  return "w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-xs text-white outline-none focus:border-sky-400/50";
}

function TaskResourceField({
  value,
  users,
  onChange,
  className,
}: {
  value: string;
  users: ManagedUser[];
  onChange: (resource: string) => void;
  className?: string;
}) {
  const userNames = useMemo(
    () =>
      Array.from(
        new Set(
          users
            .map((user) => user.fullName.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [users],
  );
  const matchedUser = userNames.includes(value.trim());
  const selectValue = matchedUser ? value.trim() : value.trim() ? RESOURCE_MANUAL : "";

  return (
    <div className={cn("flex min-w-[9rem] flex-col gap-1.5", className)}>
      <select
        value={selectValue}
        onChange={(event) => {
          const next = event.target.value;
          if (next === RESOURCE_MANUAL) {
            onChange(matchedUser ? "" : value);
            return;
          }
          onChange(next);
        }}
        className={inputClassName()}
        aria-label="Resource"
      >
        <option value="">Unassigned</option>
        {userNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={RESOURCE_MANUAL}>Manual entry…</option>
      </select>
      {selectValue === RESOURCE_MANUAL ? (
        <input
          className={inputClassName()}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type resource name"
          aria-label="Manual resource"
        />
      ) : null}
    </div>
  );
}

export default function ProjectDetailWorkspace({
  project,
  onBack,
  clients,
  embedded = false,
  onProjectProgressChange,
}: ProjectDetailWorkspaceProps) {
  const basePath = useInternalOperationsBasePath();
  const portfolio = useMemo(() => getPortfolioProject(project.id), [project.id]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayProgress, setDisplayProgress] = useState(project.progressPct);
  const [resourceUsers, setResourceUsers] = useState<ManagedUser[]>(() =>
    createInitialUsers().filter((user) => user.status === "Active"),
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [draftName, setDraftName] = useState("New task");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftResource, setDraftResource] = useState(project.operator || "");
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const client = useMemo(
    () =>
      portfolio?.kind === "internal"
        ? null
        : clients?.find(
            (entry) =>
              entry.id === project.clientId || entry.companyName === project.clientName,
          ) ?? null,
    [clients, portfolio?.kind, project.clientId, project.clientName],
  );

  const folderId = client?.filesFolderId ?? null;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}/tasks`, { cache: "no-store" });
      const data = (await response.json()) as {
        tasks?: ProjectTask[];
        progressPct?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Failed to load tasks");
      setTasks(data.tasks ?? []);
      if (typeof data.progressPct === "number") {
        setDisplayProgress(data.progressPct);
        onProjectProgressChange?.(project.id, data.progressPct);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [onProjectProgressChange, project.id]);

  useEffect(() => {
    void loadTasks();
    return () => {
      Object.values(saveTimers.current).forEach((timer) => clearTimeout(timer));
      saveTimers.current = {};
    };
  }, [loadTasks]);

  useEffect(() => {
    setDisplayProgress(project.progressPct);
  }, [project.id, project.progressPct]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        let nextUsers: ManagedUser[] = [];
        try {
          const messagingUsers = await fetchCachedJson<{ users?: ManagedUser[] }>(
            "messaging-operators",
            "/api/messaging/operators",
            { ttlMs: 60_000 },
          );
          nextUsers = messagingUsers.users ?? [];
        } catch {
          const data = await fetchCachedJson<{ users?: ManagedUser[] }>(
            PLATFORM_CACHE_KEYS.users,
            "/api/users",
            { ttlMs: 120_000 },
          );
          nextUsers = data.users ?? [];
        }
        if (nextUsers.length === 0) {
          nextUsers = createInitialUsers().filter((user) => user.status === "Active");
        }
        if (!cancelled) setResourceUsers(nextUsers.filter((user) => user.status === "Active"));
      } catch {
        if (!cancelled) {
          setResourceUsers(createInitialUsers().filter((user) => user.status === "Active"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ganttRange = useMemo(() => {
    if (tasks.length === 0) {
      const start = project.startDate ? new Date(`${project.startDate}T12:00:00`) : new Date();
      const end = project.endDate
        ? new Date(`${project.endDate}T12:00:00`)
        : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      return { start, end };
    }

    const starts = tasks.map((task) => new Date(`${task.startDate}T12:00:00`).getTime());
    const ends = tasks.map((task) => new Date(`${task.dueDate}T12:00:00`).getTime());
    const pad = 2 * 24 * 60 * 60 * 1000;
    return {
      start: new Date(Math.min(...starts) - pad),
      end: new Date(Math.max(...ends) + pad),
    };
  }, [tasks, project.startDate, project.endDate]);

  const milestones = useMemo(() => tasks.filter((task) => task.milestone), [tasks]);

  function applyProgress(progressPct: number) {
    setDisplayProgress(progressPct);
    onProjectProgressChange?.(project.id, progressPct);
  }

  function openAddForm() {
    setDraftName("New task");
    setDraftDescription("");
    setDraftResource(project.operator || "");
    setShowAddForm(true);
    setError(null);
  }

  async function persistTask(taskId: string, patch: Partial<ProjectTask>) {
    setError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await response.json()) as {
        tasks?: ProjectTask[];
        progressPct?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Failed to save task");
      if (data.tasks) setTasks(data.tasks);
      if (typeof data.progressPct === "number") applyProgress(data.progressPct);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save task");
      void loadTasks();
    }
  }

  function updateTaskLocal(id: string, patch: Partial<ProjectTask>, persist = true) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );

    if (!persist) return;

    const existing = saveTimers.current[id];
    if (existing) clearTimeout(existing);
    saveTimers.current[id] = setTimeout(() => {
      void persistTask(id, patch);
    }, 350);
  }

  async function handleAddTask() {
    const name = draftName.trim();
    if (!name) {
      setError("Task name is required");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: draftDescription.trim(),
          resource: draftResource.trim(),
          progress: 0,
          milestone: false,
          critical: false,
        }),
      });
      const data = (await response.json()) as {
        tasks?: ProjectTask[];
        progressPct?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Failed to add task");
      setTasks(data.tasks ?? []);
      if (typeof data.progressPct === "number") applyProgress(data.progressPct);
      setShowAddForm(false);
      setDraftName("New task");
      setDraftDescription("");
      setDraftResource(project.operator || "");
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Failed to add task");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!window.confirm("Delete this task?")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}/tasks/${taskId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as {
        tasks?: ProjectTask[];
        progressPct?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? "Failed to delete task");
      setTasks(data.tasks ?? []);
      if (typeof data.progressPct === "number") applyProgress(data.progressPct);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete task");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {!embedded && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to projects
            </button>
          ) : null}
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
              Project detail
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">{project.name}</h2>
            <p className="mt-1 text-sm text-white/50">
              {portfolio?.kind === "internal"
                ? `Department · ${portfolio.department ?? project.clientName}`
                : project.clientName}
              {project.site ? ` · ${project.site}` : ""}
            </p>
            <p className="mt-1 text-xs text-white/40">
              Start {formatProjectDate(project.startDate)}
              {project.endDate ? ` · End ${formatProjectDate(project.endDate)}` : ""}
              {portfolio?.projectManager || project.operator
                ? ` · PM ${portfolio?.projectManager ?? project.operator}`
                : ""}
              {portfolio?.accountManager ? ` · AM ${portfolio.accountManager}` : ""}
            </p>
          </div>
        </div>

        {folderId ? (
          <Link
            href={`${basePath}?view=files-internal&folderId=${encodeURIComponent(folderId)}`}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-xs font-semibold text-sky-300 transition-colors hover:border-sky-400/60 hover:bg-sky-500/25"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Project folder
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/35">
            <FolderOpen className="h-3.5 w-3.5" />
            No linked folder
          </span>
        )}
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {portfolio ? (
        <section className={panelClassName()}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                {portfolio.kind === "internal" ? "Budget" : "Contract value"}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {portfolio.contractValueLabel ?? portfolio.budgetLabel}
              </p>
            </div>
            {portfolio.kind === "external" ? (
              <>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                    Delivery status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {portfolio.deliveryStatus ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                    Billing status
                  </p>
                  <p className="mt-1 text-sm text-white/80">{portfolio.billingStatus ?? "—"}</p>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Stakeholders
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {(portfolio.stakeholders ?? []).join(" · ") || "—"}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Progress</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-white">
                {displayProgress.toFixed(0)}%
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className={panelClassName()}>
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Project progress</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-white">
            {displayProgress.toFixed(0)}% · averaged from tasks
          </p>
        </section>
      )}

      <section className={panelClassName()}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Tasks</h3>
            <p className="mt-1 text-xs text-white/45">
              {tasks.length} tasks · add, edit, or delete — updates Avg Progress on dashboards
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-white/40">
              <span className="inline-flex items-center gap-1">
                <Diamond className="h-3 w-3 text-amber-300" />
                Milestone
              </span>
              <span className="inline-flex items-center gap-1">
                <Zap className="h-3 w-3 text-rose-300" />
                Critical
              </span>
            </div>
            <button
              type="button"
              onClick={openAddForm}
              disabled={busy || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/25 disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </button>
          </div>
        </div>

        {showAddForm ? (
          <div className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">New task</p>
                <p className="mt-0.5 text-xs text-white/45">
                  Name, description, and resource before saving
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white"
                aria-label="Close add task form"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                  Task name
                </span>
                <input
                  className={cn(inputClassName(), "mt-1.5")}
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Task name"
                  autoFocus
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                  Description
                </span>
                <textarea
                  className={cn(inputClassName(), "mt-1.5 min-h-[4.5rem] resize-y")}
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                  placeholder="What needs to be done…"
                />
              </label>
              <div className="block sm:col-span-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                  Resource
                </span>
                <div className="mt-1.5">
                  <TaskResourceField
                    value={draftResource}
                    users={resourceUsers}
                    onChange={setDraftResource}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={busy}
                className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAddTask()}
                disabled={busy || !draftName.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Save task
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-white/45">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tasks…
          </div>
        ) : tasks.length === 0 && !showAddForm ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
            <p className="text-sm text-white/55">No tasks yet.</p>
            <button
              type="button"
              onClick={openAddForm}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add first task
            </button>
          </div>
        ) : tasks.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                  <th className="pb-2 pr-3 font-medium">Task</th>
                  <th className="pb-2 pr-3 font-medium">Start</th>
                  <th className="pb-2 pr-3 font-medium">Due</th>
                  <th className="pb-2 pr-3 font-medium">Progress</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Resource</th>
                  <th className="pb-2 pr-3 font-medium">Flags</th>
                  <th className="pb-2 pr-3 font-medium">Timeline</th>
                  <th className="pb-2 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const bar = ganttBarStyle(
                    task.startDate,
                    task.dueDate,
                    ganttRange.start,
                    ganttRange.end,
                  );

                  return (
                    <tr key={task.id} className="border-b border-white/[0.05] last:border-0">
                      <td className="py-3 pr-3 align-top">
                        <input
                          className={cn(inputClassName(), "min-w-[12rem] font-medium")}
                          value={task.name}
                          onChange={(event) =>
                            updateTaskLocal(task.id, { name: event.target.value })
                          }
                          aria-label="Task name"
                        />
                        <textarea
                          className={cn(inputClassName(), "mt-1.5 min-h-[3.25rem] min-w-[12rem] resize-y text-white/70")}
                          value={task.description ?? ""}
                          onChange={(event) =>
                            updateTaskLocal(task.id, { description: event.target.value })
                          }
                          placeholder="Description"
                          aria-label="Task description"
                        />
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <input
                          type="date"
                          className={inputClassName()}
                          value={task.startDate}
                          onChange={(event) =>
                            updateTaskLocal(task.id, { startDate: event.target.value })
                          }
                        />
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <input
                          type="date"
                          className={inputClassName()}
                          value={task.dueDate}
                          onChange={(event) =>
                            updateTaskLocal(task.id, { dueDate: event.target.value })
                          }
                        />
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <div className="flex min-w-[8rem] items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={task.progress}
                            onChange={(event) =>
                              updateTaskLocal(task.id, {
                                progress: Number(event.target.value),
                              })
                            }
                            className="h-1.5 w-full accent-sky-500"
                            aria-label={`Progress for ${task.name}`}
                          />
                          <span className="w-8 shrink-0 font-mono text-xs text-white/70">
                            {task.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <select
                          value={taskStatusLabel(task.progress)}
                          onChange={(event) => {
                            const label = event.target.value;
                            const progress =
                              label === "Complete" ? 100 : label === "Not started" ? 0 : 50;
                            updateTaskLocal(task.id, { progress });
                          }}
                          className={inputClassName()}
                        >
                          <option value="Not started">Not started</option>
                          <option value="In progress">In progress</option>
                          <option value="Complete">Complete</option>
                        </select>
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <TaskResourceField
                          value={task.resource}
                          users={resourceUsers}
                          onChange={(resource) => updateTaskLocal(task.id, { resource })}
                        />
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex items-center gap-1 text-[10px] text-amber-200">
                            <input
                              type="checkbox"
                              checked={task.milestone}
                              onChange={(event) =>
                                updateTaskLocal(task.id, { milestone: event.target.checked })
                              }
                              className="accent-amber-400"
                            />
                            Milestone
                          </label>
                          <label className="inline-flex items-center gap-1 text-[10px] text-rose-200">
                            <input
                              type="checkbox"
                              checked={task.critical}
                              onChange={(event) =>
                                updateTaskLocal(task.id, { critical: event.target.checked })
                              }
                              className="accent-rose-400"
                            />
                            Critical
                          </label>
                        </div>
                      </td>
                      <td className="py-3 pr-3 align-top">
                        <div className="relative h-5 w-36 min-w-[9rem] rounded-md bg-white/[0.06]">
                          <div
                            className={cn(
                              "absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full",
                              task.critical
                                ? "bg-gradient-to-r from-rose-500 to-amber-400"
                                : "bg-gradient-to-r from-sky-500 to-emerald-400",
                            )}
                            style={bar}
                          />
                        </div>
                      </td>
                      <td className="py-3 align-top">
                        <button
                          type="button"
                          onClick={() => void handleDeleteTask(task.id)}
                          disabled={busy}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-400/30 text-rose-300 transition-colors hover:bg-rose-500/15 disabled:opacity-50"
                          aria-label={`Delete ${task.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className={panelClassName()}>
        <div className="flex items-center gap-2">
          <Milestone className="h-4 w-4 text-amber-300" />
          <h3 className="text-base font-semibold text-white">Milestones</h3>
        </div>
        <p className="mt-1 text-xs text-white/45">
          Key delivery checkpoints flagged as milestones
        </p>

        {milestones.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">No milestones defined for this project.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {milestones.map((task) => (
              <article
                key={task.id}
                className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{task.name}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      taskStatusClass(task.progress),
                    )}
                  >
                    {taskStatusLabel(task.progress)}
                  </span>
                </div>
                {task.description ? (
                  <p className="mt-2 line-clamp-3 text-xs text-white/55">{task.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-white/50">
                  Due {formatProjectDate(task.dueDate)} · {task.resource || "Unassigned"}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                    style={{ width: `${Math.min(100, task.progress)}%` }}
                  />
                </div>
                {task.critical && (
                  <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.1em] text-rose-300">
                    <Zap className="h-3 w-3" />
                    Critical path
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
