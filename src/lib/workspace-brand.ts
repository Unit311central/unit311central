/**
 * Platform-wide workspace branding (client-safe).
 *
 * Customer workspaces inherit display name / assistant identity / email chrome
 * from the active workspace. Unit311 platform branding is reserved for
 * Internal (unit311) and Demo hosts only.
 *
 * Server-only async resolution lives in `workspace-brand-server.ts`.
 */

import {
  CENTRAL_SITE_URL,
  customerWorkspaceOrigin,
  DEMO_WORKSPACE_SLUG,
} from "@/lib/app-domains";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isCorpCentreWorkspaceSlug } from "@/lib/corpcentre-financials";
import { CONTACT, SITE_NAME } from "@/lib/site";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

export type WorkspaceBrandKind =
  | "platform"
  | "corpcentre"
  | "talanton"
  | "abhi"
  | "customer";

export type WorkspaceBrand = {
  kind: WorkspaceBrandKind;
  slug: string | null;
  /** Organisation / workspace display name. */
  displayName: string;
  /** Short product mark for headers (often same as displayName). */
  productName: string;
  /** e.g. "OnwardAir Executive Assistant". */
  assistantName: string;
  logoUrl: string | null;
  supportEmail: string;
  emailFooterLabel: string;
  emailFooterUrl: string | null;
  siteOrigin: string;
  meetUrlBase: string;
  /** True when Unit311 / Internal / Demo platform chrome is allowed. */
  showPlatformBranding: boolean;
  reportTitle: (report: string) => string;
  pdfFootnote: string;
};

const PLATFORM_SUPPORT_EMAIL = CONTACT.infoEmail || CONTACT.email || "info@unit311central.com";

export function isPlatformWorkspaceSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return true;
  return (
    normalized === INTERNAL_WORKSPACE_SLUG ||
    normalized === "internal" ||
    normalized === DEMO_WORKSPACE_SLUG ||
    normalized === "demo"
  );
}

export function resolveBrandKindFromSlug(slug: string | null | undefined): WorkspaceBrandKind {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (isPlatformWorkspaceSlug(normalized)) return "platform";
  if (isCorpCentreWorkspaceSlug(normalized)) return "corpcentre";
  if (isTalantonImpactSlug(normalized)) return "talanton";
  if (isAbhiSlug(normalized)) return "abhi";
  return "customer";
}

function titleCaseSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function namedTenantDisplayName(kind: WorkspaceBrandKind, workspaceName?: string | null): string {
  if (kind === "corpcentre") return "Corp.Centre";
  if (kind === "talanton") return "Talanton Impact";
  if (kind === "abhi") return "ABHI";
  if (kind === "platform") return "Unit311 Central";
  const trimmed = workspaceName?.trim();
  return trimmed || "Workspace";
}

export function buildWorkspaceBrand(input: {
  slug?: string | null;
  name?: string | null;
  logoUrl?: string | null;
  supportEmail?: string | null;
}): WorkspaceBrand {
  const slug = String(input.slug ?? "")
    .trim()
    .toLowerCase() || null;
  const kind = resolveBrandKindFromSlug(slug);
  const showPlatformBranding = kind === "platform";

  let displayName = namedTenantDisplayName(kind, input.name);
  if (kind === "customer") {
    displayName = input.name?.trim() || (slug ? titleCaseSlug(slug) : "Workspace");
  } else if (kind === "platform") {
    displayName = "Unit311 Central";
  }

  const productName =
    kind === "platform" ? SITE_NAME || "Unit311" : displayName;

  const siteOrigin =
    kind === "platform" || !slug
      ? CENTRAL_SITE_URL
      : customerWorkspaceOrigin(slug) || CENTRAL_SITE_URL;

  const supportEmail =
    input.supportEmail?.trim() || PLATFORM_SUPPORT_EMAIL;

  const emailFooterLabel = displayName;
  const emailFooterUrl = showPlatformBranding ? CENTRAL_SITE_URL : siteOrigin;

  return {
    kind,
    slug,
    displayName,
    productName,
    assistantName: `${displayName} Executive Assistant`,
    logoUrl: input.logoUrl?.trim() || null,
    supportEmail,
    emailFooterLabel,
    emailFooterUrl,
    siteOrigin,
    // Meet rooms stay on the shared apex host; branding copy is workspace-neutral.
    meetUrlBase: `${CENTRAL_SITE_URL}/meet/video`,
    showPlatformBranding,
    reportTitle: (report: string) => `${displayName} — ${report}`,
    pdfFootnote: `Figures sourced from live ${displayName} workspace data. Empty sections mean no records — not estimates.`,
  };
}

