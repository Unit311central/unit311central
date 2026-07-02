"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, MessageSquare, XCircle } from "lucide-react";

import type { SupportTicket } from "@/lib/support-data";
import { cn } from "@/lib/utils";

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
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

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
        whatsappSent?: boolean;
        error?: string;
      }>(response);

      if (!response.ok) throw new Error(data.error ?? "Failed to send update");

      const clientMessage = data.clientMessage ?? message;
      onClientMessage?.(clientMessage);
      if (data.ticket) onTicketChange?.(data.ticket);

      setUpdateDraft("");
      const successText = preview
        ? "Update sent to client preview"
        : data.whatsappSent
          ? "Update sent to client on WhatsApp"
          : "Update recorded (WhatsApp not configured)";
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
    if (!preview && !window.confirm(`Close ticket ${ticket.id} and notify the client on WhatsApp?`)) {
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/support/tickets/${ticket.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview }),
      });
      const data = await readApiJson<{
        ticket?: SupportTicket;
        clientMessage?: string;
        whatsappSent?: boolean;
        error?: string;
      }>(response);

      if (!response.ok) throw new Error(data.error ?? "Failed to close ticket");

      if (data.ticket) onTicketChange?.(data.ticket);
      if (data.clientMessage) onClientMessage?.(data.clientMessage);

      const successText = preview
        ? "Ticket closed in demo"
        : data.whatsappSent
          ? "Ticket closed — client notified on WhatsApp"
          : "Ticket closed (WhatsApp not configured)";
      setFeedback(successText);
      onSuccess?.(successText);
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
          Client WhatsApp updates
        </h3>
        {ticket.closed && (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
            Closed
          </span>
        )}
      </div>

      <p className={cn("mt-2 text-white/45", compact ? "text-[10px]" : "text-xs")}>
        Send a status update to the client&apos;s WhatsApp thread, or close the ticket when resolved.
      </p>

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
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 font-semibold text-sky-100 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            compact ? "px-3 py-2 text-[11px]" : "px-3 py-2 text-xs",
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          Send update to client
        </button>
        <button
          type="button"
          disabled={busy || ticket.closed}
          onClick={() => void closeTicket()}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 font-semibold text-red-200 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            compact ? "px-3 py-2 text-[11px]" : "px-3 py-2 text-xs",
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
          Close ticket
        </button>
      </div>

      {feedback && (
        <p
          className={cn(
            "mt-3 rounded-lg border px-3 py-2",
            feedback.toLowerCase().includes("fail") || feedback.includes("not found")
              ? "border-red-400/25 bg-red-500/10 text-red-200"
              : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
