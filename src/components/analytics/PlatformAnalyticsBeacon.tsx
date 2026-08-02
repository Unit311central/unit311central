"use client";

import { useEffect, useRef } from "react";

import { resolveTaxonomyForView } from "@/lib/platform-analytics/taxonomy";
import { shouldInitClarityOnHost } from "@/lib/clarity";

/**
 * Silent first-party usage beacon for ops hosts (Internal + customers).
 * Does not render UI. Does not run on public marketing hosts.
 */
export default function PlatformAnalyticsBeacon({
  pageKey,
}: {
  pageKey: string | null | undefined;
}) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pageKey) return;
    if (!shouldInitClarityOnHost(window.location.hostname)) return;
    if (lastKey.current === pageKey) return;
    lastKey.current = pageKey;

    const tax = resolveTaxonomyForView(pageKey);
    const payload = {
      pageKey,
      moduleKey: tax?.moduleKey,
      source: "nav" as const,
    };

    const body = JSON.stringify(payload);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        const ok = navigator.sendBeacon("/api/platform-analytics/events", blob);
        if (ok) return;
      }
    } catch {
      // fall through to fetch
    }

    void fetch("/api/platform-analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Fire-and-forget
    });
  }, [pageKey]);

  return null;
}
