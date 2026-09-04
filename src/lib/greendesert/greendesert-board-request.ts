import "server-only";

import { headers } from "next/headers";

import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { GREENDESERT_SLUG, isGreenDesertHost } from "@/lib/greendesert-surface";

function refererLooksLikeGreenDesert(referer: string | null): boolean {
  if (!referer) return false;
  const lower = referer.toLowerCase();
  return lower.includes("greendesert.unit311central.com") || lower.includes("greendesert.localhost");
}

/** True when the active request is on the Green Desert workspace host. */
export async function isGreenDesertApiRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  const slug = requestHeaders.get("x-unit311-workspace-slug")?.trim().toLowerCase();
  if (slug === GREENDESERT_SLUG) return true;
  const host = getRequestHost({ headers: requestHeaders });
  if (isGreenDesertHost(host)) return true;
  const parsedSlug = parseClientPlatformSubdomainSafe(host);
  if (parsedSlug === GREENDESERT_SLUG) return true;
  if (refererLooksLikeGreenDesert(requestHeaders.get("referer"))) return true;
  return false;
}
