"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, Search, Trash2, Users } from "lucide-react";

import {
  createWorkPackageApi,
  createWorkPackageTaskApi,
  deleteWorkPackageApi,
  deleteWorkPackageTaskApi,
  getWorkPackageApi,
  listWorkPackagesApi,
  updateWorkPackageApi,
  updateWorkPackageTaskApi,
} from "@/lib/internal-work-packages/client-api";
import type {
  WorkPackageDetail,
  WorkPackageListItem,
  WorkPackagePriority,
  WorkPackageStatus,
  WorkPackageTaskStatus,
} from "@/lib/internal-work-packages/types";
import { fetchCachedJson } from "@/lib/platform-fetch-cache";
import { type ManagedUser } from "@/lib/user-management-data";
import { isBrowserWolfCentralSurface } from "@/lib/wolf/wolf-surface";
import {
  WsEmpty,
  WsInputClass,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
  WsSection,
  WsStatusPill,
} from "./domain-workspace-ui";

const STATUSES: WorkPackageStatus[] = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Complete",
  "Cancelled",
];
const TASK_STATUSES: WorkPackageTaskStatus[] = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Complete",
  "Cancelled",
];
const PRIORITIES: WorkPackagePriority[] = ["Low", "Normal", "High", "Urgent"];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status: string) {
  if (status === "Complete") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "Blocked" || status === "Cancelled") return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  if (status === "In Progress") return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  return "border-white/10 bg-white/5 text-slate-200";
}

