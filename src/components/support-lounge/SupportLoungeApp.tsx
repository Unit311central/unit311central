"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react";
import {
  FileUp,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  Send,
  Square,
  Ticket,
  X,
} from "lucide-react";

import Logo from "@/components/layout/Logo";
import { LOUNGE_ATTACHMENT_ACCEPT, isAllowedLoungeAttachment } from "@/lib/support-lounge-attachments";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant" | "operator" | "system";
  content: string;
  createdAt?: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
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
  ticketPublicUrl?: string | null;
  resumePath?: string | null;
  escalated?: boolean;
  closed?: boolean;
  updatedAt: string;
  createdAt?: string;
  userAssigned?: string | null;
};

type LoungeAttachment = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

type IntakeStep =
  | "name"
  | "email"
  | "department"
  | "role"
  | "kind"
  | "existing"
  | "description"
  | "upload"
  | "done";

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

function parseProblemDescription(description: string) {
  const lines = description.split("\n").map((line) => line.trim()).filter(Boolean);
  const meta: Record<string, string> = {};
  const body: string[] = [];
  for (const line of lines) {
    const match = line.match(/^(Name|Email|Department|Role|Ticket type):\s*(.+)$/i);
    if (match) meta[match[1].toLowerCase()] = match[2];
    else body.push(line);
  }
  return { meta, body: body.join("\n") || description };
}

