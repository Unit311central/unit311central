import { DEMO_WORKSPACE_SLUG, isDemoDomainHost } from "@/lib/app-domains";

export { DEMO_WORKSPACE_SLUG };

/** Cookie + request header for Demo admin workspace preview (stays on demo host). */
export const DEMO_PREVIEW_COOKIE = "unit311_demo_preview_slug";
export const DEMO_PREVIEW_HEADER = "x-unit311-demo-preview-slug";

export const DEMO_PREVIEW_WORKSPACES = [
  { slug: DEMO_WORKSPACE_SLUG, label: "Demo" },
  { slug: "onwardair", label: "OnwardAir" },
  { slug: "talantonimpact", label: "Talanton Impact" },
  { slug: "abhi", label: "ABHI" },
] as const;

export type DemoPreviewWorkspaceSlug = (typeof DEMO_PREVIEW_WORKSPACES)[number]["slug"];

const ALLOWED_PREVIEW_SLUGS = new Set<string>(
  DEMO_PREVIEW_WORKSPACES.map((workspace) => workspace.slug),
);

export function normalizeDemoPreviewSlug(
  raw: string | null | undefined,
): DemoPreviewWorkspaceSlug | null {
  const normalized = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (normalized === "talanton") return "talantonimpact";
  if (!ALLOWED_PREVIEW_SLUGS.has(normalized)) return null;
  return normalized as DemoPreviewWorkspaceSlug;
}

export function isOnDemoHostBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return isDemoDomainHost(window.location.hostname);
}

function readPreviewSlugFromDocumentCookie(): DemoPreviewWorkspaceSlug | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${DEMO_PREVIEW_COOKIE}=([^;]*)`),
  );
  if (!match?.[1]) return null;
  try {
    return normalizeDemoPreviewSlug(decodeURIComponent(match[1]));
  } catch {
    return normalizeDemoPreviewSlug(match[1]);
  }
}

/** Effective tenant slug while browsing on the Demo host (admin preview or Demo). */
export function readBrowserDemoPreviewSlug(): DemoPreviewWorkspaceSlug {
  if (!isOnDemoHostBrowser()) return DEMO_WORKSPACE_SLUG;
  return readPreviewSlugFromDocumentCookie() ?? DEMO_WORKSPACE_SLUG;
}

export function isBrowserDemoPreviewActive(): boolean {
  return isOnDemoHostBrowser() && readBrowserDemoPreviewSlug() !== DEMO_WORKSPACE_SLUG;
}

export function demoPreviewWorkspaceLabel(slug: DemoPreviewWorkspaceSlug): string {
  return (
    DEMO_PREVIEW_WORKSPACES.find((workspace) => workspace.slug === slug)?.label ?? slug
  );
}
