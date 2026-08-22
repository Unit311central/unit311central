import { RESERVED_UNIT311_SUBDOMAINS, UNIT311_SITE_HOST } from "@/lib/app-domains";

/** Normalize a customer-facing hostname label (subdomain part only). */
export function normalizeCustomerHostname(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/**
 * Default customer hostname when the wizard does not supply one.
 * Hyphens are removed so `interface-worx` → `interfaceworx`.
 */
export function deriveDefaultCustomerHostname(workspaceSlug: string): string {
  const slug = workspaceSlug.trim().toLowerCase();
  if (!slug) return "";
  return slug.replace(/-/g, "");
}

export function resolveCustomerHostname(
  workspaceSlug: string,
  override?: string | null,
): string {
  const normalizedOverride = normalizeCustomerHostname(override ?? "");
  if (normalizedOverride) return normalizedOverride;
  return deriveDefaultCustomerHostname(workspaceSlug);
}

export function isValidCustomerHostname(hostname: string): boolean {
  const normalized = normalizeCustomerHostname(hostname);
  if (!normalized) return false;
  if (RESERVED_UNIT311_SUBDOMAINS.has(normalized)) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(normalized);
}

export function workspacePrimaryUrlForHostname(customerHostname: string): string {
  const host = normalizeCustomerHostname(customerHostname);
  return `https://${host}.${UNIT311_SITE_HOST}`;
}

export function workspacePrimaryUrlForWorkspace(
  workspaceSlug: string,
  customerHostname?: string | null,
): string {
  return workspacePrimaryUrlForHostname(resolveCustomerHostname(workspaceSlug, customerHostname));
}

/** Known slug → default hostname pairs used in tests and documentation. */
export const WORKSPACE_HOSTNAME_EXAMPLES = {
  "interface-worx": "interfaceworx",
} as const;