export function platformWorkspaceBrand(): WorkspaceBrand {
  return buildWorkspaceBrand({ slug: INTERNAL_WORKSPACE_SLUG, name: "Unit311 Central" });
}

/** Sync helper for client / string templating when only slug+name are known. */
export function brandFromWorkspaceClaim(input: {
  slug?: string | null;
  name?: string | null;
}): WorkspaceBrand {
  return buildWorkspaceBrand(input);
}

/**
 * Browser-side display name for PDF/export chrome.
 * Uses whoami cache, then customer subdomain, then platform default.
 */
export function resolveBrowserWorkspaceDisplayName(): string {
  if (typeof window === "undefined") return "Unit311 Central";
  try {
    const cached = window.sessionStorage.getItem("unit311-whoami-workspace-name")?.trim();
    if (cached) return cached;
  } catch {
    /* ignore */
  }
  const host = window.location.hostname.toLowerCase();
  if (
    host === "internal.unit311central.com" ||
    host === "demo.unit311central.com" ||
    host === "unit311central.com" ||
    host === "www.unit311central.com" ||
    host === "localhost" ||
    host === "internal.localhost" ||
    host === "demo.localhost"
  ) {
    return "Unit311 Central";
  }
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1] && match[1] !== "www" && match[1] !== "app" && match[1] !== "login") {
    const kind = resolveBrandKindFromSlug(match[1]);
    if (kind === "corpcentre") return "Corp.Centre";
    if (kind === "talanton") return "Talanton Impact";
    if (kind === "abhi") return "ABHI";
    return titleCaseSlug(match[1]);
  }
  if (host.endsWith(".localhost") && host !== "localhost") {
    const slug = host.split(".")[0] || "";
    return slug ? titleCaseSlug(slug) : "Workspace";
  }
  return "Unit311 Central";
}

export function resolveBrowserWorkspaceBrand(): WorkspaceBrand {
  if (typeof window === "undefined") return platformWorkspaceBrand();
  const host = window.location.hostname.toLowerCase();
  let slug: string | null = null;
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1] && !["www", "app", "login"].includes(match[1])) slug = match[1];
  else if (host.endsWith(".localhost") && host !== "localhost") slug = host.split(".")[0] || null;
  else if (host === "internal.unit311central.com" || host === "internal.localhost") {
    slug = INTERNAL_WORKSPACE_SLUG;
  } else if (host === "demo.unit311central.com" || host === "demo.localhost") {
    slug = DEMO_WORKSPACE_SLUG;
  }
  return buildWorkspaceBrand({
    slug,
    name: resolveBrowserWorkspaceDisplayName(),
  });
}

export function brandEmailLogoHtml(brand: WorkspaceBrand): string {
  if (brand.showPlatformBranding) {
    return `
    <div style="margin-bottom:24px;">
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;color:#0b2d63;letter-spacing:-0.03em;">
        Unit<span style="color:#2563eb;">311</span>
      </span>
      <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748b;letter-spacing:0.12em;text-transform:uppercase;">
        Unit311 Central
      </div>
    </div>
  `;
  }

  return `
    <div style="margin-bottom:24px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;color:#0b2d63;letter-spacing:-0.02em;">
        ${escapeHtml(brand.displayName)}
      </div>
      <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;">
        Workspace
      </div>
    </div>
  `;
}

export function brandEmailFooterHtml(brand: WorkspaceBrand): string {
  const label = escapeHtml(brand.emailFooterLabel);
  if (brand.emailFooterUrl) {
    const href = escapeHtml(brand.emailFooterUrl);
    const host = escapeHtml(brand.emailFooterUrl.replace(/^https?:\/\//, ""));
    return `${label} · <a href="${href}" style="color:#2563eb;text-decoration:none;">${host}</a>`;
  }
  return label;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