export default function SupportLoungeApp({
  loungeToken,
  activeTicketPublicToken = null,
}: {
  loungeToken: string;
  activeTicketPublicToken?: string | null;
}) {
  const [companyName, setCompanyName] = useState("Support");
  const [loungeTitle, setLoungeTitle] = useState("Support Lounge");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [tickets, setTickets] = useState<LoungeTicket[]>([]);
  const [openTickets, setOpenTickets] = useState<LoungeTicket[]>([]);
  const [existingIdDraft, setExistingIdDraft] = useState("");
  const [caseTicket, setCaseTicket] = useState<LoungeTicket | null>(null);
  const [attachments, setAttachments] = useState<LoungeAttachment[]>([]);
  const [draft, setDraft] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTicketToken, setActiveTicketToken] = useState<string | null>(
    activeTicketPublicToken,
  );
  const [panel, setPanel] = useState<"chat" | "tickets">("chat");
  const [origin, setOrigin] = useState("");
  const [intakeStep, setIntakeStep] = useState<IntakeStep>("name");
  const [intake, setIntake] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "",
    ticketKind: "new" as "new" | "existing",
    existingTicketId: "",
    description: "",
  });
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intakeFileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const caseMode = Boolean(activeTicketToken && caseTicket);
  const intakeMode = !activeTicketPublicToken && !caseMode && intakeStep !== "done";

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
        if (msgs.length > 0) setHistory(msgs);
        else if (payload.ticket) {
          setHistory([
            {
              role: "assistant",
              content: `You're viewing ${payload.ticket.id}. Add information on the right, upload a file, or ask for a human here.`,
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
      lounge?: { companyName: string; title?: string; logoUrl?: string };
      error?: string;
    }>(loungeRes);
    if (!loungeRes.ok) throw new Error(loungeData.error || "Lounge not found");
    setCompanyName(loungeData.lounge?.companyName || "Support");
    setLoungeTitle(loungeData.lounge?.title || loungeData.lounge?.companyName || "Support Lounge");
    setLogoUrl(loungeData.lounge?.logoUrl || null);

    const ticketsRes = await fetch(
      `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets`,
      { cache: "no-store" },
    );
    const ticketsData = await readJson<{
      tickets?: LoungeTicket[];
      openTickets?: LoungeTicket[];
      error?: string;
    }>(ticketsRes);
    if (ticketsRes.ok) {
      setTickets(ticketsData.tickets || []);
      setOpenTickets(ticketsData.openTickets || ticketsData.tickets || []);
    }

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
      setIntakeStep("done");
    } else {
      setCaseTicket(null);
      setAttachments([]);
      setIntakeStep("name");
      setHistory([
        {
          role: "assistant",
          content:
            "Welcome to Demo Support Lounge. I'll help you open a support ticket.\n\nWhat is your first and last name?",
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
  }, [history, panel, intakeStep]);

  // Poll case updates so operator messages appear for the client.
  useEffect(() => {
    if (!activeTicketToken || !caseMode) return;
    const timer = window.setInterval(() => {
      void fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets/${encodeURIComponent(activeTicketToken)}`,
        { cache: "no-store" },
      )
        .then((res) => readJson<{ ticket?: LoungeTicket; messages?: ChatMessage[]; attachments?: LoungeAttachment[] }>(res))
        .then((data) => applyTicketPayload(data))
        .catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [activeTicketToken, applyTicketPayload, caseMode, loungeToken]);

  async function refreshTickets() {
    const ticketsRes = await fetch(
      `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets`,
      { cache: "no-store" },
    );
    if (ticketsRes.ok) {
      const ticketsData = await readJson<{ tickets?: LoungeTicket[]; openTickets?: LoungeTicket[] }>(
        ticketsRes,
      );
      setTickets(ticketsData.tickets || []);
      setOpenTickets(ticketsData.openTickets || ticketsData.tickets || []);
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

  function pushAssistant(content: string) {
    setHistory((prev) => [...prev, { role: "assistant", content }]);
  }

  function pushUser(content: string) {
    setHistory((prev) => [...prev, { role: "user", content }]);
  }

  async function submitIntakeCreate() {
    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("firstName", intake.firstName);
      form.set("lastName", intake.lastName);
      form.set("email", intake.email);
      form.set("department", intake.department);
      form.set("role", intake.role);
      form.set("ticketKind", intake.ticketKind);
      form.set("existingTicketId", intake.existingTicketId);
      form.set("description", intake.description);
      form.set("summary", intake.description.split("\n")[0]?.slice(0, 80) || "Support request");
      for (const file of pendingFiles) form.append("files", file);

      const response = await fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets`,
        { method: "POST", body: form },
      );
      const data = await readJson<{
        reply?: string;
        ticketPublicToken?: string;
        resumePath?: string;
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error || "Failed to create ticket");

      pushAssistant(data.reply || "Ticket created.");
      setPendingFiles([]);
      setIntakeStep("done");
      if (data.ticketPublicToken) {
        setActiveTicketToken(data.ticketPublicToken);
        if (data.resumePath) window.history.replaceState(null, "", data.resumePath);
        await reloadActiveCase(data.ticketPublicToken);
      }
      await refreshTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSending(false);
    }
  }

  function advanceIntake(userText: string) {
    const text = userText.trim();
    if (!text || sending) return;
    pushUser(text);
    setDraft("");

    if (intakeStep === "name") {
      const parts = text.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ");
      setIntake((prev) => ({ ...prev, firstName, lastName }));
      setIntakeStep("email");
      pushAssistant(`Thank you${firstName ? `, ${firstName}` : ""}. What is your company email address?`);
      return;
    }
    if (intakeStep === "email") {
      // No format gate — email is for updates only, never blocks intake.
      setIntake((prev) => ({ ...prev, email: text }));
      setIntakeStep("department");
      pushAssistant("Thank you. What is your department?");
      return;
    }
    if (intakeStep === "department") {
      setIntake((prev) => ({ ...prev, department: text }));
      setIntakeStep("role");
      pushAssistant("Thank you. What is your role or job title?");
      return;
    }
    if (intakeStep === "role") {
      setIntake((prev) => ({ ...prev, role: text }));
      setIntakeStep("kind");
      pushAssistant("Is this a new ticket or an existing ticket? Choose below.");
      return;
    }
    if (intakeStep === "description") {
      setIntake((prev) => ({ ...prev, description: text }));
      setIntakeStep("upload");
      pushAssistant(
        "Thanks. Optionally upload an image, document, or file below, then tap Create ticket.",
      );
      return;
    }
  }

  function chooseTicketKind(kind: "new" | "existing") {
    setIntake((prev) => ({ ...prev, ticketKind: kind }));
    pushUser(kind === "new" ? "New ticket" : "Existing ticket");
    if (kind === "existing") {
      setIntakeStep("existing");
      setExistingIdDraft("");
      pushAssistant(
        openTickets.length > 0
          ? "Select the existing ticket from the dropdown, or type a ticket ID (e.g. SUP-023)."
          : "No open tickets found yet for this company. Type a ticket ID if you have one, or go back and choose New ticket.",
      );
      return;
    }
    setIntakeStep("description");
    pushAssistant("Please provide a description of the problem you are experiencing.");
  }

  function chooseExistingTicket(ticketId: string) {
    const id = ticketId.trim().toUpperCase();
    if (!id) return;
    setIntake((prev) => ({ ...prev, existingTicketId: id, ticketKind: "existing" }));
    pushUser(id);
    setIntakeStep("description");
    pushAssistant("What update or additional detail should we add to that case?");
  }

  async function handleCaseChat(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || sending || !activeTicketToken) return;
    pushUser(message);
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
              .slice(-8),
            activeTicketPublicToken: activeTicketToken,
          }),
        },
      );
      const data = await readJson<{ reply?: string; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Chat failed");
      pushAssistant(data.reply || "Thanks — update recorded.");
      await reloadActiveCase(activeTicketToken);
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
    const check = isAllowedLoungeAttachment(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets/${encodeURIComponent(activeTicketToken)}`,
        { method: "POST", body: form },
      );
      const data = await readJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Upload failed");
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
      const data = await readJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Could not add information");
      setExtraInfo("");
      await reloadActiveCase(activeTicketToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add information");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleCancelTicket() {
    if (!activeTicketToken || cancelling || caseTicket?.closed) return;
    if (!window.confirm("Cancel this support ticket? Demo Support will be notified.")) return;
    setCancelling(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/support-lounge/${encodeURIComponent(loungeToken)}/tickets/${encodeURIComponent(activeTicketToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "cancel",
            reason: extraInfo.trim() || "Cancelled by requester",
          }),
        },
      );
      const data = await readJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "Could not cancel ticket");
      setExtraInfo("");
      await reloadActiveCase(activeTicketToken);
      await refreshTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel ticket");
    } finally {
      setCancelling(false);
    }
  }

  function addPendingFile(file: File | null) {
    if (!file) return;
    const check = isAllowedLoungeAttachment(file);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setPendingFiles((prev) => [...prev, file]);
  }

  async function startVoiceNote() {
    if (recording) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        });
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        if (intakeMode && intakeStep === "upload") {
          addPendingFile(file);
        } else if (activeTicketToken) {
          void handleUpload(file);
        } else {
          addPendingFile(file);
        }
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access is required to record a voice note.");
    }
  }

  function stopVoiceNote() {
    if (!recording) return;
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  const problem = useMemo(
    () => (caseTicket ? parseProblemDescription(caseTicket.description) : null),
    [caseTicket],
  );

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
          "relative mx-auto w-full px-3 py-4 sm:px-6 sm:py-6",
          caseMode ? "max-w-6xl" : "max-w-5xl",
        )}
      >
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-4 sm:mb-6 sm:pb-5">
          <div className="min-w-0 flex-1 space-y-3">
            <Logo href="https://unit311central.com" height={44} />
            <div className="flex min-w-0 items-start gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Dicebear logo per client
                <img
                  src={logoUrl}
                  alt={`${companyName} logo`}
                  className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 bg-white/90 object-cover sm:h-16 sm:w-16"
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
                  Support Lounge
                </p>
                <h1 className="mt-1 font-serif text-3xl tracking-tight text-white sm:text-5xl">
                  {loungeTitle || companyName}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
                  {caseMode
                    ? `Case ${caseTicket?.id}. Bookmark this page for updates, enter new information, and chat with your support advisor. For any problems you can always email support@unit311central.com.`
                    : "Create a new support request to Demo. After your request is submitted, you will be emailed with updates and the web address to visit to get updates, enter new information and chat with your support advisor. For any problems you can always email support@unit311central.com"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPanel("chat")}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors",
                panel === "chat"
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                  : "border-white/10 bg-white/[0.03] text-white/60",
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
                  : "border-white/10 bg-white/[0.03] text-white/60",
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
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Summary</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-white/45">
                      No tickets from this browser yet.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="cursor-pointer border-b border-white/5 hover:bg-sky-500/5"
                      onClick={() => {
                        if (ticket.resumePath) window.location.href = ticket.resumePath;
                      }}
                    >
                      <td className="px-3 py-3 font-mono text-xs text-sky-300">{ticket.id}</td>
                      <td className="px-3 py-3 capitalize text-white/80">
                        {(ticket.status || (ticket.closed ? "closed" : "open")).replaceAll("_", " ")}
                      </td>
                      <td className="px-3 py-3 text-white/60">{formatWhen(ticket.createdAt)}</td>
                      <td className="px-3 py-3 text-white/60">{formatWhen(ticket.updatedAt)}</td>
                      <td className="px-3 py-3 text-white/80">{displayName(ticket)}</td>
                      <td className="px-3 py-3 text-white/60">{ticket.requesterEmail || "—"}</td>
                      <td className="max-w-[16rem] truncate px-3 py-3 text-white/55">
                        {ticket.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4 sm:gap-6",
              caseMode ? "lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]" : "",
            )}
          >
            <div className={cn(!caseMode && "mx-auto w-full max-w-2xl")}>
              <div className="space-y-3">
                {history.map((message, index) => (
                  <div
                    key={`${message.role}-${index}-${message.createdAt || ""}`}
                    className={cn(
                      "max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? "ml-auto bg-sky-500/20 text-sky-50"
                        : message.role === "operator"
                          ? "border-2 border-emerald-400/50 bg-emerald-500/15 text-emerald-50 shadow-[0_0_0_1px_rgba(52,211,153,0.25)]"
                          : message.role === "system"
                            ? "border border-amber-400/20 bg-amber-500/10 text-amber-50/90"
                            : "border border-white/10 bg-white/[0.04] text-white/85",
                    )}
                  >
                    {message.role === "operator" ? (
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                        Demo Support · Live update
                      </p>
                    ) : null}
                    <div
                      className={cn(
                        message.role === "operator" && "text-[15px] font-semibold leading-relaxed",
                      )}
                    >
                      {message.content}
                    </div>
                    {message.attachmentUrl ? (
                      <a
                        href={message.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-2 text-xs text-sky-300 hover:underline"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {message.attachmentName || "Attachment"}
                      </a>
                    ) : null}
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {intakeMode && intakeStep === "kind" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => chooseTicketKind("new")}
                    className="rounded-xl border border-sky-400/40 bg-sky-500/20 px-4 py-2.5 text-sm font-semibold text-sky-100"
                  >
                    New ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseTicketKind("existing")}
                    className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80"
                  >
                    Existing ticket
                  </button>
                </div>
              ) : null}

              {intakeMode && intakeStep === "existing" ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/45">
                    Existing ticket
                    <select
                      className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-[#0b1524] px-4 text-sm text-white outline-none focus:border-sky-400/40"
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) chooseExistingTicket(event.target.value);
                      }}
                    >
                      <option value="">Select from open tickets…</option>
                      {openTickets.map((ticket) => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.id} — {(ticket.status || "open").replaceAll("_", " ")} —{" "}
                          {ticket.description.replace(/\n/g, " ").slice(0, 48)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={existingIdDraft}
                      onChange={(event) => setExistingIdDraft(event.target.value)}
                      placeholder="Or type ticket ID (SUP-023)"
                      className="h-12 flex-1 rounded-2xl border border-white/10 bg-[#0b1524] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-sky-400/40"
                    />
                    <button
                      type="button"
                      disabled={!existingIdDraft.trim()}
                      onClick={() => chooseExistingTicket(existingIdDraft)}
                      className="inline-flex h-12 items-center rounded-2xl border border-sky-400/40 bg-sky-500/20 px-4 text-sm font-semibold text-sky-100 disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {intakeMode && intakeStep === "upload" ? (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <input
                    ref={intakeFileRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept={LOUNGE_ATTACHMENT_ACCEPT}
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      for (const file of files) addPendingFile(file);
                      event.target.value = "";
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => intakeFileRef.current?.click()}
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm text-white/80"
                    >
                      <FileUp className="h-4 w-4" />
                      Upload file
                    </button>
                    <button
                      type="button"
                      onClick={() => (recording ? stopVoiceNote() : void startVoiceNote())}
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm",
                        recording
                          ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
                          : "border-white/15 bg-white/[0.04] text-white/80",
                      )}
                    >
                      {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {recording ? "Stop voice note" : "Record voice note"}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/40">
                    PDF, Office, images, audio, video, zip — max 100 MB each.
                  </p>
                  {pendingFiles.length > 0 ? (
                    <ul className="space-y-1 text-xs text-white/60">
                      {pendingFiles.map((file) => (
                        <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-2">
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingFiles((prev) => prev.filter((item) => item !== file))
                            }
                            className="text-white/40 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-white/40">Optional — you can skip and create the ticket now.</p>
                  )}
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void submitIntakeCreate()}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/20 text-sm font-semibold text-sky-100 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create ticket"}
                  </button>
                </div>
              ) : null}

              {(!intakeMode ||
                (intakeStep !== "kind" &&
                  intakeStep !== "existing" &&
                  intakeStep !== "upload")) && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (intakeMode) advanceIntake(draft);
                    else void handleCaseChat(event);
                  }}
                  className="mt-4 border-t border-white/10 pt-4"
                >
                  <div className="flex gap-2">
                    {activeTicketToken ? (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept={LOUNGE_ATTACHMENT_ACCEPT}
                          onChange={(e) => void handleUpload(e.target.files?.[0] || null)}
                        />
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70"
                          title="Upload file"
                        >
                          {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileUp className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => (recording ? stopVoiceNote() : void startVoiceNote())}
                          className={cn(
                            "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white/[0.04]",
                            recording
                              ? "border-rose-400/40 text-rose-200"
                              : "border-white/10 text-white/70",
                          )}
                          title={recording ? "Stop voice note" : "Record voice note"}
                        >
                          {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/40 bg-sky-500/20 text-sky-100 disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-white/35">
                    At any time simply type in &quot;speak to an advisor&quot; and we&apos;ll connect
                    you with your assigned support engineer. Please note responses may not always be
                    immediate.
                  </p>
                </form>
              )}
            </div>

            {caseMode && caseTicket ? (
              <aside className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] lg:sticky lg:top-4 lg:self-start">
                <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                    Case summary
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h2 className="font-mono text-2xl font-semibold tracking-tight text-white">
                      {caseTicket.id}
                    </h2>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        caseTicket.closed
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                          : "border-sky-400/30 bg-sky-500/10 text-sky-100",
                      )}
                    >
                      {(caseTicket.status || (caseTicket.closed ? "closed" : "open")).replaceAll(
                        "_",
                        " ",
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">{caseTicket.organisation || companyName}</p>
                </div>

                <div className="space-y-5 px-4 py-4 sm:px-5">
                  <dl className="grid grid-cols-2 gap-3">
                    {[
                      ["Created", formatWhen(caseTicket.createdAt)],
                      ["Updated", formatWhen(caseTicket.updatedAt)],
                      ["Name", displayName(caseTicket)],
                      ["Email", caseTicket.requesterEmail || "—"],
                      [
                        "Department",
                        caseTicket.requesterDepartment || problem?.meta.department || "—",
                      ],
                      ["Role", caseTicket.requesterRole || problem?.meta.role || "—"],
                      ["Priority", caseTicket.priority || "medium"],
                      ["Assigned", caseTicket.userAssigned || "Unassigned"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5"
                      >
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                          {label}
                        </dt>
                        <dd className="mt-1 break-words text-sm text-white/90">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                      Problem
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                      {problem?.body || caseTicket.description}
                    </p>
                  </div>

                  {(caseTicket.ticketPublicUrl || caseTicket.resumePath) && (
                    <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200/70">
                        Bookmark for updates
                      </p>
                      <a
                        href={caseTicket.ticketPublicUrl || caseTicket.resumePath || "#"}
                        className="mt-2 block break-all text-sm text-sky-200 hover:underline"
                      >
                        {caseTicket.ticketPublicUrl ||
                          (origin ? `${origin}${caseTicket.resumePath}` : caseTicket.resumePath)}
                      </a>
                    </div>
                  )}

                  {attachments.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        Files
                      </p>
                      <ul className="mt-2 space-y-2">
                        {attachments.map((file) => (
                          <li key={file.id}>
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-sky-300 hover:bg-white/[0.04]"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                              {file.fileName}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <form onSubmit={handleAddInfo} className="border-t border-white/10 pt-4">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                      Send an update
                    </label>
                    <textarea
                      value={extraInfo}
                      onChange={(e) => setExtraInfo(e.target.value)}
                      rows={3}
                      disabled={caseTicket.closed}
                      placeholder={
                        caseTicket.closed
                          ? "This ticket is closed"
                          : "Add more detail for the support team…"
                      }
                      className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={savingNote || !extraInfo.trim() || caseTicket.closed}
                      className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/20 px-4 text-xs font-semibold text-sky-100 disabled:opacity-50"
                    >
                      {savingNote ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send update to support"
                      )}
                    </button>
                    {!caseTicket.closed ? (
                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={() => void handleCancelTicket()}
                        className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 text-xs font-semibold text-rose-100 disabled:opacity-50"
                      >
                        {cancelling ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Cancel this ticket"
                        )}
                      </button>
                    ) : null}
                  </form>
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
