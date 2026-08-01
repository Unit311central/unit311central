import {
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
 * Public marketing is excluded; ops + customer workspace hosts are included.
 * Workspace tags are intentionally not applied in this phase.
 */
export function shouldInitClarityOnHost(host: string | null | undefined): boolean {
  if (!getClarityProjectId()) return false;
  if (!host) return false;
  if (isPublicSiteHost(host)) return false;

  if (isInternalDomainHost(host) || isDemoDomainHost(host)) return true;
  if (parseClientPlatformSubdomainSafe(host)) return true;

  // Local / preview hosts with an ops shell still benefit from Clarity when configured.
  const normalized = host.trim().toLowerCase().split(":")[0] ?? "";
  if (normalized === "localhost" || normalized.endsWith(".localhost")) return true;

  return false;
}
