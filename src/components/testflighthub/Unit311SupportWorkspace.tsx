"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Plus, Search } from "lucide-react";

import {
  createUnit311SupportTicket,
  fetchUnit311SupportOrgWorkspaces,
  fetchUnit311SupportTicket,
  fetchUnit311SupportTickets,
  replyToUnit311SupportTicket,
} from "@/lib/unit311-support/client-api";
import {
  UNIT311_SUPPORT_CATEGORIES,
  UNIT311_SUPPORT_MODULE_OPTIONS,
  statusBadgeClass,
  severityBadgeClass,
  unit311SupportCategoryLabel,
  unit311SupportSeverityLabel,
  unit311SupportStatusLabel,
} from "@/lib/unit311-support/data";
import type {
  Unit311SupportCategory,
  Unit311SupportTicket,
  Unit311SupportTicketDetail,
} from "@/lib/unit311-support/types";
import { formatSupportDate } from "@/lib/support-data";
import { cn } from "@/lib/utils";
import ResponsiveMasterDetail, {
  useMobileDetailPanel,
} from "@/components/ui/ResponsiveMasterDetail";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

function StatBar({
  label,
  count,
  max,
  tone,
}: {
  label: string;
  count: number;
  max: number;
  tone: "sky" | "amber" | "emerald";
}) {
  const width = max > 0 ? Math.max(8, Math.round((count / max) * 100)) : 0;
  const toneClass =
    tone === "sky"
      ? "border-sky-400/30 bg-sky-500/20"
      : tone === "amber"
        ? "border-amber-400/30 bg-amber-500/20"
        : "border-emerald-400/30 bg-emerald-500/20";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-white">{count}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full border", toneClass)} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function Unit311SupportWorkspace() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Unit311SupportTicket[]>([]);
  const [summary, setSummary] = useState({ open: 0, awaitingCustomer: 0, resolved: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Unit311SupportTicketDetail | null>(null);
  const [creating, setCreating] = useState(false);
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "awaiting" | "resolved">("all");
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; slug: string }>>(
    [],
  );
  const { showDetail, openDetail, closeDetail } = useMobileDetailPanel();

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "platform_problem" as Unit311SupportCategory,
    affectedModule: "Other / Unsure",
    workspaceId: "",
  });

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchUnit311SupportTickets();
      setTickets(payload.tickets);
      setSummary(payload.summary);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (ticketId: string) => {
    setBusy(true);
    setError(null);
    try {
      const payload = await fetchUnit311SupportTicket(ticketId);
      setDetail(payload.ticket);
      setSelectedId(ticketId);
      setCreating(false);
      openDetail();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load ticket.");
    } finally {
      setBusy(false);
    }
  }, [openDetail]);

  useEffect(() => {
    void loadTickets();
    void fetchUnit311SupportOrgWorkspaces()
      .then((payload) => {
        setWorkspaces(payload.workspaces);
        setForm((current) => ({
          ...current,
          workspaceId: current.workspaceId || payload.workspaces[0]?.id || "",
        }));
      })
      .catch(() => undefined);
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter === "open" && ticket.status !== "open" && ticket.status !== "in_progress") {
        return false;
      }
      if (statusFilter === "awaiting" && ticket.status !== "awaiting_customer") return false;
      if (statusFilter === "resolved" && ticket.status !== "resolved" && ticket.status !== "closed") {
        return false;
      }
      if (!needle) return true;
      return [ticket.id, ticket.subject, ticket.affectedModule, ticket.workspaceName, ticket.workspaceSlug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [search, statusFilter, tickets]);

  const statMax = Math.max(summary.open, summary.awaitingCustomer, summary.resolved, 1);

  function startCreate() {
    setCreating(true);
    setSelectedId(null);
    setDetail(null);
    openDetail();
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = await createUnit311SupportTicket({
        subject: form.subject,
        description: form.description,
        category: form.category,
        affectedModule: form.affectedModule,
        workspaceId: form.workspaceId,
      });
      setDetail(payload.ticket);
      setSelectedId(payload.ticket.id);
      setCreating(false);
      await loadTickets();
      setForm({
        subject: "",
        description: "",
        category: "platform_problem",
        affectedModule: "Other / Unsure",
        workspaceId: form.workspaceId,
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create ticket.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload = await replyToUnit311SupportTicket(selectedId, reply.trim());
      setDetail(payload.ticket);
      setReply("");
      await loadTickets();
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Failed to send reply.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" data-ai-target="unit311-support-workspace">
      <section className="rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-4 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/80">
          Unit311 Support
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">Get help with your Unit311 platform</h2>
        <p className="mt-1 text-sm text-white/55">
          Submit requests, track status, and reply to Unit311 support in one place.
        </p>
      </section>

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatBar label="Open" count={summary.open} max={statMax} tone="sky" />
        <StatBar label="Awaiting your response" count={summary.awaitingCustomer} max={statMax} tone="amber" />
        <StatBar label="Resolved" count={summary.resolved} max={statMax} tone="emerald" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tickets…
        </div>
      ) : (
        <ResponsiveMasterDetail
          showDetail={showDetail}
          onBack={() => {
            closeDetail();
            setCreating(false);
            setSelectedId(null);
            setDetail(null);
          }}
          backLabel="Back to requests"
          columnsClassName="xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]"
          className="min-h-[70vh] xl:items-start"
          master={
            <section className="flex max-h-[78vh] flex-col rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Your requests</h2>
                  <p className="mt-1 text-xs text-white/45">
                    {filteredTickets.length} requests · sorted by latest activity
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCreate}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-500/20 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New request
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <div className="relative sm:col-span-2 xl:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by subject, ID, module…"
                    className={cn(inputClassName(), "mt-0 pl-10")}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as "all" | "open" | "awaiting" | "resolved",
                    )
                  }
                  className={cn(inputClassName(), "mt-0")}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  <option value="open">Open</option>
                  <option value="awaiting">Awaiting your response</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredTickets.length === 0 ? (
                  <p className="text-sm text-white/45">No support requests yet.</p>
                ) : (
                  filteredTickets.map((ticket) => {
                    const selected = ticket.id === selectedId;
                    return (
                      <button
                        key={ticket.id}
                        type="button"
                        onClick={() => void loadDetail(ticket.id)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                          selected
                            ? "border-sky-400/40 bg-sky-500/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)]"
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                        )}
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-300/80">
                          {ticket.id}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">{ticket.subject}</p>
                        <p className="mt-1 text-xs text-white/45">
                          {unit311SupportCategoryLabel(ticket.category)}
                          {ticket.workspaceName ? ` · ${ticket.workspaceName}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                              statusBadgeClass(ticket.status),
                            )}
                          >
                            {unit311SupportStatusLabel(ticket.status)}
                          </span>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                              severityBadgeClass(ticket.severity),
                            )}
                          >
                            {unit311SupportSeverityLabel(ticket.severity)}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {formatSupportDate(ticket.updatedAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          }
          detail={
            creating ? (
              <section className="max-h-[78vh] overflow-y-auto rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                  New support request
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">Tell us what you need</h2>
                <form onSubmit={handleCreate} className="mt-6 space-y-4">
                  <div>
                    <FieldLabel>Subject</FieldLabel>
                    <input
                      value={form.subject}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, subject: event.target.value }))
                      }
                      className={inputClassName()}
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={6}
                      className={cn(inputClassName(), "resize-y")}
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <select
                        value={form.category}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            category: event.target.value as Unit311SupportCategory,
                          }))
                        }
                        className={inputClassName()}
                      >
                        {UNIT311_SUPPORT_CATEGORIES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Affected module</FieldLabel>
                      <select
                        value={form.affectedModule}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, affectedModule: event.target.value }))
                        }
                        className={inputClassName()}
                      >
                        {UNIT311_SUPPORT_MODULE_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {workspaces.length > 1 && (
                    <div>
                      <FieldLabel>Affected workspace</FieldLabel>
                      <select
                        value={form.workspaceId}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, workspaceId: event.target.value }))
                        }
                        className={inputClassName()}
                      >
                        {workspaces.map((workspace) => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name} ({workspace.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Submit request
                  </button>
                </form>
              </section>
            ) : detail ? (
              <section className="max-h-[78vh] overflow-y-auto rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                    {detail.id}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">{detail.subject}</h2>
                  <p className="mt-1 text-sm text-white/50">
                    {unit311SupportCategoryLabel(detail.category)} · {detail.affectedModule || "—"}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                      statusBadgeClass(detail.status),
                    )}
                  >
                    {unit311SupportStatusLabel(detail.status)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                      severityBadgeClass(detail.severity),
                    )}
                  >
                    {unit311SupportSeverityLabel(detail.severity)}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Workspace</FieldLabel>
                    <p className="mt-1.5 rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white/80">
                      {detail.workspaceName || detail.workspaceSlug || detail.workspaceId}
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Last updated</FieldLabel>
                    <p className="mt-1.5 rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white/80">
                      {formatSupportDate(detail.updatedAt)}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Description</FieldLabel>
                    <p className="mt-1.5 whitespace-pre-wrap rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white/80">
                      {detail.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <MessageSquare className="h-4 w-4 text-sky-300" />
                    Conversation
                  </div>
                  <div className="space-y-2">
                    {detail.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm",
                          message.authorKind === "internal"
                            ? "border-sky-400/25 bg-sky-500/10 text-sky-50"
                            : "border-white/10 bg-white/[0.03] text-white/85",
                        )}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45">
                          <span>{message.authorName}</span>
                          <span>{formatSupportDate(message.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{message.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {detail.status !== "closed" && (
                  <form onSubmit={handleReply} className="mt-6 space-y-3">
                    <FieldLabel>Your reply</FieldLabel>
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={4}
                      placeholder="Write your reply…"
                      className={cn(inputClassName(), "mt-0 resize-y")}
                    />
                    <button
                      type="submit"
                      disabled={busy || !reply.trim()}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition-colors hover:bg-sky-500/20 disabled:opacity-60"
                    >
                      Send reply
                    </button>
                  </form>
                )}

                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/45">
                  <p>Created {formatSupportDate(detail.createdAt)}</p>
                  <p className="mt-1">Updated {formatSupportDate(detail.updatedAt)}</p>
                </div>
              </section>
            ) : (
              <section className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                <div>
                  <p className="text-sm font-medium text-white/70">Select a request</p>
                  <p className="mt-1 text-xs text-white/45">
                    Choose a ticket from the list or create a new support request.
                  </p>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New request
                  </button>
                </div>
              </section>
            )
          }
        />
      )}
    </div>
  );
}
