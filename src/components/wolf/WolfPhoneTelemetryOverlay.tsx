"use client";

import { useCallback, useEffect, useState } from "react";

import {
  WOLF_PHONE_TELEMETRY_PATH,
  formatPhoneFix,
  type PhoneFix,
} from "@/lib/wolf/phone-telemetry";
import { pushPhoneGpsToWolf } from "@/lib/wolf/phone-telemetry-push";
import { isWolfNativeShell } from "@/lib/wolf/phone-native-shell";

type OverlayState =
  | { kind: "loading" }
  | { kind: "fix"; fix: PhoneFix }
  | { kind: "stale"; ageSec: number }
  | { kind: "waiting" }
  | { kind: "error"; message: string };

export default function WolfPhoneTelemetryOverlay() {
  const [state, setState] = useState<OverlayState>({ kind: "loading" });
  const [nativeApp, setNativeApp] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState("");

  const pull = useCallback(async () => {
    try {
      const response = await fetch(WOLF_PHONE_TELEMETRY_PATH, { cache: "no-store" });
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
      setState({ kind: "error", message: "Could not reach phone GPS API." });
    }
  }, []);

  useEffect(() => {
    void isWolfNativeShell().then(setNativeApp);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await pull();
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pull]);

  const sendGpsNow = async () => {
    setPushBusy(true);
    setPushNote("");
    const result = await pushPhoneGpsToWolf();
    setPushBusy(false);
    if (!result.ok) {
      setPushNote(result.error);
      return;
    }
    setPushNote("Sent — updating overlay…");
    await pull();
    window.setTimeout(() => setPushNote(""), 2500);
  };

  const label = state.kind === "fix" ? formatPhoneFix(state.fix) : null;

  let headline = "Waiting for GPSLogger";
  let subline: string | null = null;
  if (state.kind === "loading") headline = "Checking phone GPS…";
  else if (state.kind === "fix") headline = label!.position;
  else if (state.kind === "stale") {
    headline = "GPS stale";
    subline = nativeApp
      ? "GPSLogger may have stopped — tap Send GPS now or restart logging."
      : `Last fix ${state.ageSec}s ago — keep GPSLogger logging (Tools → Phone Link).`;
  } else if (state.kind === "error") {
    headline = state.message;
    subline = nativeApp ? "Tap Send GPS now while Brix is open." : "Use Tools → Phone Link on the phone.";
  } else {
    subline = nativeApp
      ? "Tap Send GPS now, or set GPSLogger from Phone Link for automatic updates."
      : "Set POST URL + body from Phone Link; start logging before Brix.";
  }

  const showSendButton =
    nativeApp || state.kind === "waiting" || state.kind === "stale" || state.kind === "error";

  return (
    <div className="absolute bottom-3 left-3 max-w-[90%] rounded-lg bg-black/75 px-3 py-2 text-white shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Phone</p>
      <p className="font-mono text-sm">{headline}</p>
      {label?.detail ? <p className="font-mono text-xs text-white/80">{label.detail}</p> : null}
      {subline && !label?.detail ? (
        <p className="mt-1 text-[11px] leading-snug text-white/65">{subline}</p>
      ) : null}
      {showSendButton ? (
        <button
          type="button"
          disabled={pushBusy}
          onClick={() => void sendGpsNow()}
          className="pointer-events-auto mt-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black disabled:opacity-60"
        >
          {pushBusy ? "Sending GPS…" : "Send GPS now"}
        </button>
      ) : null}
      {pushNote ? (
        <p className="pointer-events-none mt-1 text-[11px] text-teal-200" role="status">
          {pushNote}
        </p>
      ) : null}
    </div>
  );
}
