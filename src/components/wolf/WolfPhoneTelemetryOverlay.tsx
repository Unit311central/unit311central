"use client";

import { useEffect, useState } from "react";

import {
  WOLF_PHONE_TELEMETRY_PATH,
  formatPhoneFix,
  type PhoneFix,
} from "@/lib/wolf/phone-telemetry";

export default function WolfPhoneTelemetryOverlay() {
  const [fix, setFix] = useState<PhoneFix | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const response = await fetch(WOLF_PHONE_TELEMETRY_PATH, { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { fix?: PhoneFix | null };
        if (!cancelled) setFix(payload.fix ?? null);
      } catch {
        if (!cancelled) setFix(null);
      }
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const label = fix ? formatPhoneFix(fix) : null;

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 max-w-[80%] rounded-lg bg-black/70 px-3 py-2 text-white shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Phone</p>
      <p className="font-mono text-sm">{label?.position ?? "Waiting for GPSLogger"}</p>
      {label?.detail ? <p className="font-mono text-xs text-white/80">{label.detail}</p> : null}
    </div>
  );
}
