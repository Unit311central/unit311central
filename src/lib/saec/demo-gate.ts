/**
 * SAEC workspace demo fixture gate — use for client-side mock stores and overlays.
 */

import { isBrowserSaecSurface, isSaecSlug, SAEC_SLUG } from "@/lib/saec-surface";

export function isSaecDemoFixtures(slug?: string | null): boolean {
  if (isSaecSlug(slug)) return true;
  return isBrowserSaecSurface();
}

export function isBrowserSaecDemoFixtures(): boolean {
  return isBrowserSaecSurface();
}

export const SAEC_DEMO_WORKSPACE_SLUG = SAEC_SLUG;
