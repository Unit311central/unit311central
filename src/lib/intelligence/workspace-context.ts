import {
  isDemoDomainHost,
  isInternalDomainHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import { demoWorkspaceSlug } from "@/lib/runtime-surface";
import { canonicalizeSaecWorkspaceSlug } from "@/lib/saec-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import {
  getIntelligencePackById,
  getIntelligencePackBySlug,
  getRegisteredIntelligencePackBySlug,
} from "@/lib/intelligence/registry";
import type { IntelligenceHostSurface } from "@/lib/intelligence/types";

/**
 * Canonical workspace slug for a Unit311 host (matches workspace-context tenancy).
 * Uses central app-domains helpers — not intelligence-specific branches.
 */
function canonicalizeIntelligenceWorkspaceSlug(
  slug: string | null | undefined,
): string | null {
  const normalized = String(slug ?? "").trim().toLowerCase();
  if (!normalized) return null;
  return canonicalizeSaecWorkspaceSlug(normalized) ?? normalized;
}

export function resolveWorkspaceSlugFromHost(host: string | null | undefined): string | null {
  const customerSlug = parseClientPlatformSubdomainSafe(host);
  if (customerSlug) return canonicalizeIntelligenceWorkspaceSlug(customerSlug);
  if (isDemoDomainHost(host)) return demoWorkspaceSlug();
  if (isInternalDomainHost(host)) return INTERNAL_WORKSPACE_SLUG;

  if (host) {
    const normalized = host.split(":")[0].trim().toLowerCase();
    if (normalized.endsWith(".localhost")) {
      const sub = normalized.slice(0, -".localhost".length);
      if (sub && !sub.includes(".")) return canonicalizeIntelligenceWorkspaceSlug(sub);
    }
  }

  return null;
}

/** Intelligence pack slug when the workspace has a registered pack; otherwise null. */
export function resolveIntelligencePackSlugForWorkspace(
  workspaceSlug: string | null | undefined,
): string | null {
  const normalized = String(workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  if (!normalized || normalized === INTERNAL_WORKSPACE_SLUG) return null;

  const canonicalSlug = canonicalizeIntelligenceWorkspaceSlug(normalized);
  if (!canonicalSlug) return null;

  const specific = getRegisteredIntelligencePackBySlug(canonicalSlug);
  if (specific) return specific.slug;

  // Unknown customer workspaces resolve to the generic customer pack at runtime.
  return getIntelligencePackById("customer-intelligence")?.slug ?? null;
}

export function resolveIntelligenceWorkspaceSlugFromHost(
  host: string | null | undefined,
): string | null {
  return resolveIntelligencePackSlugForWorkspace(resolveWorkspaceSlugFromHost(host));
}

/** Resolve intelligence workspace slug from browser host via the central registry. */
export function resolveIntelligenceWorkspaceSlugFromBrowser(): string | null {
  if (typeof window === "undefined") return null;
  return resolveIntelligenceWorkspaceSlugFromHost(window.location.hostname);
}

/** Host surface for access policy — declared on each intelligence pack. */
export function resolveIntelligenceHostSurface(
  workspaceSlug: string | null | undefined,
): IntelligenceHostSurface {
  const pack = getIntelligencePackBySlug(workspaceSlug);
  return pack?.hostSurface ?? "internal";
}
