"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Search, Ticket } from "lucide-react";

import {
  fetchInternalUnit311SupportTicket,
  fetchInternalUnit311SupportTickets,
  replyInternalUnit311SupportTicket,
  updateInternalUnit311SupportTicket,
} from "@/lib/unit311-support/client-api";
import {
  UNIT311_SUPPORT_SEVERITIES,
  UNIT311_SUPPORT_STATUSES,
  severityBadgeClass,
  statusBadgeClass,
  unit311SupportCategoryLabel,
  unit311SupportSeverityLabel,
  unit311SupportStatusLabel,
} from "@/lib/unit311-support/data";
import type { Unit311SupportTicket, Unit311SupportTicketDetail } from "@/lib/unit311-support/types";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function Unit311PlatformSupportWorkspace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Unit311SupportTicket[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Unit311SupportTicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchInternalUnit311SupportTickets();
      setTickets(payload.tickets);
      if (!selectedId && payload.tickets[0]) {
        setSelectedId(payload.tickets[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadDetail = useCallback(async (ticketId: string) => {
    setSaving(true);
    setError(null);
    try {
      const payload = await fetchInternalUnit311SupportTicket(ticketId);
      setDetail(payload.ticket);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load ticket.");
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filteredTickets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tickets;
    return tickets.filter((ticket) =>
      [ticket.id, ticket.subject, ticket.organisationName, ticket.workspaceName, ticket.workspaceSlug]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [query, tickets]);

  async function handlePatch(patch: {
    status?: string;
    severity?: string | null;
    assignedTo?: string | null;
  }) {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = await updateInternalUnit311SupportTicket(selectedId, patch);
      setDetail(payload.ticket);
      await loadTickets();
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : "Failed to update ticket.");
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
      const payload = await replyInternalUnit311SupportTicket(selectedId, reply.trim());
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
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Ticket className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">Support</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Unit311 Platform Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer support requests from all client workspaces.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col rounded-xl border border-border/70 bg-card">
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tickets…"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading && tickets.length === 0 ? (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : filteredTickets.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No tickets found.</p>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={cn(
                    "mb-2 w-full rounded-lg border px-3 py-3 text-left transition",
                    selectedId === ticket.id
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/60 hover:border-primary/30",
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">{ticket.id}</p>
                  <p className="truncate text-sm font-medium">{ticket.subject}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {ticket.organisationName} · {ticket.workspaceName || ticket.workspaceSlug}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusBadgeClass(ticket.status),
                      )}
                    >
                      {unit311SupportStatusLabel(ticket.status, "internal")}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        severityBadgeClass(ticket.severity),
                      )}
                    >
                      {unit311SupportSeverityLabel(ticket.severity)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto rounded-xl border border-border/70 bg-card p-5">
          {!detail ? (
            <p className="text-sm text-muted-foreground">Select a ticket to view details.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {detail.id}
                </p>
                <h2 className="mt-1 text-xl font-semibold">{detail.subject}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {detail.organisationName} · {detail.workspaceName || detail.workspaceSlug} ·{" "}
                  {detail.submittedByName}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={detail.status}
                    onChange={(event) => void handlePatch({ status: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    disabled={saving}
                  >
                    {UNIT311_SUPPORT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {unit311SupportStatusLabel(status, "internal")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Severity</label>
                  <select
                    value={detail.severity ?? ""}
                    onChange={(event) =>
                      void handlePatch({
                        severity: event.target.value ? event.target.value : null,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    disabled={saving}
                  >
                    <option value="">Unassigned</option>
                    {UNIT311_SUPPORT_SEVERITIES.map((severity) => (
                      <option key={severity} value={severity}>
                        {unit311SupportSeverityLabel(severity)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Assigned to</label>
                  <input
                    value={detail.assignedTo ?? ""}
                    onChange={(event) => void handlePatch({ assignedTo: event.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Unassigned"
                    disabled={saving}
                  />
                </div>
              </div>

              <dl className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd>{unit311SupportCategoryLabel(detail.category)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Module</dt>
                  <dd>{detail.affectedModule || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatDate(detail.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd>{formatDate(detail.updatedAt)}</dd>
                </div>
              </dl>

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MessageSquare className="h-4 w-4" />
                  Conversation
                </h3>
                {detail.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-lg border px-4 py-3 text-sm",
                      message.authorKind === "internal"
                        ? "border-primary/20 bg-primary/5"
                        : "border-border/70",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {message.authorName} ({message.authorKind})
                      </span>
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{message.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={4}
                  placeholder="Reply to customer…"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