export default function InternalWorkPackagesWorkspace() {
  const isWolfSurface =
    typeof window !== "undefined" ? isBrowserWolfCentralSurface() : false;
  const [packages, setPackages] = useState<WorkPackageListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WorkPackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newOwnerUserId, setNewOwnerUserId] = useState("");
  const [ownerOptions, setOwnerOptions] = useState<ManagedUser[]>([]);
  const [taskDraft, setTaskDraft] = useState({
    category: "",
    description: "",
    assignedToName: "",
    startDate: "",
    expectedCompletionDate: "",
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listWorkPackagesApi({
        search,
        status: statusFilter,
        owner: ownerFilter,
        priority: priorityFilter,
      });
      setPackages(rows);
      if (selectedId && !rows.some((row) => row.id === selectedId)) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load work packages.");
    } finally {
      setLoading(false);
    }
  }, [ownerFilter, priorityFilter, search, selectedId, statusFilter]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const row = await getWorkPackageApi(id);
      setDetail(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load work package.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isWolfSurface) return;
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
            "wolf-work-package-owners",
            "/api/users",
            { ttlMs: 120_000 },
          );
          nextUsers = data.users ?? [];
        }
        if (!cancelled) {
          setOwnerOptions(nextUsers.filter((user) => user.status === "Active"));
        }
      } catch {
        if (!cancelled) setOwnerOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isWolfSurface]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [loadDetail, selectedId]);

  const selectedSummary = useMemo(
    () => packages.find((row) => row.id === selectedId) ?? null,
    [packages, selectedId],
  );

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const selectedOwner = ownerOptions.find((user) => user.id === newOwnerUserId);
      const created = await createWorkPackageApi({
        name: newName.trim(),
        description: newDescription.trim(),
        ownerName: isWolfSurface
          ? selectedOwner?.fullName || newOwner.trim() || undefined
          : newOwner.trim() || undefined,
        ownerUserId: isWolfSurface ? selectedOwner?.id || undefined : undefined,
      });
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      setNewOwner("");
      setNewOwnerUserId("");
      await loadList();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create work package.");
    }
  }

  async function handleAddTask() {
    if (!selectedId || !taskDraft.description.trim()) return;
    try {
      await createWorkPackageTaskApi(selectedId, {
        category: taskDraft.category.trim(),
        description: taskDraft.description.trim(),
        assignedToName: taskDraft.assignedToName.trim(),
        startDate: taskDraft.startDate || null,
        expectedCompletionDate: taskDraft.expectedCompletionDate || null,
      });
      setTaskDraft({
        category: "",
        description: "",
        assignedToName: "",
        startDate: "",
        expectedCompletionDate: "",
      });
      await Promise.all([loadList(), loadDetail(selectedId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add task.");
    }
  }

  async function toggleTaskComplete(taskId: string, finished: boolean) {
    if (!selectedId) return;
    try {
      await updateWorkPackageTaskApi(selectedId, taskId, {
        finished: !finished,
        status: !finished ? "Complete" : "In Progress",
      });
      await Promise.all([loadList(), loadDetail(selectedId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task.");
    }
  }

  async function handleDeletePackage() {
    if (!selectedId || !window.confirm("Delete this work package and all tasks?")) return;
    try {
      await deleteWorkPackageApi(selectedId);
      setSelectedId(null);
      setDetail(null);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete work package.");
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!selectedId || !window.confirm("Delete this task?")) return;
    try {
      await deleteWorkPackageTaskApi(selectedId, taskId);
      await Promise.all([loadList(), loadDetail(selectedId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  }

  async function handleStatusChange(status: WorkPackageStatus) {
    if (!selectedId) return;
    try {
      await updateWorkPackageApi(selectedId, { status });
      await Promise.all([loadList(), loadDetail(selectedId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  return (
    <div className="space-y-6">
      <WsSection
        title="Internal Work Packages"
        subtitle="Lightweight internal work tracking for tasks that do not need formal project management."
        actions={
          <button type="button" className={WsPrimaryButtonClass()} onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Work Package
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${WsInputClass()} pl-9`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, ID, owner..."
              />
            </div>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
            </span>
            <select
              className={WsInputClass()}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Priority
            </span>
            <select
              className={WsInputClass()}
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
            >
              <option value="All">All</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block max-w-md">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Owner
          </span>
          <input
            className={WsInputClass()}
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
            placeholder="Filter by owner"
          />
        </label>
      </WsSection>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
        <WsSection title="Work Packages" subtitle={`${packages.length} packages`}>
          {loading ? (
            <p className="text-sm text-slate-400">Loading work packages…</p>
          ) : packages.length === 0 ? (
            <WsEmpty message="No work packages yet. Create a work package to track internal tasks." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((row) => (
                    <tr
                      key={row.id}
                      className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${
                        selectedId === row.id ? "bg-cyan-500/10" : ""
                      }`}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-cyan-200">{row.packageCode}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-white">{row.name}</div>
                        <div className="text-xs text-slate-400">
                          {row.completedTaskCount}/{row.taskCount} tasks
                        </div>
                      </td>
                      <td className="px-3 py-3">{row.ownerName || "—"}</td>
                      <td className="px-3 py-3">
                        <WsStatusPill className={statusTone(row.status)}>{row.status}</WsStatusPill>
                      </td>
                      <td className="px-3 py-3">{row.progressPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </WsSection>

        <WsSection
          title={detail?.name ?? selectedSummary?.name ?? "Work Package Detail"}
          subtitle={detail?.packageCode ?? selectedSummary?.packageCode ?? "Select a work package"}
          actions={
            selectedId ? (
              <button type="button" className={WsSecondaryButtonClass()} onClick={() => void handleDeletePackage()}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </button>
            ) : null
          }
        >
          {!selectedId ? (
            <WsEmpty message="Select a work package from the list to manage tasks." />
          ) : detailLoading || !detail ? (
            <p className="text-sm text-slate-400">Loading detail…</p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Status</div>
                  <select
                    className={`${WsInputClass()} mt-1`}
                    value={detail.status}
                    onChange={(event) => void handleStatusChange(event.target.value as WorkPackageStatus)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Owner</div>
                  <div className="mt-1 text-white">{detail.ownerName || "—"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Progress</div>
                  <div className="mt-1 text-white">
                    {detail.completedTaskCount}/{detail.taskCount} complete ({detail.progressPct.toFixed(1)}%)
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Expected Completion</div>
                  <div className="mt-1 text-white">{formatDate(detail.expectedCompletionDate)}</div>
                </div>
              </div>

              {detail.description ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                  {detail.description}
                </p>
              ) : null}

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Users className="h-4 w-4 text-cyan-300" />
                  Team
                </div>
                <div className="flex flex-wrap gap-2">
                  {detail.members.length ? (
                    detail.members.map((member) => (
                      <span
                        key={member.id}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                      >
                        {member.displayName}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No team members assigned yet.</span>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Tasks</h3>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Task</th>
                        <th className="px-3 py-2">Assigned</th>
                        <th className="px-3 py-2">Expected</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Done</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.tasks.map((task) => (
                        <tr key={task.id} className="border-t border-white/5">
                          <td className="px-3 py-3 font-mono text-xs text-cyan-200">{task.taskCode}</td>
                          <td className="px-3 py-3">{task.category || "—"}</td>
                          <td className="px-3 py-3">{task.description}</td>
                          <td className="px-3 py-3">{task.assignedToName || "—"}</td>
                          <td className="px-3 py-3">{formatDate(task.expectedCompletionDate)}</td>
                          <td className="px-3 py-3">
                            <WsStatusPill className={statusTone(task.status)}>{task.status}</WsStatusPill>
                          </td>
                          <td className="px-3 py-3">{task.finished ? "Yes" : "No"}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className={WsSecondaryButtonClass()}
                                onClick={() => void toggleTaskComplete(task.id, task.finished)}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={WsSecondaryButtonClass()}
                                onClick={() => void handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="mb-3 text-sm font-semibold text-white">Add Task</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className={WsInputClass()}
                    placeholder="Category"
                    value={taskDraft.category}
                    onChange={(event) => setTaskDraft((prev) => ({ ...prev, category: event.target.value }))}
                  />
                  <input
                    className={WsInputClass()}
                    placeholder="Assigned to"
                    value={taskDraft.assignedToName}
                    onChange={(event) =>
                      setTaskDraft((prev) => ({ ...prev, assignedToName: event.target.value }))
                    }
                  />
                  <input
                    className={`${WsInputClass()} md:col-span-2`}
                    placeholder="Task description"
                    value={taskDraft.description}
                    onChange={(event) =>
                      setTaskDraft((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                  <input
                    type="date"
                    className={WsInputClass()}
                    value={taskDraft.startDate}
                    onChange={(event) => setTaskDraft((prev) => ({ ...prev, startDate: event.target.value }))}
                  />
                  <input
                    type="date"
                    className={WsInputClass()}
                    value={taskDraft.expectedCompletionDate}
                    onChange={(event) =>
                      setTaskDraft((prev) => ({ ...prev, expectedCompletionDate: event.target.value }))
                    }
                  />
                </div>
                <button type="button" className={`${WsPrimaryButtonClass()} mt-3`} onClick={() => void handleAddTask()}>
                  Add Task
                </button>
              </div>
            </div>
          )}
        </WsSection>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">New Work Package</h3>
            <div className="mt-4 space-y-3">
              <input
                className={WsInputClass()}
                placeholder="Work package name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <textarea
                className={`${WsInputClass()} min-h-24`}
                placeholder="Description"
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
              />
              {isWolfSurface ? (
                <select
                  className={WsInputClass()}
                  value={newOwnerUserId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setNewOwnerUserId(nextId);
                    const selected = ownerOptions.find((user) => user.id === nextId);
                    setNewOwner(selected?.fullName ?? "");
                  }}
                >
                  <option value="">Select owner</option>
                  {ownerOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={WsInputClass()}
                  placeholder="Owner"
                  value={newOwner}
                  onChange={(event) => setNewOwner(event.target.value)}
                />
              )}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className={WsSecondaryButtonClass()} onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="button" className={WsPrimaryButtonClass()} onClick={() => void handleCreate()}>
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
