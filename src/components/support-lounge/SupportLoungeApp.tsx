"use client";

import { FormEvent, useCallback, useEffect, useRef, useState, startTransition } from "react";
import { Loader2, MessageSquare, Send, Ticket } from "lucide-react";

import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

type LoungeTicket = {
  id: string;
  status?: string;
  priority?: string;
  description: string;
  ticketPublicToken?: string | null;
  resumePath?: string | null;
  escalated?: boolean;
  closed?: boolean;
  updatedAt: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

export default function SupportLoungeApp({
  loungeToken,
  activeTicketPublicToken = null,
}: {
  loungeToken: string;
  activeTicketPublicToken?: string | null;
}) {
  const [companyName, setCompanyName] = useState("Support");
  const [loungeTitle, setLoungeTitle] = useState("Demo Support Lounge");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [tickets, setTickets] = useState<LoungeTicket[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTicketToken, setActiveTicketToken] = useState<string | null>(
    activeTicketPublicToken,
  );
  const [panel, setPanel] = useState<"chat" | "tickets">("chat");
  const endRef = useRef<HTMLDivElement>(null);

  const loadBootstrap = useCallback(async () => {
    const loungeRes = await fetch(`/api/support-lounge/${encodeURIComponent(loungeToken)}`, {
      cache: "no-store",
    });
    const loungeData = await readJson<{
      lounge?: { companyName: string; title?: string };
      error?: string;
    }>(loungeRes);
    if (!loungeRes.ok) throw new Error(loungeData.error || "Lounge not found");
    setCompanyName(loungeData.lounge?.companyName || "Support");
    setLoungeTitle(loungeData.lounge?.title || "Demo Support Lounge");

    const ticketsRes = await fetch(
      `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets`,
      { cache: "no-store" },
    );
    const ticketsData = await readJson<{ tickets?: LoungeTicket[]; error?: string }>(ticketsRes);
    if (ticketsRes.ok) setTickets(ticketsData.tickets || []);

    if (activeTicketPublicToken) {
      const ticketRes = await fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets/${encodeURIComponent(activeTicketPublicToken)}`,
        { cache: "no-store" },
      );
      const ticketData = await readJson<{
        ticket?: LoungeTicket;
        messages?: Array<{ role: string; content: string }>;
        error?: string;
      }>(ticketRes);
      if (ticketRes.ok) {
        setActiveTicketToken(activeTicketPublicToken);
        const msgs = (ticketData.messages || [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
        if (msgs.length > 0) {
          setHistory(msgs);
        } else if (ticketData.ticket) {
          setHistory([
            {
              role: "assistant",
              content: `You're viewing ${ticketData.ticket.id} (${ticketData.ticket.status || "open"}). Tell me how you'd like to update it, or ask for a human.`,
            },
          ]);
        }
      }
    } else {
      setHistory([
        {
          role: "assistant",
          content:
            "Welcome to Demo Support Lounge. I'll help you open a support ticket — no login needed.\n\nWhat is your first and last name?",
        },
      ]);
    }
  }, [activeTicketPublicToken, loungeToken]);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => {
      setLoading(true);
      setError(null);
      void loadBootstrap()
        .catch((err) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load lounge");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [loadBootstrap]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, panel]);

  async function handleSend(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;

    const nextHistory = [...history, { role: "user" as const, content: message }];
    setHistory(nextHistory);
    setDraft("");
    setSending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: history.slice(-16),
            activeTicketPublicToken: activeTicketToken,
          }),
        },
      );
      const data = await readJson<{
        reply?: string;
        ticketPublicToken?: string;
        resumePath?: string;
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error || "Chat failed");

      setHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Understood." },
      ]);
      if (data.ticketPublicToken) {
        setActiveTicketToken(data.ticketPublicToken);
        if (data.resumePath && typeof window !== "undefined") {
          window.history.replaceState(null, "", data.resumePath);
        }
      }

      const ticketsRes = await fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets`,
        { cache: "no-store" },
      );
      if (ticketsRes.ok) {
        const ticketsData = await readJson<{ tickets?: LoungeTicket[] }>(ticketsRes);
        setTickets(ticketsData.tickets || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
      setHistory((prev) => prev.slice(0, -1));
      setDraft(message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white/70">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error && history.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-6 text-center">
        <div>
          <p className="text-sm font-medium text-white/80">Support Lounge unavailable</p>
          <p className="mt-2 text-sm text-white/45">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(16,185,129,0.12), transparent 50%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              Support Lounge
            </p>
            <h1 className="mt-1 font-serif text-3xl tracking-tight text-white sm:text-4xl">
              {loungeTitle}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Chat with support AI for {companyName}. Tickets go straight to the Demo operations
              team — no account required.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPanel("chat")}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors",
                panel === "chat"
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]",
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setPanel("tickets")}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors",
                panel === "tickets"
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]",
              )}
            >
              <Ticket className="h-3.5 w-3.5" />
              My tickets ({tickets.length})
            </button>
          </div>
        </header>

        {error && (
          <p className="mb-3 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        {panel === "tickets" ? (
          <div className="flex-1 space-y-3">
            {tickets.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/50">
                No tickets from this browser yet. Start a chat to open one.
              </p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    if (ticket.resumePath) {
                      window.location.href = ticket.resumePath;
                    }
                  }}
                  className="block w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition-colors hover:border-sky-400/30 hover:bg-sky-500/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{ticket.id}</p>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
                      {ticket.status || (ticket.closed ? "closed" : "open")}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-white/55">{ticket.description}</p>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto pb-4">
              {history.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "ml-auto bg-sky-500/20 text-sky-50"
                      : "border border-white/10 bg-white/[0.04] text-white/85",
                  )}
                >
                  {message.content}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form onSubmit={handleSend} className="sticky bottom-0 border-t border-white/10 bg-[#0b1220]/90 pt-4 backdrop-blur">
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your reply…"
                  disabled={sending}
                  className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-sky-400/40"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/40 bg-sky-500/20 text-sky-100 transition-colors hover:bg-sky-500/30 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/35">
                Same browser remembers your tickets. Ask anytime to speak with a person.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
