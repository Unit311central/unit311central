"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

import { getClarityProjectId, shouldInitClarityOnHost } from "@/lib/clarity";

let clarityInitialised = false;

/**
 * Initialises Microsoft Clarity once per browser session.
 * Workspace/surface tags are deferred to a later phase.
 */
export default function ClarityProvider() {
  useEffect(() => {
    if (clarityInitialised) return;
    if (typeof window === "undefined") return;

    const projectId = getClarityProjectId();
    if (!projectId) return;
    if (!shouldInitClarityOnHost(window.location.hostname)) return;

    try {
      Clarity.init(projectId);
      clarityInitialised = true;
    } catch (error) {
      console.warn("[clarity] init failed", error);
    }
  }, []);

  return null;
}
