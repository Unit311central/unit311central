/**
 * ABHI financial fixtures — canonical GBP figures for home / financials.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";

/** Canonical cash at bank (GBP). */
export const ABHI_CASH_BALANCE_GBP = 4_242_957;

/** Canonical calendar YTD revenue (GBP). */
export const ABHI_REVENUE_YTD_GBP = 2_000_000;

export function isAbhiWorkspaceSlug(slug: string | null | undefined): boolean {
  return isAbhiSlug(slug);
}
