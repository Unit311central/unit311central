"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { isPublicSiteHost } from "@/lib/app-domains";

function postEvent(payload: {
  eventType: string;
  path: string;
  label?: string;
  meta?: Record<string, unknown>;
}) {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/website-analytics/events", blob)) return;
    }
  } catch {
    // fall through
  }
  void fetch("/api/website-analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Public marketing site page-view + delegated CTA click tracking.
 */
export default function MarketingAnalyticsBeacon() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPublicSiteHost(window.location.hostname) && !window.location.hostname.includes("localhost")) {
      return;
    }

    const path = pathname || window.location.pathname || "/";
    if (lastPath.current !== path) {
      lastPath.current = path;
      postEvent({ eventType: "page_view", path });
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const cta = target.closest<HTMLElement>(
        "[data-analytics-cta], a[href='/contact'], a[href='/book'], a[href*='contact'], a[href*='book']",
      );
      if (!cta) return;
      const label =
        cta.getAttribute("data-analytics-cta") ||
        cta.getAttribute("href") ||
        cta.textContent?.trim()?.slice(0, 80) ||
        "cta";
      postEvent({
        eventType: "cta_click",
        path,
        label,
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
