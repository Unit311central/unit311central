import "server-only";

import { headers } from "next/headers";

import { DEMO_WORKSPACE_SLUG, getRequestHost, isDemoDomainHost } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";

function refererLooksLikeDemo(referer: string | null): boolean {
  if (!referer) return false;
  const lower = referer.toLowerCase();
  return lower.includes("demo.unit311central.com") || lower.includes("demo.localhost");
}

/** True when the active request is on the Demo host (or middleware demo flag). */
export async function isDemoApiRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  if (requestHeaders.get("x-unit311-demo") === "1") return true;
  const slug = requestHeaders.get("x-unit311-workspace-slug")?.trim().toLowerCase();
  if (slug === DEMO_WORKSPACE_SLUG) return true;
  if (isDemoDomainHost(getRequestHost({ headers: requestHeaders }))) return true;
  if (refererLooksLikeDemo(requestHeaders.get("referer"))) return true;
  return false;
}

/** Session when present — Demo fixture GET routes do not require this. */
export async function getDemoApiSession() {
  if (!(await isDemoApiRequest())) return null;
  return getPlatformSession();
}
