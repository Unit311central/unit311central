import { SAEC_SLUG } from "@/lib/saec-surface";

import { FUNDRAISING_MODULE_LABEL } from "@/lib/fundraising/fundraising-taxonomy";

/** Workspace-specific LHS labels for the Fundraising Core Module. */
export const FUNDRAISING_WORKSPACE_NAV_LABELS: Readonly<Record<string, string>> = {
  [SAEC_SLUG]: "CORPORATE SHAREHOLDING",
};

export function resolveFundraisingNavLabel(workspaceSlug?: string | null): string {
  const slug = String(workspaceSlug ?? "").trim().toLowerCase();
  if (!slug) return FUNDRAISING_MODULE_LABEL;
  return FUNDRAISING_WORKSPACE_NAV_LABELS[slug] ?? FUNDRAISING_MODULE_LABEL;
}
