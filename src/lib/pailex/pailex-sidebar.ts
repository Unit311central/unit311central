/**
 * PAILEX sidebar behaviour — customer host only.
 */

import { isBrowserPailexSurface, isPailexSlug } from "@/lib/pailex/pailex-surface";

/** Tighter vertical rhythm for long operational nav trees. */
export const PAILEX_SIDEBAR_SECTION_GAP_PX = 5;

export function isPailexNavWorkspace(slug: string | null | undefined): boolean {
  return isPailexSlug(slug);
}

export function isPailexNavSurface(): boolean {
  return isBrowserPailexSurface();
}
