"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, History, Plus, Search, Trash2, Users } from "lucide-react";

import { useOperatorEntitlements } from "./OperatorEntitlementsProvider";
import {
  answerWorkPackageQuestionApi,
  createWorkPackageApi,
  createWorkPackageTaskApi,
  deleteWorkPackageApi,
  deleteWorkPackageTaskApi,
  getWorkPackageApi,
  listWorkPackageQuestionAnswerLogApi,
  listWorkPackagesApi,
  setWorkPackageMembersApi,
  updateWorkPackageApi,
  updateWorkPackageTaskApi,
} from "@/lib/internal-work-packages/client-api";
import type {
  WorkPackageDetail,
  WorkPackageListItem,
  WorkPackagePriority,
  WorkPackageQuestion,
  WorkPackageQuestionAnswerLogEntry,
  WorkPackageStatus,
  WorkPackageTaskStatus,
} from "@/lib/internal-work-packages/types";
import { fetchCachedJson } from "@/lib/platform-fetch-cache";
import { type ManagedUser } from "@/lib/user-management-data";
import { filterWolfMessagingOperators } from "@/lib/wolf/wolf-messaging-operators";
import { isBrowserWolfCentralSurface, isWolfCentralSlug } from "@/lib/wolf/wolf-surface";
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

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: string) {
  if (status === "Complete") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "Blocked" || status === "Cancelled") return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  if (status === "In Progress") return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  return "border-white/10 bg-white/5 text-slate-200";
}

