"use client";

import { useCallback, useState } from "react";

const DEFAULT_MESSAGE =
  "Westport paul ormandy open ticket low priority This is a test new ticket";

export default function WhatsAppTicketTestPage() {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/whatsapp/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        ticket?: { id: string };
        whatsappAck?: { ok: boolean };
        error?: string;
      };

      if (!response.ok) throw new Error(data.error ?? "Failed to submit ticket");

      const lines = [
        `Ticket ${data.ticket?.id ?? "created"}.`,
        data.whatsappAck?.ok
          ? "WhatsApp confirmation queued to your phone."
          : "WhatsApp not configured — ticket still created.",
        "Check Internal dashboard → Support and Messaging → Support.",
      ];
      setResult(lines.join(" "));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }, [message]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 bg-[#07111F] p-6 text-white">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">
          Westport client test
        </p>
        <h1 className="mt-2 text-2xl font-semibold">WhatsApp ticket intake</h1>
        <p className="mt-2 text-sm text-white/55">
          Simulates a Westport WhatsApp message. Submit creates a support ticket, posts to the
          Support messaging channel, and sends a WhatsApp confirmation.
        </p>
      </div>

      <label className="block text-xs text-white/45">
        Message
        <textarea
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-3 text-sm text-white outline-none focus:border-sky-400/50"
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="rounded-xl border border-sky-400/30 bg-sky-500/15 px-4 py-3 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/25 disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit ticket (Westport test)"}
      </button>

      {result && (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {result}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <p className="text-xs text-white/35">
        Format:{" "}
        <span className="font-mono text-white/50">
          Organisation Name open ticket priority Description
        </span>
      </p>
    </main>
  );
}
