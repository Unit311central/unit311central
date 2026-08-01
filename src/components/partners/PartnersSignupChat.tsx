"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import Logo from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "assistant" | "user"; content: string };

type ChatState = {
  step: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  partnerId?: string;
  phoneCountryCode?: string;
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

export default function PartnersSignupChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatState>({ step: "welcome" });
  const [draft, setDraft] = useState("");
  const [inputType, setInputType] = useState<"text" | "email" | "otp" | "country" | "phoneCode" | "none">(
    "text",
  );
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/partners/chat", { cache: "no-store" });
        const data = await readJson<{
          reply?: string;
          inputType?: typeof inputType;
          options?: string[];
          state?: ChatState;
          error?: string;
        }>(res);
        if (!res.ok) throw new Error(data.error || "Failed to start chat");
        setMessages([{ role: "assistant", content: data.reply || "Welcome." }]);
        setState(data.state || { step: "welcome" });
        setInputType(data.inputType || "text");
        setOptions(data.options || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start chat");
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(value?: string) {
    const text = (value ?? draft).trim();
    if (!text || busy || inputType === "none") return;
    setBusy(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setDraft("");
    try {
      const res = await fetch("/api/partners/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, message: text }),
      });
      const data = await readJson<{
        reply?: string;
        state?: ChatState;
        inputType?: typeof inputType;
        options?: string[];
        error?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error || "Failed to continue");
      setState(data.state || state);
      setInputType(data.inputType || "text");
      setOptions(data.options || []);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "Thanks." }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(14,165,233,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 10%, rgba(16,185,129,0.12), transparent 50%)",
        }}
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-col items-start gap-4 border-b border-white/10 pb-5">
          <Logo height={56} href="/" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
              Partners
            </p>
            <h1 className="mt-1 font-serif text-3xl tracking-tight text-white sm:text-4xl">
              Distributor & representative signup
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              This is the signup page for distributors and representatives. Chat with our assistant
              to verify your email and create your partner record.
            </p>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto pb-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-auto bg-sky-500/20 text-sky-50"
                  : "border border-white/10 bg-white/[0.04] text-white/90",
              )}
            >
              {message.content}
            </div>
          ))}
          {busy ? (
            <p className="inline-flex items-center gap-2 text-xs text-white/45">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        {error ? (
          <p className="mb-3 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        ) : null}

        {inputType === "none" ? (
          <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Signup complete. Check your email for your unique Partners portal link.
          </p>
        ) : inputType === "country" || inputType === "phoneCode" ? (
          <div className="space-y-2">
            <select
              value=""
              onChange={(event) => {
                if (event.target.value) void send(event.target.value);
              }}
              disabled={busy}
              className="w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-3 text-sm text-white outline-none focus:border-sky-400/50"
            >
              <option value="">
                {inputType === "country" ? "Select country…" : "Select phone country code…"}
              </option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={busy}
              type={inputType === "email" ? "email" : "text"}
              inputMode={inputType === "otp" ? "numeric" : undefined}
              placeholder={
                inputType === "otp"
                  ? "Enter 6-digit code"
                  : inputType === "email"
                    ? "name@company.com"
                    : "Type your answer…"
              }
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1524] px-3 py-3 text-sm text-white outline-none focus:border-sky-400/50"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