function groupQuestionsByCategory(questions: WorkPackageQuestion[]) {
  const groups = new Map<string, WorkPackageQuestion[]>();
  for (const question of questions) {
    const key = question.category.trim() || "General";
    const list = groups.get(key) ?? [];
    list.push(question);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

export default function InternalWorkPackagesWorkspace() {
  const { workspaceSlug } = useOperatorEntitlements();
  const isWolfWorkspace =
    isWolfCentralSlug(workspaceSlug) ||
    (typeof window !== "undefined" && isBrowserWolfCentralSurface());

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
  const [operatorOptions, setOperatorOptions] = useState<ManagedUser[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState(false);
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, string>>({});
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [answerLog, setAnswerLog] = useState<WorkPackageQuestionAnswerLogEntry[]>([]);
  const [answerLogLoading, setAnswerLogLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "answers-log">("overview");
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
      setSelectedMemberIds(
        row.members.map((member) => member.userId).filter((userId): userId is string => Boolean(userId)),
      );
      setQuestionDrafts(
        Object.fromEntries(row.questions.map((question) => [question.id, question.currentAnswer])),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load work package.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadAnswerLog = useCallback(async (id: string) => {
    setAnswerLogLoading(true);
    try {
      const entries = await listWorkPackageQuestionAnswerLogApi(id);
      setAnswerLog(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load answer log.");
      setAnswerLog([]);
    } finally {
      setAnswerLogLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const messagingUsers = await fetchCachedJson<{ users?: ManagedUser[] }>(
          "work-package-operators",
          "/api/messaging/operators",
          { ttlMs: 60_000 },
        );
        const users = messagingUsers.users ?? [];
        if (!cancelled) {
          setOperatorOptions(
            isWolfWorkspace ? filterWolfMessagingOperators(users) : users.filter((u) => u.status === "Active"),
          );
        }
      } catch {
        if (!cancelled) setOperatorOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isWolfWorkspace]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
  }, [loadDetail, selectedId]);

  useEffect(() => {
    if (selectedId && detailTab === "answers-log") void loadAnswerLog(selectedId);
  }, [detailTab, loadAnswerLog, selectedId]);

  const selectedSummary = useMemo(
    () => packages.find((row) => row.id === selectedId) ?? null,
    [packages, selectedId],
  );

  const isQuestionnaire = Boolean(detail?.questions.length);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const selectedOwner = operatorOptions.find((user) => user.id === newOwnerUserId);
      const created = await createWorkPackageApi({
        name: newName.trim(),
        description: newDescription.trim(),
        ownerName: isWolfWorkspace
          ? selectedOwner?.fullName || newOwner.trim() || undefined
          : newOwner.trim() || undefined,
        ownerUserId: isWolfWorkspace ? selectedOwner?.id || undefined : undefined,
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

  async function handleSaveMembers() {
    if (!selectedId) return;
    setSavingMembers(true);
    setError(null);
    try {
      const members = selectedMemberIds
        .map((userId) => operatorOptions.find((user) => user.id === userId))
        .filter((user): user is ManagedUser => Boolean(user))
        .map((user) => ({ userId: user.id, displayName: user.fullName }));
      const updated = await setWorkPackageMembersApi(selectedId, members);
      setDetail(updated);
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team members.");
    } finally {
      setSavingMembers(false);
    }
  }

  async function handleSaveQuestionAnswer(questionId: string) {
    if (!selectedId) return;
    const answerText = questionDrafts[questionId]?.trim() ?? "";
    if (!answerText) return;
    setSavingQuestionId(questionId);
    setError(null);
    try {
      await answerWorkPackageQuestionApi(selectedId, questionId, answerText);
      await Promise.all([loadDetail(selectedId), loadList()]);
      if (detailTab === "answers-log") await loadAnswerLog(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save answer.");
    } finally {
      setSavingQuestionId(null);
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

  function toggleMember(userId: string) {
    setSelectedMemberIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  }

  return (
    <div className="space-y-6">
      <WsSection
        title="Internal Work Packages"
        subtitle="Lightweight internal work tracking for tasks that do not need formal project management."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
          <div className="space-y-3">
            <label>
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

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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

            <label>
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

            <button
              type="button"
              className={`${WsPrimaryButtonClass()} w-full justify-center`}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Work Package
            </button>
          </div>

          <div className="min-h-[18rem] rounded-xl border border-white/10 bg-white/[0.02]">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-medium text-white">Work Packages</p>
              <p className="text-xs text-slate-400">{packages.length} packages</p>
            </div>
            {loading ? (
              <p className="px-4 py-6 text-sm text-slate-400">Loading work packages…</p>
            ) : packages.length === 0 ? (
              <div className="px-4 py-6">
                <WsEmpty message="No work packages yet. Create a work package to track internal tasks." />
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-950/95 text-left text-xs uppercase tracking-wide text-slate-400">
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
                        onClick={() => {
                          setSelectedId(row.id);
                          setDetailTab("overview");
                        }}
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
          </div>
        </div>
      </WsSection>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {selectedId ? (
        <WsSection
          title={detail?.name ?? selectedSummary?.name ?? "Work Package Detail"}
          subtitle={detail?.packageCode ?? selectedSummary?.packageCode ?? "Selected work package"}
          actions={
            <button type="button" className={WsSecondaryButtonClass()} onClick={() => void handleDeletePackage()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </button>
          }
        >
          {!detail || detailLoading ? (
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

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <Users className="h-4 w-4 text-cyan-300" />
                  Team members
                  {isWolfWorkspace ? (
                    <span className="text-xs font-normal text-slate-400">(@wolf.unit311central.com)</span>
                  ) : null}
                </div>
                {operatorOptions.length ? (
                  <div className="flex flex-wrap gap-2">
                    {operatorOptions.map((user) => {
                      const selected = selectedMemberIds.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleMember(user.id)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            selected
                              ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {user.fullName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No eligible users available.</p>
                )}
                <button
                  type="button"
                  className={`${WsSecondaryButtonClass()} mt-3`}
                  disabled={savingMembers}
                  onClick={() => void handleSaveMembers()}
                >
                  {savingMembers ? "Saving team…" : "Save team members"}
                </button>
              </div>

              {isQuestionnaire ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        detailTab === "overview"
                          ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-300"
                      }`}
                      onClick={() => setDetailTab("overview")}
                    >
                      <ClipboardList className="mr-1.5 inline h-3.5 w-3.5" />
                      Questions
                    </button>
                    <button
                      type="button"
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        detailTab === "answers-log"
                          ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-300"
                      }`}
                      onClick={() => setDetailTab("answers-log")}
                    >
                      <History className="mr-1.5 inline h-3.5 w-3.5" />
                      Answer log
                    </button>
                  </div>

                  {detailTab === "overview" ? (
                    <div className="space-y-5">
                      {groupQuestionsByCategory(detail.questions).map(([category, questions]) => (
                        <div key={category} className="rounded-xl border border-white/10 bg-white/[0.02]">
                          <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
                            {category}
                          </div>
                          <div className="divide-y divide-white/5">
                            {questions.map((question, index) => (
                              <div
                                key={question.id}
                                className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
                              >
                                <div className="text-sm text-slate-200">
                                  <span className="mr-2 font-mono text-xs text-cyan-200/80">
                                    {index + 1}.
                                  </span>
                                  {question.questionText}
                                  {question.answeredAt ? (
                                    <p className="mt-1 text-xs text-slate-400">
                                      Last answered {formatDateTime(question.answeredAt)}
                                      {question.answeredByName ? ` by ${question.answeredByName}` : ""}
                                    </p>
                                  ) : null}
                                </div>
                                <input
                                  className={WsInputClass()}
                                  value={questionDrafts[question.id] ?? ""}
                                  placeholder="Enter answer"
                                  onChange={(event) =>
                                    setQuestionDrafts((current) => ({
                                      ...current,
                                      [question.id]: event.target.value,
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  className={WsPrimaryButtonClass()}
                                  disabled={savingQuestionId === question.id}
                                  onClick={() => void handleSaveQuestionAnswer(question.id)}
                                >
                                  {savingQuestionId === question.id ? "Saving…" : "Save answer"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : answerLogLoading ? (
                    <p className="text-sm text-slate-400">Loading answer log…</p>
                  ) : answerLog.length === 0 ? (
                    <WsEmpty message="No answers have been logged yet." />
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="min-w-full text-sm">
                        <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-slate-400">
                          <tr>
                            <th className="px-3 py-2">When</th>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">Question</th>
                            <th className="px-3 py-2">Answer</th>
                            <th className="px-3 py-2">By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {answerLog.map((entry) => (
                            <tr key={entry.id} className="border-t border-white/5">
                              <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(entry.answeredAt)}</td>
                              <td className="px-3 py-3">{entry.category}</td>
                              <td className="px-3 py-3">{entry.questionText}</td>
                              <td className="px-3 py-3">{entry.answerText}</td>
                              <td className="px-3 py-3">{entry.answeredByName || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
        </WsSection>
      ) : null}

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
              {isWolfWorkspace && operatorOptions.length ? (
                <select
                  className={WsInputClass()}
                  value={newOwnerUserId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setNewOwnerUserId(nextId);
                    const selected = operatorOptions.find((user) => user.id === nextId);
                    setNewOwner(selected?.fullName ?? "");
                  }}
                >
                  <option value="">Select owner</option>
                  {operatorOptions.map((user) => (
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
