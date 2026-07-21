"use client";

import { useEffect, useState } from "react";

import type { FeedbackVerdict } from "@/lib/ai-operating-assistant/explainability";
import { cn } from "@/lib/utils";

const OPTIONS: { verdict: FeedbackVerdict; label: string }[] = [
  { verdict: "helpful", label: "Helpful" },
  { verdict: "not_helpful", label: "Not Helpful" },
  { verdict: "incorrect", label: "Incorrect" },
  { verdict: "missing_data", label: "Missing Data" },
];

function anonymousSessionId() {
  if (typeof window === "undefined") return "anon_ssr";
  try {
    const key = "unit311-ai-anon-session";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = `anon_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return `anon_${Date.now().toString(36)}`;
  }
}

export default function AssistantFeedbackButtons({
  targetId,
  targetType,
  contextView,
}: {
  targetId: string;
  targetType: "insight" | "brief" | "health" | "message" | "recommendation" | "other";
  contextView?: string | null;
}) {
  const [selected, setSelected] = useState<FeedbackVerdict | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState("anon");

  useEffect(() => {
    setSessionId(anonymousSessionId());
  }, []);

  async function submit(verdict: FeedbackVerdict) {
    if (busy || selected) return;
    setBusy(true);
    try {
      const response = await fetch("/api/executive-assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          targetId,
          targetType,
          anonymousSessionId: sessionId,
          contextView: contextView ?? null,
        }),
      });
      if (response.ok) setSelected(verdict);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        Continuous improvement
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {OPTIONS.map((option) => (
          <button
            key={option.verdict}
            type="button"
            disabled={busy || Boolean(selected)}
            onClick={() => void submit(option.verdict)}
            className={cn(
              "rounded-md border px-2 py-1 text-[10px] transition-colors disabled:opacity-60",
              selected === option.verdict
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 text-white/55 hover:bg-white/[0.05]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {selected ? (
        <p className="mt-1 text-[10px] text-white/40">Thanks — anonymous feedback recorded.</p>
      ) : (
        <p className="mt-1 text-[10px] text-white/35">
          Feedback is anonymous and improves prompts, workflows, and tools.
        </p>
      )}
    </div>
  );
}
