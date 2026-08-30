import { INTERFACE_WORX_QA_SLUG, TEST_WORKSPACE_SLUG } from "@/lib/qa-workspace/constants";

export function isTestWorkspaceSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === TEST_WORKSPACE_SLUG;
}

export function isInterfaceWorxQaSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === INTERFACE_WORX_QA_SLUG;
}

/** Workspaces that expose QA capture APIs and Tools → QA Tasks nav injection. */
export function isQaEnabledWorkspaceSlug(slug: string | null | undefined): boolean {
  return isTestWorkspaceSlug(slug) || isInterfaceWorxQaSlug(slug);
}

/** InterfaceWorx beta feedback UX (simple report form, not element-click QA). */
export function isQaBetaWorkspaceSlug(slug: string | null | undefined): boolean {
  return isInterfaceWorxQaSlug(slug);
}

/** Client-side Test workspace host detection (UI gating only — APIs enforce server-side). */
export function isBrowserTestWorkspaceSurface(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.trim().toLowerCase();
  if (host === "test.unit311central.com") return true;
  if (host === "test.localhost") return true;
  return false;
}

/** Client-side InterfaceWorx host detection (UI gating only — APIs enforce server-side). */
export function isBrowserInterfaceWorxQaSurface(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.trim().toLowerCase();
  if (host === "interfaceworx.unit311central.com") return true;
  if (host === "interfaceworx.localhost") return true;
  return false;
}
