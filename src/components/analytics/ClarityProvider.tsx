"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

import { isPublicSiteHost } from "@/lib/app-domains";
import {
  buildClaritySessionTags,
  getClarityProjectId,
  shouldInitClarityOnHost,
  type ClarityWhoamiTagSource,
} from "@/lib/clarity";

let clarityInitialised = false;
let clarityTagsAppliedKey: string | null = null;

function applyClaritySessionTags(host: string, whoami?: ClarityWhoamiTagSource | null) {
  const tags = buildClaritySessionTags(host, whoami);
  const key = `${tags.workspace}|${tags.workspace_id}|${tags.tenant_slug}|${tags.user_role}`;
  if (clarityTagsAppliedKey === key) return;

  Clarity.setTag("workspace", tags.workspace);
  Clarity.setTag("workspace_id", tags.workspace_id);
  Clarity.setTag("tenant_slug", tags.tenant_slug);
  Clarity.setTag("user_role", tags.user_role);
  clarityTagsAppliedKey = key;
}

/**
 * Initialises Microsoft Clarity once per browser session and applies
 * workspace / role custom tags for filtering.
 */
export default function ClarityProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname;
    const projectId = getClarityProjectId();
    if (!projectId) return;
    if (!shouldInitClarityOnHost(host)) return;

    if (!clarityInitialised) {
      try {
        Clarity.init(projectId);
        clarityInitialised = true;
      } catch (error) {
        console.warn("[clarity] init failed", error);
        return;
      }
    }

    applyClaritySessionTags(host);

    // Marketing visitors are anonymous — skip whoami.
    if (isPublicSiteHost(host)) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/auth/whoami", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as ClarityWhoamiTagSource;
        if (cancelled) return;
        applyClaritySessionTags(host, data);
      } catch {
        // Keep host-only tags if profile lookup fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
