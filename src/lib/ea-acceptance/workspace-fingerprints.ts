/**
 * Workspace-specific evidence fingerprints for authenticated validation.
 * Ensures answers reflect the requested workspace — not demo fixture bleed.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import { ABHI_CASH_BALANCE_GBP } from "@/lib/abhi-financials";
import { ONWARDAIR_CASH_BALANCE_USD } from "@/lib/onwardair-financials";
import { TALANTON_CASH_BALANCE_USD } from "@/lib/talanton-financials";

export type WorkspaceFingerprint = {
  slug: string;
  /** Patterns that must NOT appear when this workspace is active */
  forbiddenPatterns: RegExp[];
  /** At least one must match when cash/finance evidence is present */
  allowedCashMarkers?: RegExp[];
};

export const WORKSPACE_FINGERPRINTS: WorkspaceFingerprint[] = [
  {
    slug: DEMO_WORKSPACE_SLUG,
    forbiddenPatterns: [/\$4,?250,?000/, /\$1,?000,?000/],
    allowedCashMarkers: [/1[, ]?580[, ]?000/, /1[, ]?786[, ]?600/, /£/],
  },
  {
    slug: ONWARDAIR_SLUG,
    forbiddenPatterns: [/1[, ]?786[, ]?600/],
    allowedCashMarkers: [
      new RegExp(String(ONWARDAIR_CASH_BALANCE_USD).replace(/\B(?=(\d{3})+(?!\d))/g, "[, ]?")),
      /\$1[, ]?000[, ]?000/,
    ],
  },
  {
    slug: TALANTON_IMPACT_SLUG,
    forbiddenPatterns: [/1[, ]?786[, ]?600/, /£1[, ]?000[, ]?000/],
    allowedCashMarkers: [
      new RegExp(String(TALANTON_CASH_BALANCE_USD).replace(/\B(?=(\d{3})+(?!\d))/g, "[, ]?")),
      /\$4[, ]?250[, ]?000/,
    ],
  },
  {
    slug: ABHI_SLUG,
    forbiddenPatterns: [/1[, ]?786[, ]?600/, /\$1,?000,?000/, /\$4,?250,?000/],
    allowedCashMarkers: [
      new RegExp(String(ABHI_CASH_BALANCE_GBP).replace(/\B(?=(\d{3})+(?!\d))/g, "[, ]?")),
      /£1[, ]?000[, ]?000/,
    ],
  },
];

export function normalizeWorkspaceSlug(slug?: string | null): string {
  const normalized = String(slug ?? DEMO_WORKSPACE_SLUG).trim().toLowerCase();
  if (normalized.includes("onwardair") || normalized === "onward") return ONWARDAIR_SLUG;
  if (normalized.includes("talanton")) return TALANTON_IMPACT_SLUG;
  if (normalized === "abhi") return ABHI_SLUG;
  if (normalized === "demo") return DEMO_WORKSPACE_SLUG;
  return normalized;
}

export function validateWorkspaceFingerprint(
  workspaceSlug: string | undefined,
  text: string,
  options: { requiresCashEvidence?: boolean } = {},
): { ok: boolean; reason: string } {
  const slug = normalizeWorkspaceSlug(workspaceSlug);
  const fingerprint = WORKSPACE_FINGERPRINTS.find((row) => row.slug === slug);
  if (!fingerprint) return { ok: true, reason: "no fingerprint configured" };

  for (const forbidden of fingerprint.forbiddenPatterns) {
    if (forbidden.test(text)) {
      return {
        ok: false,
        reason: `response contains foreign workspace marker ${forbidden} for ${slug}`,
      };
    }
  }

  if (options.requiresCashEvidence && fingerprint.allowedCashMarkers?.length) {
    const matched = fingerprint.allowedCashMarkers.some((pattern) => pattern.test(text));
    if (!matched && /\b(cash|bank|balance|£|\$)\b/i.test(text)) {
      return { ok: false, reason: `cash evidence does not match workspace fingerprint for ${slug}` };
    }
  }

  return { ok: true, reason: `workspace fingerprint ok for ${slug}` };
}
