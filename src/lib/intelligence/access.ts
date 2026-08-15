import type {
  IntelligenceAccessPolicy,
  IntelligenceDomainAccessPolicy,
  IntelligenceDomainDefinition,
  IntelligenceDomainId,
  IntelligenceHostSurface,
  IntelligenceWorkspacePack,
} from "@/lib/intelligence/types";

export type IntelligenceAccessDeniedReason =
  | "workspace_not_registered"
  | "domain_not_found"
  | "role_not_allowed"
  | "host_surface_not_allowed"
  | "external_denied"
  | "write_requires_admin";

export class IntelligenceAccessDeniedError extends Error {
  readonly code = "INTELLIGENCE_ACCESS_DENIED";

  constructor(
    message: string,
    readonly reason: IntelligenceAccessDeniedReason,
    readonly workspaceSlug: string,
    readonly domainId?: IntelligenceDomainId,
  ) {
    super(message);
    this.name = "IntelligenceAccessDeniedError";
  }
}

/** Caller context for intelligence access checks (server-side in later phases). */
export type IntelligenceAccessContext = {
  workspaceSlug: string;
  domainId: IntelligenceDomainId;
  roleView?: string | null;
  hostSurface?: IntelligenceHostSurface | null;
  isExternal?: boolean;
  isAdmin?: boolean;
  operation?: "read" | "write";
};

function normalizeSlug(slug: string | null | undefined): string {
  return String(slug ?? "")
    .trim()
    .toLowerCase();
}

function resolveDomainPolicy(
  pack: IntelligenceWorkspacePack,
  domainId: IntelligenceDomainId,
): IntelligenceDomainAccessPolicy | null {
  return pack.accessPolicy.domains?.[domainId] ?? null;
}

function resolveDomain(
  pack: IntelligenceWorkspacePack,
  domainId: IntelligenceDomainId,
): IntelligenceDomainDefinition | null {
  return pack.domains.find((d) => d.id === domainId) ?? null;
}

function allowedRoles(
  pack: IntelligenceWorkspacePack,
  domainPolicy: IntelligenceDomainAccessPolicy | null,
): readonly string[] | undefined {
  if (domainPolicy?.allowedRoleViews?.length) return domainPolicy.allowedRoleViews;
  return pack.accessPolicy.defaultAllowedRoleViews;
}

function allowedSurfaces(
  pack: IntelligenceWorkspacePack,
  domainPolicy: IntelligenceDomainAccessPolicy | null,
): readonly IntelligenceHostSurface[] | undefined {
  if (domainPolicy?.allowedHostSurfaces?.length) return domainPolicy.allowedHostSurfaces;
  return pack.accessPolicy.defaultAllowedHostSurfaces;
}

function deniesExternal(
  pack: IntelligenceWorkspacePack,
  domainPolicy: IntelligenceDomainAccessPolicy | null,
): boolean {
  if (domainPolicy?.denyExternal != null) return domainPolicy.denyExternal;
  return pack.accessPolicy.denyExternal ?? false;
}

function adminOnlyWrite(domainPolicy: IntelligenceDomainAccessPolicy | null): boolean {
  return domainPolicy?.adminOnlyWrite ?? false;
}

/**
 * Pure policy evaluation — returns false when access should be denied.
 */
export function canAccessIntelligenceDomain(
  pack: IntelligenceWorkspacePack | null,
  ctx: IntelligenceAccessContext,
): boolean {
  if (!pack) return false;

  const domain = resolveDomain(pack, ctx.domainId);
  if (!domain) return false;

  const domainPolicy = resolveDomainPolicy(pack, ctx.domainId);
  const operation = ctx.operation ?? "read";

  if (operation === "write" && adminOnlyWrite(domainPolicy) && !ctx.isAdmin) {
    return false;
  }

  if (deniesExternal(pack, domainPolicy) && ctx.isExternal) {
    return false;
  }

  const roles = allowedRoles(pack, domainPolicy);
  if (roles?.length) {
    const role = String(ctx.roleView ?? "").trim();
    if (!role || !roles.includes(role)) return false;
  }

  const surfaces = allowedSurfaces(pack, domainPolicy);
  if (surfaces?.length) {
    const surface = String(ctx.hostSurface ?? "").trim();
    if (!surface || !surfaces.includes(surface)) return false;
  }

  return true;
}

/**
 * Assert intelligence domain access. Throws {@link IntelligenceAccessDeniedError} when denied.
 */
export function requireIntelligenceAccess(
  pack: IntelligenceWorkspacePack | null,
  ctx: IntelligenceAccessContext,
): void {
  const slug = normalizeSlug(ctx.workspaceSlug);

  if (!pack || normalizeSlug(pack.slug) !== slug) {
    throw new IntelligenceAccessDeniedError(
      `No intelligence pack registered for workspace "${slug}".`,
      "workspace_not_registered",
      slug,
      ctx.domainId,
    );
  }

  const domain = resolveDomain(pack, ctx.domainId);
  if (!domain) {
    throw new IntelligenceAccessDeniedError(
      `Intelligence domain "${ctx.domainId}" is not registered for workspace "${slug}".`,
      "domain_not_found",
      slug,
      ctx.domainId,
    );
  }

  const domainPolicy = resolveDomainPolicy(pack, ctx.domainId);
  const operation = ctx.operation ?? "read";

  if (operation === "write" && adminOnlyWrite(domainPolicy) && !ctx.isAdmin) {
    throw new IntelligenceAccessDeniedError(
      `Write access to intelligence domain "${ctx.domainId}" requires admin.`,
      "write_requires_admin",
      slug,
      ctx.domainId,
    );
  }

  if (deniesExternal(pack, domainPolicy) && ctx.isExternal) {
    throw new IntelligenceAccessDeniedError(
      `External sessions cannot access intelligence domain "${ctx.domainId}".`,
      "external_denied",
      slug,
      ctx.domainId,
    );
  }

  const roles = allowedRoles(pack, domainPolicy);
  if (roles?.length) {
    const role = String(ctx.roleView ?? "").trim();
    if (!role || !roles.includes(role)) {
      throw new IntelligenceAccessDeniedError(
        `Role "${role || "unknown"}" cannot access intelligence domain "${ctx.domainId}".`,
        "role_not_allowed",
        slug,
        ctx.domainId,
      );
    }
  }

  const surfaces = allowedSurfaces(pack, domainPolicy);
  if (surfaces?.length) {
    const surface = String(ctx.hostSurface ?? "").trim();
    if (!surface || !surfaces.includes(surface)) {
      throw new IntelligenceAccessDeniedError(
        `Host surface "${surface || "unknown"}" cannot access intelligence domain "${ctx.domainId}".`,
        "host_surface_not_allowed",
        slug,
        ctx.domainId,
      );
    }
  }
}
