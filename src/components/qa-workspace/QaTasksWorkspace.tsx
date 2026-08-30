"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Pencil, Trash2 } from "lucide-react";

import { useQaWorkspace } from "@/components/qa-workspace/QaWorkspaceProvider";
import { QA_BETA_REPORT_TYPES } from "@/lib/qa-workspace/constants";
import type { QaTaskScope, QaTaskStatus } from "@/lib/qa-workspace/constants";
import { QA_TASK_SCOPES } from "@/lib/qa-workspace/constants";
import {
  decodeQaBetaReportElementType,
  formatQaBetaReportTypeLabel,
} from "@/lib/qa-workspace/beta-report";
import { formatQaTaskScopeLabel } from "@/lib/qa-workspace/scope";
import type { QaWorkspaceTask } from "@/lib/qa-workspace/types";
import { cn } from "@/lib/utils";

type Filters = {
  scope: QaTaskScope | "all";
  module: string;
  page: string;
  status: QaTaskStatus | "all";
  elementType: string;
  reportType: string;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

function formatStatusLabel(status: QaTaskStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "done":
      return "Done";
    case "wont_fix":
      return "Won't fix";
    default:
      return status;
  }
}

function statusBadgeClass(status: QaTaskStatus): string {
  switch (status) {
    case "done":
      return "bg-emerald-500/15 text-emerald-200";
    case "in_progress":
      return "bg-sky-500/15 text-sky-200";
    case "wont_fix":
      return "bg-white/10 text-white/55";
    default:
      return "bg-amber-500/15 text-amber-200";
  }
}

