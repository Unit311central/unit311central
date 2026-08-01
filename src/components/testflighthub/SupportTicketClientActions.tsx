"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, XCircle } from "lucide-react";

import type { SupportTicket } from "@/lib/support-data";
import { cn } from "@/lib/utils";

type LoungeHistoryMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type LoungeAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
};

type SupportTicketClientActionsProps = {
  ticket: SupportTicket;
  preview?: boolean;
  compact?: boolean;
  onTicketChange?: (ticket: SupportTicket) => void;
  onClientMessage?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function fieldClassName(compact: boolean) {
  return cn(
    "w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 text-white outline-none transition-colors focus:border-sky-400/50",
    compact ? "py-2 text-xs" : "py-2 text-sm",
  );
}

export default function SupportTicketClientActions({
  ticket,
  preview = false,
  compact = false,
  onTicketChange,
  onClientMessage,
  onSuccess,
  onError,
}: SupportTicketClientActionsProps) {
  const [updateDraft, setUpdateDraft] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [history, setHistory] = useState<LoungeHistoryMessage[]>([]);
  const [attachments, setAttachments] = useState<LoungeAttachment[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/support/tickets/${encodeURIComponent(ticket.id)}/lounge-messages`, {
      cache: "no-store",
    })
      .then((res) =>
        readApiJson<{ messages?: LoungeHistoryMessage[]; attachments?: LoungeAttachment[] }>(res),
      )
      .then((data) => {
        if (cancelled) return;
        setHistory(data.messages || []);
        setAttachments(data.attachments || []);
      })
      .catch(() => {
        if (!cancelled) {
          setHistory([]);
          setAttachments([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ticket.id, feedback]);

  async function sendClientUpdate() {
    const message = updateDraft.trim();
    if (!message || busy || ticket.closed) return;

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}/client-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, preview }),
      });
      const data = await readApiJson<{
        ticket?: SupportTicket;
        clientMessage?: string;
        emailed?: boolean;
        whatsappSent?: boolean;
        error?: string;
      }>(response);

      if (!response.ok) throw new Error(data.error ?? "Failed to send update");

      const clientMessage = data.clientMessage ?? message;
      onClientMessage?.(clientMessage);
      if (data.ticket) onTicketChange?.(data.ticket);

      setUpdateDraft("");
      const channels = [
        data.emailed ? "email" : null,
        data.whatsappSent ? "WhatsApp" : null,
        "lounge case view",
      ].filter(Boolean);
      const successText = preview
        ? "Update sent to client preview"
        : `Update sent (${channels.join(" + ")})`;
      setFeedback(successText);
      onSuccess?.(successText);
    } catch (updateError) {
      const errorText =
        updateError instanceof Error ? updateError.message : "Failed to send update";
      setFeedback(errorText);
      onError?.(errorText);
    } finally {
      setBusy(false);
    }
  }

  async function closeTicket() {
    if (busy || ticket.closed) return;
    const notes = closeNotes.trim();
    if (!preview && notes.length < 3) {
      setFeedback("Add closing notes before closing the ticket.");
      onError?.("Add closing notes before closing the ticket.");
      return;
    }
    if (
      !preview &&
      !window.confirm(`Close ticket ${ticket.id}? The client will be emailed and the case archived.`)
    ) {
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview, notes }),
      });
      const data = await readApiJson<{
        ticket?: SupportTicket;
        clientMessage?: string;
        emailed?: boolean;
        whatsappSent?: boolean;
        error?: string;
      }>(response);

      if (!response.ok) throw new Error(data.error ?? "Failed to close ticket");

      if (data.ticket) onTicketChange?.(data.ticket);
      if (data.clientMessage) onClientMessage?.(data.clientMessage);

      const successText = preview
        ? "Ticket closed in demo"
        : data.emailed
          ? "Ticket closed — client emailed and case archived"
          : "Ticket closed and archived";
      setFeedback(successText);
      onSuccess?.(successText);
      setCloseNotes("");
    } catch (closeError) {
      const errorText = closeError instanceof Error ? closeError.message : "Failed to close ticket";
      setFeedback(errorText);
      onError?.(errorText);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03]",
        compact ? "p-3" : "p-4",
      )}
    >
      <div className="flex items-center gap-2">
        <MessageSquare className={cn("text-sky-300", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        <h3 className={cn("font-semibold text-white", compact ? "text-xs" : "text-sm")}>
          Client updates
        </h3>
        {ticket.closed && (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
            Closed
          </span>
        )}
      </div>

      <p className={cn("mt-2 text-white/45", compact ? "text-[10px]" : "text-xs")}>
        Send an update to the client (email + lounge + messaging channel + info@). Closing requires
        notes and archives the ticket under this client.
      </p>

      {history.length > 0 ? (
        <div
          className={cn(
            "mt-3 max-h-36 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2",
          )}
        >
          {history.slice(-10).map((item) => (
            <div key={item.id} className="rounded-lg bg-white/[0.03] px-2 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                {item.role} · {new Date(item.createdAt).toLocaleString()}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-[11px] text-white/75">{item.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className="mt-3 space-y-1">
          <p className={cn("text-white/45", compact ? "text-[10px]" : "text-xs")}>Files / voice</p>
          {attachments.map((file) => (
            <a
              key={file.id}
              href={file.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-xs text-sky-300 hover:underline"
            >
              {file.fileName}
              {file.mimeType?.startsWith("audio/") ? " (voice)" : ""}
            </a>
          ))}
        </div>
      ) : null}

      <label className={cn("mt-3 block text-white/45", compact ? "text-[10px]" : "text-xs")}>
        Update for client
        <textarea
          rows={compact ? 3 : 4}
          value={updateDraft}
          onChange={(event) => setUpdateDraft(event.target.value)}
          disabled={busy || ticket.closed}
          placeholder={
            ticket.closed
              ? "Ticket is closed"
              : "e.g. We have reviewed your request and will schedule a site visit tomorrow."
          }
          className={cn(fieldClassName(compact), "mt-1.5 resize-y")}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || ticket.closed || !updateDraft.trim()}
          onClick={() => void sendClientUpdate()}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-500/20 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Send update
        </button>
      </div>

      <label className={cn("mt-4 block text-white/45", compact ? "text-[10px]" : "text-xs")}>
        Closing notes (required)
        <textarea
          rows={compact ? 2 : 3}
          value={closeNotes}
          onChange={(event) => setCloseNotes(event.target.value)}
          disabled={busy || ticket.closed}
          placeholder="Summarise resolution before closing…"
          className={cn(fieldClassName(compact), "mt-1.5 resize-y")}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || ticket.closed || closeNotes.trim().length < 3}
          onClick={() => void closeTicket()}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
          Close ticket
        </button>
      </div>

      {feedback && (
        <p className={cn("mt-3 text-white/55", compact ? "text-[10px]" : "text-xs")}>{feedback}</p>
      )}
    </div>
  );
}
