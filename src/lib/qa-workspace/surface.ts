import {
  QA_ENABLED_WORKSPACE_SLUGS,
  TEST_WORKSPACE_SLUG,
} from "@/lib/qa-workspace/constants";

export function isQaEnabledWorkspaceSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "").trim().toLowerCase();
  return (QA_ENABLED_WORKSPACE_SLUGS as readonly string[]).includes(normalized);
}

/** @deprecated Prefer isQaEnabledWorkspaceSlug — kept for existing call sites. */
export function isTestWorkspaceSlug(slug: string | null | undefined): boolean {
  return isQaEnabledWorkspaceSlug(slug);
}

/** Client-side QA workspace host detection (UI gating only — APIs enforce server-side). */
export function isBrowserTestWorkspaceSurface(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.trim().toLowerCase();
  if (host === "test.unit311central.com") return true;
  if (host === "test.localhost") return true;
  if (host === "interfaceworx.unit311central.com") return true;
  if (host === "interfaceworx.localhost") return true;
  return false;
}
