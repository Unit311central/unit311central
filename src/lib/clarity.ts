import {
  DEMO_WORKSPACE_SLUG,
  isDemoDomainHost,
  isInternalDomainHost,
  isPublicSiteHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";

export function getClarityProjectId(): string {
  return process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() ?? "";
}

export function getClarityDashboardUrl(): string {
  return process.env.NEXT_PUBLIC_CLARITY_DASHBOARD_URL?.trim() ?? "";
}

/** Absolute http(s) URLs open in a new tab from the ops sidebars. */
export function isAbsoluteHttpUrl(href: string | null | undefined): boolean {
  if (!href) return false;
  return /^https?:\/\//i.test(href);
}

/**
 * Whether Clarity should initialise on this host.
 * Includes public marketing (unit311central.com) plus ops / customer workspace hosts.
 */
export function shouldInitClarityOnHost(host: string | null | undefined): boolean {
  if (!getClarityProjectId()) return false;
  if (!host) return false;

  if (isPublicSiteHost(host)) return true;
  if (isInternalDomainHost(host) || isDemoDomainHost(host)) return true;
  if (parseClientPlatformSubdomainSafe(host)) return true;

  const normalized = host.trim().toLowerCase().split(":")[0] ?? "";
  if (normalized === "localhost" || normalized.endsWith(".localhost")) return true;

  return false;
}

/**
 * Host-facing workspace key for Clarity filters.
 * Public marketing → "website". Ops/customer → surface slug.
 */
export function resolveClarityWorkspaceKey(host: string | null | undefined): string {
  if (!host) return "unknown";
  if (isPublicSiteHost(host)) return "website";
  if (isInternalDomainHost(host)) return "internal";
  if (isDemoDomainHost(host)) return DEMO_WORKSPACE_SLUG;

  const customerSlug = parseClientPlatformSubdomainSafe(host);
  if (customerSlug) return customerSlug;

  const normalized = host.trim().toLowerCase().split(":")[0] ?? "";
  if (normalized === "localhost" || normalized === "internal.localhost") return "internal";
  if (normalized === "demo.localhost") return DEMO_WORKSPACE_SLUG;

  return "unknown";
}

export type ClaritySessionTags = {
  workspace: string;
  workspace_id: string;
  tenant_slug: string;
  user_role: string;
};

export type ClarityWhoamiTagSource = {
  workspaceId?: string | null;
  workspaceSlug?: string | null;
  role?: string | null;
  userType?: string | null;
};

/** Build the four Clarity custom tags for the current session. */
export function buildClaritySessionTags(
  host: string | null | undefined,
  whoami?: ClarityWhoamiTagSource | null,
): ClaritySessionTags {
  const workspace = resolveClarityWorkspaceKey(host);
  if (workspace === "website") {
    return {
      workspace: "website",
      workspace_id: "marketing",
      tenant_slug: "website",
      user_role: "visitor",
    };
  }

  const tenantSlug = workspace !== "unknown" ? workspace : whoami?.workspaceSlug?.trim() || "unknown";
  const workspaceId = whoami?.workspaceId?.trim() || "unknown";
  const userRole =
    whoami?.role?.trim() || whoami?.userType?.trim() || "anonymous";

  return {
    workspace,
    workspace_id: workspaceId,
    tenant_slug: tenantSlug,
    user_role: userRole,
  };
}
