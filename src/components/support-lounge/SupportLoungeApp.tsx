"use client";

import { FormEvent, useCallback, useEffect, useRef, useState, startTransition } from "react";
import {
  FileUp,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Ticket,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant" | "operator" | "system";
  content: string;
  createdAt?: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  attachmentMime?: string | null;
};

type LoungeTicket = {
  id: string;
  status?: string;
  priority?: string;
  description: string;
  name?: string;
  organisation?: string;
  requesterEmail?: string | null;
  requesterFirstName?: string | null;
  requesterLastName?: string | null;
  requesterDepartment?: string | null;
  requesterRole?: string | null;
  ticketKind?: string | null;
  ticketPublicToken?: string | null;
  resumePath?: string | null;
  escalated?: boolean;
  closed?: boolean;
  updatedAt: string;
  createdAt?: string;
};

type LoungeAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
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

function formatWhen(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function displayName(ticket: LoungeTicket) {
  const composed = [ticket.requesterFirstName, ticket.requesterLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return composed || ticket.name || "—";
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
  const [caseTicket, setCaseTicket] = useState<LoungeTicket | null>(null);
  const [attachments, setAttachments] = useState<LoungeAttachment[]>([]);
  const [draft, setDraft] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTicketToken, setActiveTicketToken] = useState<string | null>(
    activeTicketPublicToken,
  );
  const [panel, setPanel] = useState<"chat" | "tickets">("chat");
  const [origin, setOrigin] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const caseMode = Boolean(activeTicketToken && caseTicket);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const applyTicketPayload = useCallback(
    (payload: {
      ticket?: LoungeTicket;
      messages?: ChatMessage[];
      attachments?: LoungeAttachment[];
    }) => {
      if (payload.ticket) {
        setCaseTicket(payload.ticket);
        if (payload.ticket.ticketPublicToken) {
          setActiveTicketToken(payload.ticket.ticketPublicToken);
        }
      }
      if (payload.attachments) setAttachments(payload.attachments);
      if (payload.messages) {
        const msgs = payload.messages.filter(
          (m) =>
            m.role === "user" ||
            m.role === "assistant" ||
            m.role === "operator" ||
            m.role === "system",
        );
        if (msgs.length > 0) {
          setHistory(msgs);
        } else if (payload.ticket) {
          setHistory([
            {
              role: "assistant",
              content: `You're viewing ${payload.ticket.id} (${payload.ticket.status || "open"}). Add more information on the right, upload a file below, or ask for a human here.`,
            },
          ]);
        }
      }
    },
    [],
  );

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
        messages?: ChatMessage[];
        attachments?: LoungeAttachment[];
        error?: string;
      }>(ticketRes);
      if (!ticketRes.ok) throw new Error(ticketData.error || "Ticket not found");
      applyTicketPayload(ticketData);
    } else {
      setCaseTicket(null);
      setAttachments([]);
      setHistory([
        {
          role: "assistant",
          content:
            "Welcome to Demo Support Lounge. I'll help you open a support ticket — no login needed.\n\nWhat is your first and last name?",
        },
      ]);
    }
  }, [activeTicketPublicToken, applyTicketPayload, loungeToken]);

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

  async function refreshTickets() {
    const ticketsRes = await fetch(
      `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets`,
      { cache: "no-store" },
    );
    if (ticketsRes.ok) {
      const ticketsData = await readJson<{ tickets?: LoungeTicket[] }>(ticketsRes);
      setTickets(ticketsData.tickets || []);
    }
  }

  async function reloadActiveCase(token: string) {
    const ticketRes = await fetch(
      `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
    const ticketData = await readJson<{
      ticket?: LoungeTicket;
      messages?: ChatMessage[];
      attachments?: LoungeAttachment[];
      error?: string;
    }>(ticketRes);
    if (!ticketRes.ok) throw new Error(ticketData.error || "Failed to reload case");
    applyTicketPayload(ticketData);
  }

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
            history: history
              .filter((m) => m.role === "user" || m.role === "assistant")
              .slice(-16),
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
        await reloadActiveCase(data.ticketPublicToken);
      }

      await refreshTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
      setHistory((prev) => prev.slice(0, -1));
      setDraft(message);
    } finally {
      setSending(false);
    }
  }

  async function handleUpload(file: File | null) {
    if (!file || !activeTicketToken || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets/${encodeURIComponent(activeTicketToken)}`,
        { method: "POST", body: form },
      );
      const data = await readJson<{
        messages?: ChatMessage[];
        attachments?: LoungeAttachment[];
        ticket?: LoungeTicket;
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error || "Upload failed");
      if (data.messages) setHistory(data.messages);
      if (data.ticket) setCaseTicket(data.ticket);
      await reloadActiveCase(activeTicketToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddInfo(event: FormEvent) {
    event.preventDefault();
    const note = extraInfo.trim();
    if (!note || !activeTicketToken || savingNote) return;
    setSavingNote(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets/${encodeURIComponent(activeTicketToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note }),
        },
      );
      const data = await readJson<{
        messages?: ChatMessage[];
        ticket?: LoungeTicket;
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error || "Could not add information");
      if (data.messages) setHistory(data.messages);
      if (data.ticket) setCaseTicket(data.ticket);
      setExtraInfo("");
      await reloadActiveCase(activeTicketToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add information");
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white/70">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error && history.length === 0 && !caseTicket) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] px-6 text-center">
        <div>
          <p className="text-sm font-medium text-white/80">Support Lounge unavailable</p>
          <p className="mt-2 text-sm text-white/45">{error}</p>
        </div>
      </div>
    );
  }

  const updates = history.filter(
    (m) => m.role === "user" || m.role === "assistant" || m.role === "operator" || m.role === "system",
  );

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(16,185,129,0.12), transparent 50%)",
        }}
      />

      <div
        className={cn(
          "relative mx-auto w-full px-4 py-6 sm:px-6",
          caseMode ? "max-w-6xl" : "max-w-5xl",
        )}
      >
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              Support Lounge
            </p>
            <h1 className="mt-1 font-serif text-3xl tracking-tight text-white sm:text-4xl">
              {loungeTitle}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              {caseMode
                ? `Case ${caseTicket?.id} for ${companyName}. Bookmark this page for updates.`
                : `Chat with support AI for ${companyName}. Tickets go straight to the Demo operations team — no account required.`}
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
          <div
            className={cn(
              "grid gap-6",
              caseMode ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]" : "",
            )}
          >
            <div className={cn(!caseMode && "mx-auto w-full max-w-2xl")}>
              <div className="space-y-3">
                {history.map((message, index) => (
                  <div
                    key={`${message.role}-${index}-${message.createdAt || ""}`}
                    className={cn(
                      "max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? "ml-auto bg-sky-500/20 text-sky-50"
                        : message.role === "system"
                          ? "border border-amber-400/20 bg-amber-500/10 text-amber-50/90"
                          : "border border-white/10 bg-white/[0.04] text-white/85",
                    )}
                  >
                    {message.content}
                    {message.attachmentUrl ? (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-2 text-xs text-sky-300 underline-offset-2 hover:underline"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {message.attachmentName || "Attachment"}
                      </a>
                    ) : null}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <form onSubmit={handleSend} className="mt-4 border-t border-white/10 pt-4">
                <div className="flex gap-2">
                  {activeTicketToken ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                        onChange={(e) => void handleUpload(e.target.files?.[0] || null)}
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload image, document, or file"
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileUp className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  ) : null}
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your reply…"
                    disabled={sending}
                    autoFocus
                    className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-sky-400/40"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/40 bg-sky-500/20 text-sky-100 transition-colors hover:bg-sky-500/30 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-white/35">
                  {activeTicketToken
                    ? "Upload images or documents anytime. Ask to speak with a person if you need human help."
                    : "Same browser remembers your tickets. Ask anytime to speak with a person."}
                </p>
              </form>
            </div>

            {caseMode && caseTicket ? (
              <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-6 lg:self-start">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                  Case summary
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                  {caseTicket.id}
                </h2>
                <p className="mt-1 text-sm text-white/50">{caseTicket.organisation || companyName}</p>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                    <dt className="text-white/45">Status</dt>
                    <dd className="text-right font-medium capitalize text-white/90">
                      {(caseTicket.status || "open").replaceAll("_", " ")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                    <dt className="text-white/45">Created</dt>
                    <dd className="text-right text-white/90">{formatWhen(caseTicket.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                    <dt className="text-white/45">Updated</dt>
                    <dd className="text-right text-white/90">{formatWhen(caseTicket.updatedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                    <dt className="text-white/45">Name</dt>
                    <dd className="text-right text-white/90">{displayName(caseTicket)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                    <dt className="text-white/45">Email</dt>
                    <dd className="break-all text-right text-white/90">
                      {caseTicket.requesterEmail || "—"}
                    </dd>
                  </div>
                  {caseTicket.requesterDepartment ? (
                    <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                      <dt className="text-white/45">Department</dt>
                      <dd className="text-right text-white/90">{caseTicket.requesterDepartment}</dd>
                    </div>
                  ) : null}
                  {caseTicket.requesterRole ? (
                    <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                      <dt className="text-white/45">Role</dt>
                      <dd className="text-right text-white/90">{caseTicket.requesterRole}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                    <dt className="text-white/45">Priority</dt>
                    <dd className="text-right capitalize text-white/90">
                      {caseTicket.priority || "medium"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    Problem
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                    {caseTicket.description}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    Get updates
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    Use this private case link anytime (also emailed to you):
                  </p>
                  {caseTicket.resumePath ? (
                    <a
                      href={caseTicket.resumePath}
                      className="mt-2 block break-all text-sm text-sky-300 underline-offset-2 hover:underline"
                    >
                      {origin
                        ? `${origin}${caseTicket.resumePath}`
                        : caseTicket.resumePath}
                    </a>
                  ) : null}
                </div>

                {attachments.length > 0 ? (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                      Files
                    </p>
                    <ul className="mt-2 space-y-2">
                      {attachments.map((file) => (
                        <li key={file.id}>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-sky-300 hover:underline"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {file.fileName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    Recent updates
                  </p>
                  <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                    {updates
                      .slice(-8)
                      .reverse()
                      .map((item, index) => (
                        <li
                          key={`update-${index}`}
                          className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-xs text-white/65"
                        >
                          <span className="font-medium capitalize text-white/85">{item.role}</span>
                          {item.createdAt ? (
                            <span className="text-white/35"> · {formatWhen(item.createdAt)}</span>
                          ) : null}
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap">{item.content}</p>
                        </li>
                      ))}
                  </ul>
                </div>

                <form onSubmit={handleAddInfo} className="mt-6 border-t border-white/10 pt-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    Add information
                  </label>
                  <textarea
                    value={extraInfo}
                    onChange={(e) => setExtraInfo(e.target.value)}
                    rows={3}
                    placeholder="Add more detail for the support team…"
                    className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-sky-400/40"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !extraInfo.trim()}
                    className="mt-2 inline-flex h-10 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/20 px-4 text-xs font-semibold text-sky-100 transition-colors hover:bg-sky-500/30 disabled:opacity-50"
                  >
                    {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to case"}
                  </button>
                </form>
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
