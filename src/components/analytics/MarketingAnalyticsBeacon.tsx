"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { isPublicSiteHost } from "@/lib/app-domains";
import {
  classifyTrafficSource,
  normalizeDeviceBucket,
} from "@/lib/website-analytics/traffic-source";

function storageGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore private-mode / blocked storage.
  }
}

function getOrCreateId(storage: Storage, key: string): string {
  const existing = storageGet(storage, key);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  storageSet(storage, key, id);
  return id;
}

function detectRawDevice(): string {
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) return "Mobile";
  return "Desktop";
}

function resolveSessionTrafficSource(): string {
  const cached = storageGet(window.sessionStorage, "wa_traffic_source");
  if (cached) return cached;

  const source = classifyTrafficSource({
    referrer: document.referrer || "",
    search: window.location.search || "",
    landingHost: window.location.hostname,
  });
  storageSet(window.sessionStorage, "wa_traffic_source", source);
  storageSet(window.sessionStorage, "wa_landing_path", window.location.pathname || "/");
  return source;
}

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
 * Public marketing site page-view + CTA tracking for Website Analytics.
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
    const visitorId = getOrCreateId(window.localStorage, "wa_vid");
    const sessionId = getOrCreateId(window.sessionStorage, "wa_sid");
    const device = normalizeDeviceBucket(detectRawDevice());
    const trafficSource = resolveSessionTrafficSource();
    const baseMeta = {
      visitorId,
      sessionId,
      device,
      trafficSource,
      referrer: document.referrer || null,
      landingPath: storageGet(window.sessionStorage, "wa_landing_path"),
    };

    if (lastPath.current !== path) {
      lastPath.current = path;
      postEvent({ eventType: "page_view", path, meta: baseMeta });
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
        meta: baseMeta,
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
