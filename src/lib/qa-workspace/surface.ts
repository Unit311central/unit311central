import { TEST_WORKSPACE_SLUG } from "@/lib/qa-workspace/constants";

export function isTestWorkspaceSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === TEST_WORKSPACE_SLUG;
}

/** Client-side Test workspace host detection (UI gating only — APIs enforce server-side). */
export function isBrowserTestWorkspaceSurface(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.trim().toLowerCase();
  if (host === "test.unit311central.com") return true;
  if (host === "test.localhost") return true;
  return false;
}
