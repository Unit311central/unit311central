"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Phone, Video } from "lucide-react";

import type { SupportTicket } from "@/lib/support-data";
import { isClientSupportChannelRoom } from "@/lib/support-channel-shared";
import { cn } from "@/lib/utils";

type LoungeHistoryMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

type MessagingSupportClientPanelProps = {
  room: string;
  channelName: string;
  clientKey?: string | null;
  onStartCall?: (mode: "voice" | "video") => void;
  onFocusSchedule?: () => void;
  onAfterClientMessage?: () => void;
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

export default function MessagingSupportClientPanel({
  room,
  channelName,
  clientKey,
  onStartCall,
  onFocusSchedule,
  onAfterClientMessage,
}: MessagingSupportClientPanelProps) {
  const enabled = isClientSupportChannelRoom(room) || /^Support\s*-/i.test(channelName);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketId, setTicketId] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"external" | "internal">("external");
  const [history, setHistory] = useState<LoungeHistoryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    void fetch("/api/support/tickets?includeArchived=false", { cache: "no-store" })
      .then((res) => readApiJson<{ tickets?: SupportTicket[]; error?: string }>(res))
      .then((data) => {
        if (cancelled) return;
        const company = channelName.replace(/^Support\s*-\s*/i, "").trim().toLowerCase();
        const open = (data.tickets || []).filter((ticket) => {
          if (ticket.closed || ticket.archived) return false;
          if (clientKey && ticket.clientId === clientKey) return true;
          if (company && (ticket.organisation || "").trim().toLowerCase() === company) return true;
          return Boolean(clientKey)
            ? false
            : company
              ? (ticket.organisation || "").toLowerCase().includes(company)
              : true;
        });
        setTickets(open);
        if (open[0] && !ticketId) setTicketId(open[0].id);
      })
      .catch(() => {
        if (!cancelled) setTickets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when channel changes
  }, [enabled, room, channelName, clientKey]);

  useEffect(() => {
    if (!ticketId) {
      setHistory([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/support/tickets/${encodeURIComponent(ticketId)}/lounge-messages`, {
      cache: "no-store",
    })
      .then((res) => readApiJson<{ messages?: LoungeHistoryMessage[] }>(res))
      .then((data) => {
        if (!cancelled) setHistory(data.messages || []);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId, feedback]);

  const selected = useMemo(
    () => tickets.find((ticket) => ticket.id === ticketId) || null,
    [ticketId, tickets],
  );

  if (!enabled) return null;

  async function sendUpdate() {
    const trimmed = message.trim();
    if (!ticketId || !trimmed || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/support/tickets/${encodeURIComponent(ticketId)}/client-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, mode }),
      });
      const data = await readApiJson<{ emailed?: boolean; mode?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Failed to send update");
      setMessage("");
      if (mode === "internal") {
        setFeedback(`Internal note posted on ${ticketId}`);
      } else {
        setFeedback(
          data.emailed
            ? `External update sent on ${ticketId} (email + lounge + channel + info@)`
            : `External update posted to lounge + channel for ${ticketId}`,
        );
      }
      onAfterClientMessage?.();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to send update");
    } finally {
      setBusy(false);
    }
  }

  async function notifyCallIntent(modeCall: "voice" | "video" | "scheduled") {
    if (!ticketId || busy) return;
    const label =
      modeCall === "scheduled"
        ? "We would like to schedule a call with you. Please reply with a time that works, or use your case link."
        : `Demo Support would like to start a ${modeCall} call with you. Please watch your case link for details.`;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/support/tickets/${encodeURIComponent(ticketId)}/client-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: label, mode: "external" }),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Failed to notify client");
      setFeedback(`Client notified about ${modeCall} call on ${ticketId}`);
      onAfterClientMessage?.();
      if (modeCall === "voice" || modeCall === "video") onStartCall?.(modeCall);
      if (modeCall === "scheduled") onFocusSchedule?.();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to notify client");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-sky-300" />
        <h3 className="text-sm font-semibold text-white">Ticket thread</h3>
      </div>
      <p className="mt-1 text-[11px] text-white/45">
        Choose an open ticket. Internal stays with colleagues; External emails the client, updates
        their lounge as a real person, posts in this channel, and copies info@.
      </p>

      {loading ? (
        <p className="mt-3 inline-flex items-center gap-2 text-xs text-white/45">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading tickets…
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          <select
            value={ticketId}
            onChange={(event) => setTicketId(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
          >
            <option value="">Select ticket…</option>
            {tickets.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.id} — {(ticket.status || "open").replaceAll("_", " ")} —{" "}
                {(ticket.description || ticket.name || "").replace(/\n/g, " ").slice(0, 42)}
              </option>
            ))}
          </select>
          {selected?.ticketPublicUrl ? (
            <a
              href={selected.ticketPublicUrl}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-[11px] text-sky-300 hover:underline"
            >
              Open client case
            </a>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("internal")}
              className={cn(
                "h-9 rounded-xl border text-xs font-semibold",
                mode === "internal"
                  ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                  : "border-white/10 bg-white/[0.03] text-white/60",
              )}
            >
              Internal
            </button>
            <button
              type="button"
              onClick={() => setMode("external")}
              className={cn(
                "h-9 rounded-xl border text-xs font-semibold",
                mode === "external"
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                  : "border-white/10 bg-white/[0.03] text-white/60",
              )}
            >
              External
            </button>
          </div>

          {history.length > 0 ? (
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2">
              {history.slice(-12).map((item) => (
                <div key={item.id} className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    {item.role} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-[11px] text-white/75">{item.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-white/40">No lounge history for this ticket yet.</p>
          )}

          <textarea
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
              mode === "internal"
                ? "Internal note for colleagues…"
                : "External message for the client…"
            }
            className="w-full resize-y rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
          />
          <button
            type="button"
            disabled={busy || !ticketId || !message.trim()}
            onClick={() => void sendUpdate()}
            className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/10 text-sm font-semibold text-sky-100 hover:bg-sky-500/20 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "internal" ? (
              "Post internal note"
            ) : (
              "Send to client"
            )}
          </button>
          {mode === "external" ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={busy || !ticketId}
                onClick={() => void notifyCallIntent("voice")}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/75 disabled:opacity-50"
              >
                <Phone className="h-3.5 w-3.5" />
                Voice
              </button>
              <button
                type="button"
                disabled={busy || !ticketId}
                onClick={() => void notifyCallIntent("video")}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/75 disabled:opacity-50"
              >
                <Video className="h-3.5 w-3.5" />
                Video
              </button>
              <button
                type="button"
                disabled={busy || !ticketId}
                onClick={() => void notifyCallIntent("scheduled")}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/75 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          ) : null}
        </div>
      )}

      {feedback ? <p className="mt-2 text-[11px] text-white/55">{feedback}</p> : null}
    </div>
  );
}
