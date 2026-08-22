import { RESERVED_UNIT311_SUBDOMAINS, UNIT311_SITE_HOST } from "@/lib/app-domains";

export type WorkspaceHostnameInput = {
  workspaceName?: string | null;
  workspaceSlug?: string | null;
};

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
 * Derive a compact customer hostname from any workspace label (name or slug).
 * Strips all non-alphanumeric characters so multi-word names and hyphenated slugs
 * follow the same rule (e.g. "Acme Manufacturing Ltd" and "acme-manufacturing-ltd"
 * both yield "acmemanufacturingltd").
 */
export function deriveCustomerHostnameFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 64);
}

/**
 * Default customer hostname when the wizard does not supply an override.
 * Prefers workspace display name, then canonical slug.
 */
export function deriveDefaultCustomerHostname(
  input: WorkspaceHostnameInput | string,
): string {
  if (typeof input === "string") {
    return deriveCustomerHostnameFromLabel(input);
  }
  const workspaceName = input.workspaceName?.trim() ?? "";
  const workspaceSlug = input.workspaceSlug?.trim() ?? "";
  if (workspaceName) return deriveCustomerHostnameFromLabel(workspaceName);
  if (workspaceSlug) return deriveCustomerHostnameFromLabel(workspaceSlug);
  return "";
}

export function resolveCustomerHostname(
  workspaceSlug: string,
  override?: string | null,
  workspaceName?: string | null,
): string {
  const normalizedOverride = normalizeCustomerHostname(override ?? "");
  if (normalizedOverride) return normalizedOverride;
  return deriveDefaultCustomerHostname({
    workspaceName: workspaceName,
    workspaceSlug,
  });
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
  workspaceName?: string | null,
): string {
  return workspacePrimaryUrlForHostname(
    resolveCustomerHostname(workspaceSlug, customerHostname, workspaceName),
  );
}
