"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Headphones, Loader2, MessageSquare, Plus } from "lucide-react";

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
import { cn } from "@/lib/utils";

type Screen = "home" | "new" | "detail";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function TicketRow({
  ticket,
  onOpen,
}: {
  ticket: Unit311SupportTicket;
  onOpen: (ticket: Unit311SupportTicket) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(ticket)}
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition hover:border-primary/40"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{ticket.id}</p>
        <p className="truncate text-sm text-foreground">{ticket.subject}</p>
        <p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(ticket.updatedAt)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusBadgeClass(ticket.status))}>
          {unit311SupportStatusLabel(ticket.status)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            severityBadgeClass(ticket.severity),
          )}
        >
          {unit311SupportSeverityLabel(ticket.severity)}
        </span>
      </div>
    </button>
  );
}

export default function Unit311SupportWorkspace() {
  const [screen, setScreen] = useState<Screen>("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Unit311SupportTicket[]>([]);
  const [summary, setSummary] = useState({ open: 0, awaitingCustomer: 0, resolved: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Unit311SupportTicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; slug: string }>>(
    [],
  );

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

  const openTicket = useCallback(async (ticket: Unit311SupportTicket) => {
    setSelectedId(ticket.id);
    setScreen("detail");
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchUnit311SupportTicket(ticket.id);
      setDetail(payload.ticket);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, []);

  const recentTickets = useMemo(
    () =>
      tickets
        .filter((ticket) => ticket.status !== "closed")
        .slice(0, 8),
    [tickets],
  );

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
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
      setScreen("detail");
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
      setSaving(false);
    }
  }

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = await replyToUnit311SupportTicket(selectedId, reply.trim());
      setDetail(payload.ticket);
      setReply("");
      await loadTickets();
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : "Failed to send reply.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Headphones className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">Tools</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Unit311 Support</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Get help with your Unit311 platform.
          </p>
        </div>
        {screen === "home" && (
          <button
            type="button"
            onClick={() => setScreen("new")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            New Support Request
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {screen === "home" && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="Open" value={summary.open} />
            <SummaryCard label="Awaiting Your Response" value={summary.awaitingCustomer} />
            <SummaryCard label="Resolved" value={summary.resolved} />
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent requests
            </h2>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tickets…
              </div>
            ) : recentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No support requests yet.</p>
            ) : (
              recentTickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} onOpen={openTicket} />
              ))
            )}
          </div>
        </>
      )}

      {screen === "new" && (
        <form onSubmit={handleCreate} className="mx-auto w-full max-w-2xl space-y-4">
          <button
            type="button"
            onClick={() => setScreen("home")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <input
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value as Unit311SupportCategory,
                  }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {UNIT311_SUPPORT_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Affected module</label>
              <select
                value={form.affectedModule}
                onChange={(event) =>
                  setForm((current) => ({ ...current, affectedModule: event.target.value }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Affected workspace</label>
              <select
                value={form.workspaceId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, workspaceId: event.target.value }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Submit request
          </button>
        </form>
      )}

      {screen === "detail" && detail && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <button
            type="button"
            onClick={() => {
              setScreen("home");
              setDetail(null);
              setSelectedId(null);
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to support home
          </button>

          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {detail.id}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{detail.subject}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    statusBadgeClass(detail.status),
                  )}
                >
                  {unit311SupportStatusLabel(detail.status)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    severityBadgeClass(detail.severity),
                  )}
                >
                  {unit311SupportSeverityLabel(detail.severity)}
                </span>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd>{unit311SupportCategoryLabel(detail.category)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Module</dt>
                <dd>{detail.affectedModule || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Workspace</dt>
                <dd>{detail.workspaceName || detail.workspaceSlug || detail.workspaceId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last updated</dt>
                <dd>{formatDate(detail.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" />
              Conversation
            </h3>
            <div className="space-y-3">
              {detail.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm",
                    message.authorKind === "internal"
                      ? "border-primary/20 bg-primary/5"
                      : "border-border/70 bg-card",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{message.authorName}</span>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}
            </div>
          </div>

          {detail.status !== "closed" && (
            <form onSubmit={handleReply} className="space-y-3">
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={4}
                placeholder="Write your reply…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={saving || !reply.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                Send reply
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