export default function QaTasksWorkspace() {
  const { betaMode, qaMode, setQaMode, openBetaReport } = useQaWorkspace();
  const [tasks, setTasks] = useState<QaWorkspaceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    scope: "all",
    module: "",
    page: "",
    status: "all",
    elementType: "",
    reportType: "",
  });
  const [editing, setEditing] = useState<QaWorkspaceTask | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (!betaMode && filters.scope !== "all") params.set("scope", filters.scope);
    if (filters.module) params.set("module", filters.module);
    if (filters.page) params.set("page", filters.page);
    if (filters.status !== "all") params.set("status", filters.status);
    if (!betaMode && filters.elementType) params.set("elementType", filters.elementType);
    if (betaMode && filters.reportType) params.set("elementType", `beta:${filters.reportType}`);
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [betaMode, filters]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/qa/tasks${queryString}`);
      const payload = (await response.json()) as { tasks?: QaWorkspaceTask[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Failed to load QA tasks.");
      setTasks(payload.tasks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load QA tasks.");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const moduleOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.moduleLabel))].sort(),
    [tasks],
  );
  const pageOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.pageLabel))].sort(),
    [tasks],
  );
  const elementTypeOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.elementType).filter(Boolean))].sort() as string[],
    [tasks],
  );

  async function updateTaskStatus(task: QaWorkspaceTask, status: QaTaskStatus) {
    const response = await fetch(`/api/qa/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error || "Failed to update QA task.");
    await loadTasks();
  }

  async function toggleCompleted(task: QaWorkspaceTask, completed: boolean) {
    await updateTaskStatus(task, completed ? "done" : "open");
  }

  async function deleteTask(task: QaWorkspaceTask) {
    const confirmed = window.confirm("Delete this QA task?");
    if (!confirmed) return;
    const response = await fetch(`/api/qa/tasks/${task.id}`, { method: "DELETE" });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error || "Failed to delete QA task.");
    await loadTasks();
  }

  async function saveEdit() {
    if (!editing) return;
    const response = await fetch(`/api/qa/tasks/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: editing.scope,
        moduleLabel: editing.moduleLabel,
        pageLabel: editing.pageLabel,
        elementLabel: editing.elementLabel,
        description: editing.description,
        status: editing.status,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error || "Failed to update QA task.");
    setEditing(null);
    await loadTasks();
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">QA Tasks</h2>
          <p className="text-sm text-white/55">
            {betaMode
              ? "InterfaceWorx beta feedback backlog. Turn on QA Mode to report issues while you use the workspace."
              : "Master backlog for Test workspace QA capture. Use QA Mode on any page to add tasks quickly."}
          </p>
        </div>
        <a
          href={`/api/qa/tasks/export${queryString}`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {betaMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">QA Mode</p>
            <p className="mt-1 text-sm text-white/65">
              {qaMode
                ? "On — use Report Issue while browsing InterfaceWorx."
                : "Off — InterfaceWorx behaves normally."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQaMode(false)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                !qaMode
                  ? "border-[#CC5500]/50 bg-[#CC5500]/15 text-orange-100"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]",
              )}
            >
              Off
            </button>
            <button
              type="button"
              onClick={() => setQaMode(true)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                qaMode
                  ? "border-[#CC5500]/50 bg-[#CC5500]/15 text-orange-100"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]",
              )}
            >
              On
            </button>
            {qaMode ? (
              <button
                type="button"
                onClick={openBetaReport}
                className="rounded-xl border border-[#CC5500]/40 bg-[#CC5500]/20 px-4 py-2 text-sm font-medium text-orange-100"
              >
                Report Issue
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3",
          betaMode ? "md:grid-cols-4" : "md:grid-cols-5",
        )}
      >
        {!betaMode ? (
          <label className="text-xs text-white/50">
            Scope
            <select
              value={filters.scope}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  scope: event.target.value as Filters["scope"],
                }))
              }
              className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-2 text-sm text-white"
            >
              <option value="all">All</option>
              {QA_TASK_SCOPES.map((scope) => (
                <option key={scope} value={scope}>
                  {formatQaTaskScopeLabel(scope)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <FilterSelect
          label="Module"
          value={filters.module}
          onChange={(value) => setFilters((current) => ({ ...current, module: value }))}
          options={moduleOptions}
        />
        <FilterSelect
          label="Page"
          value={filters.page}
          onChange={(value) => setFilters((current) => ({ ...current, page: value }))}
          options={pageOptions}
        />
        <label className="text-xs text-white/50">
          Status
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value as Filters["status"],
              }))
            }
            className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-2 text-sm text-white"
          >
            <option value="all">All</option>
            {betaMode ? (
              <>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
                <option value="wont_fix">Won&apos;t fix</option>
              </>
            ) : (
              <>
                <option value="open">Open</option>
                <option value="done">Done</option>
              </>
            )}
          </select>
        </label>
        {betaMode ? (
          <label className="text-xs text-white/50">
            Type
            <select
              value={filters.reportType}
              onChange={(event) =>
                setFilters((current) => ({ ...current, reportType: event.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-2 text-sm text-white"
            >
              <option value="">All</option>
              {QA_BETA_REPORT_TYPES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <FilterSelect
            label="Element type"
            value={filters.elementType}
            onChange={(value) => setFilters((current) => ({ ...current, elementType: value }))}
            options={elementTypeOptions}
          />
        )}
      </div>

      {loading ? <p className="text-sm text-white/60">Loading QA tasks...</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-white/80">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/45">
            <tr>
              {!betaMode ? <th className="px-3 py-2">Done</th> : null}
              {!betaMode ? <th className="px-3 py-2">Scope</th> : null}
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Module</th>
              <th className="px-3 py-2">Page</th>
              {betaMode ? <th className="px-3 py-2">Type</th> : <th className="px-3 py-2">Element</th>}
              <th className="px-3 py-2">Description</th>
              {betaMode ? <th className="px-3 py-2">Reported by</th> : null}
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-t border-white/10 align-top">
                {!betaMode ? (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      onChange={(event) => void toggleCompleted(task, event.target.checked)}
                    />
                  </td>
                ) : null}
                {!betaMode ? (
                  <td className="px-3 py-2">
                    <span className="rounded bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-white/75">
                      {formatQaTaskScopeLabel(task.scope)}
                    </span>
                  </td>
                ) : null}
                <td className="px-3 py-2">
                  {betaMode ? (
                    <select
                      value={task.status}
                      onChange={(event) =>
                        void updateTaskStatus(task, event.target.value as QaTaskStatus)
                      }
                      className={cn(
                        "rounded border border-white/10 bg-[#0b1524] px-2 py-1 text-xs uppercase",
                        statusBadgeClass(task.status),
                      )}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                      <option value="wont_fix">Won&apos;t fix</option>
                    </select>
                  ) : (
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium uppercase",
                        statusBadgeClass(task.status),
                      )}
                    >
                      {formatStatusLabel(task.status)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">{task.moduleLabel}</td>
                <td className="px-3 py-2">{task.pageLabel}</td>
                <td className="px-3 py-2">
                  {betaMode
                    ? formatQaBetaReportTypeLabel(task.elementType) ?? task.elementLabel
                    : task.elementLabel}
                </td>
                <td className="max-w-md px-3 py-2 whitespace-pre-wrap">{task.description}</td>
                {betaMode ? (
                  <td className="px-3 py-2 text-white/60">{task.createdByEmail ?? "—"}</td>
                ) : null}
                <td className="px-3 py-2">{formatDate(task.createdAt)}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-white/10 p-1 text-white/70 hover:bg-white/[0.05]"
                      onClick={() => setEditing({ ...task })}
                      aria-label="Edit task"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded border border-white/10 p-1 text-rose-300 hover:bg-rose-500/10"
                      onClick={() => void deleteTask(task)}
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && tasks.length === 0 ? (
              <tr>
                <td colSpan={betaMode ? 8 : 9} className="px-3 py-8 text-center text-white/45">
                  {betaMode
                    ? "No beta reports yet. Turn on QA Mode and use Report Issue while using InterfaceWorx."
                    : "No QA tasks yet. Turn on QA Mode and click an element to capture your first task."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">Edit QA Task</h3>
            <div className="mt-4 space-y-3">
              {!betaMode ? (
                <label className="block text-sm text-white/60">
                  Scope
                  <select
                    value={editing.scope}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        scope: event.target.value as QaTaskScope,
                      })
                    }
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-[#050b16] px-3 py-2 text-sm text-white"
                  >
                    {QA_TASK_SCOPES.map((scope) => (
                      <option key={scope} value={scope}>
                        {formatQaTaskScopeLabel(scope)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <EditField
                label="Module"
                value={editing.moduleLabel}
                onChange={(value) => setEditing({ ...editing, moduleLabel: value })}
              />
              <EditField
                label="Page"
                value={editing.pageLabel}
                onChange={(value) => setEditing({ ...editing, pageLabel: value })}
              />
              {!betaMode ? (
                <EditField
                  label="Element"
                  value={editing.elementLabel}
                  onChange={(value) => setEditing({ ...editing, elementLabel: value })}
                />
              ) : (
                <label className="block text-sm text-white/60">
                  Type
                  <select
                    value={decodeQaBetaReportElementType(editing.elementType) ?? "broken"}
                    onChange={(event) => {
                      const type = QA_BETA_REPORT_TYPES.find(
                        (entry) => entry.id === event.target.value,
                      );
                      if (!type) return;
                      setEditing({
                        ...editing,
                        elementLabel: type.label,
                        elementType: `beta:${type.id}`,
                      });
                    }}
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-[#050b16] px-3 py-2 text-sm text-white"
                  >
                    {QA_BETA_REPORT_TYPES.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-sm text-white/60">
                Comment
                <textarea
                  value={editing.description}
                  onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#050b16] px-3 py-2 text-sm text-white"
                />
              </label>
              <label className="block text-sm text-white/60">
                Status
                <select
                  value={editing.status}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      status: event.target.value as QaTaskStatus,
                    })
                  }
                  className="mt-1 block w-full rounded-xl border border-white/10 bg-[#050b16] px-3 py-2 text-sm text-white"
                >
                  {betaMode ? (
                    <>
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                      <option value="wont_fix">Won&apos;t fix</option>
                    </>
                  ) : (
                    <>
                      <option value="open">Open</option>
                      <option value="done">Done</option>
                    </>
                  )}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-sm text-sky-100"
                onClick={() => void saveEdit()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-xs text-white/50">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-2 text-sm text-white"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-white/60">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-[#050b16] px-3 py-2 text-sm text-white"
      />
    </label>
  );
}
