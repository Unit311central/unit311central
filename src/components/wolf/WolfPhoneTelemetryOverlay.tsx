"use client";

import { useEffect, useState } from "react";

import {
  WOLF_PHONE_TELEMETRY_PATH,
  formatPhoneFix,
  type PhoneFix,
} from "@/lib/wolf/phone-telemetry";

type OverlayState =
  | { kind: "loading" }
  | { kind: "fix"; fix: PhoneFix }
  | { kind: "stale"; ageSec: number }
  | { kind: "waiting" }
  | { kind: "error"; message: string };

export default function WolfPhoneTelemetryOverlay() {
  const [state, setState] = useState<OverlayState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const response = await fetch(WOLF_PHONE_TELEMETRY_PATH, { cache: "no-store" });
        if (cancelled) return;
        if (response.status === 401 || response.status === 403) {
          setState({ kind: "error", message: "Sign in to WOLF to show phone GPS." });
          return;
        }
        if (response.status === 503) {
          setState({
            kind: "error",
            message: "Phone GPS store unavailable (server config).",
          });
          return;
        }
        if (!response.ok) {
          setState({ kind: "error", message: `Phone GPS API HTTP ${response.status}.` });
          return;
        }
        const payload = (await response.json()) as {
          fix?: PhoneFix | null;
          ageMs?: number | null;
          fresh?: boolean;
        };
        if (payload.fix) {
          setState({ kind: "fix", fix: payload.fix });
          return;
        }
        const ageMs = payload.ageMs;
        if (typeof ageMs === "number" && ageMs > 0) {
          setState({ kind: "stale", ageSec: Math.round(ageMs / 1000) });
          return;
        }
        setState({ kind: "waiting" });
      } catch {
        if (!cancelled) setState({ kind: "error", message: "Could not reach phone GPS API." });
      }
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const label = state.kind === "fix" ? formatPhoneFix(state.fix) : null;

  let headline = "Waiting for GPSLogger";
  let subline: string | null = null;
  if (state.kind === "loading") headline = "Checking phone GPS…";
  else if (state.kind === "fix") headline = label!.position;
  else if (state.kind === "stale") {
    headline = "GPS stale";
    subline = `Last fix ${state.ageSec}s ago — keep GPSLogger logging (Tools → Phone Link).`;
  } else if (state.kind === "error") {
    headline = state.message;
    subline = "Use Tools → Phone Link on the phone while logged in.";
  } else {
    subline = "Set POST URL + body from Phone Link; start logging before Brix.";
  }

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 max-w-[85%] rounded-lg bg-black/70 px-3 py-2 text-white shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Phone</p>
      <p className="font-mono text-sm">{headline}</p>
      {label?.detail ? <p className="font-mono text-xs text-white/80">{label.detail}</p> : null}
      {subline && !label?.detail ? (
        <p className="mt-1 text-[11px] leading-snug text-white/65">{subline}</p>
      ) : null}
    </div>
  );
}
