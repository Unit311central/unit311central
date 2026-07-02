"use client";

import { useEffect } from "react";

const POLL_INTERVAL_MS = 30_000;

/** Poll info@ for new emails and trigger WhatsApp alerts while the internal dashboard is open. */
export function useInfoEmailWhatsAppPoller(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function check() {
      try {
        await fetch("/api/email/notifications/check", { cache: "no-store" });
      } catch {
        // background polling — ignore transient network errors
      }
    }

    void check();
    const timer = window.setInterval(() => {
      if (!cancelled) void check();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled]);
}
