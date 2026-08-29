import type { IntelligenceEaBridge } from "@/lib/intelligence/ea-bridge";
import type {
  IntelligenceDomainDefinition,
  IntelligenceDomainId,
  IntelligenceDomainProvider,
  IntelligenceWorkspacePackRegistration,
  IntelligenceWorkspaceSlug,
} from "@/lib/intelligence/types";

export type RegisteredIntelligenceWorkspacePack = IntelligenceWorkspacePackRegistration & {
  eaBridge?: IntelligenceEaBridge;
};

const packsBySlug = new Map<string, RegisteredIntelligenceWorkspacePack>();
const packsById = new Map<string, RegisteredIntelligenceWorkspacePack>();
const providersByDomainKey = new Map<string, IntelligenceDomainProvider>();

let packsBootstrapped = false;

function domainKey(workspaceSlug: string, domainId: string): string {
  return `${workspaceSlug}::${domainId}`;
}

function normalizeSlug(slug: string | null | undefined): string {
  return String(slug ?? "")
    .trim()
    .toLowerCase();
}

function validatePack(pack: RegisteredIntelligenceWorkspacePack): void {
  const normalizedSlug = normalizeSlug(pack.slug);
  if (!normalizedSlug) {
    throw new Error("Intelligence pack must have a non-empty slug.");
  }
  if (!pack.id?.trim()) {
    throw new Error("Intelligence pack must have a non-empty id.");
  }
  if (!pack.domains.length) {
    throw new Error(`Intelligence pack "${pack.id}" must declare at least one domain.`);
  }
  if (!pack.providers.length) {
    throw new Error(`Intelligence pack "${pack.id}" must declare at least one provider.`);
  }

  const domainIds = new Set(pack.domains.map((d) => d.id));
  for (const provider of pack.providers) {
    if (!domainIds.has(provider.domainId)) {
      throw new Error(
        `Intelligence pack "${pack.id}" provider "${provider.domainId}" has no matching domain definition.`,
      );
    }
  }
}

function indexPack(pack: RegisteredIntelligenceWorkspacePack): void {
  const normalizedSlug = normalizeSlug(pack.slug);
  packsById.set(pack.id, { ...pack, slug: normalizedSlug });
  packsBySlug.set(normalizedSlug, packsById.get(pack.id)!);
  for (const alias of pack.slugAliases ?? []) {
    packsBySlug.set(normalizeSlug(alias), packsById.get(pack.id)!);
  }
  for (const provider of pack.providers) {
    providersByDomainKey.set(domainKey(normalizedSlug, provider.domainId), provider);
  }
}

/**
 * Register a workspace intelligence pack (L2/L3 boundary).
 * New workspaces add a pack file and one entry in workspace-packs/index.ts — no L1 edits.
 */
export function registerIntelligencePack(pack: RegisteredIntelligenceWorkspacePack): void {
  validatePack(pack);
  indexPack(pack);
}

/** Idempotent — loads all packs from workspace-packs/index when registry is empty. */
export function ensureIntelligencePacksBootstrapped(): void {
  if (packsBootstrapped) return;
  if (packsById.size > 0) {
    packsBootstrapped = true;
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { bootstrapIntelligenceWorkspacePacks } =
    require("@/lib/intelligence/workspace-packs") as typeof import("@/lib/intelligence/workspace-packs");
  bootstrapIntelligenceWorkspacePacks();
  packsBootstrapped = true;
}

/** Test-only — clear all registered packs and bootstrap flag. */
export function clearIntelligenceRegistryForTests(): void {
  packsBySlug.clear();
  packsById.clear();
  providersByDomainKey.clear();
  packsBootstrapped = false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { resetIntelligenceWorkspacePackBootstrapForTests } =
    require("@/lib/intelligence/workspace-packs") as typeof import("@/lib/intelligence/workspace-packs");
  resetIntelligenceWorkspacePackBootstrapForTests();
}

export function listIntelligencePacks(): readonly RegisteredIntelligenceWorkspacePack[] {
  const seen = new Set<string>();
  const result: RegisteredIntelligenceWorkspacePack[] = [];
  for (const pack of packsById.values()) {
    if (seen.has(pack.id)) continue;
    seen.add(pack.id);
    result.push(pack);
  }
  return result;
}

/** Slug-specific pack registration only — no generic customer fallback. */
export function getRegisteredIntelligencePackBySlug(
  workspaceSlug: string | null | undefined,
): RegisteredIntelligenceWorkspacePack | null {
  ensureIntelligencePacksBootstrapped();
  const normalized = normalizeSlug(workspaceSlug);
  if (!normalized) return null;
  return packsBySlug.get(normalized) ?? null;
}

export function getIntelligencePackBySlug(
  workspaceSlug: string | null | undefined,
): RegisteredIntelligenceWorkspacePack | null {
  ensureIntelligencePacksBootstrapped();
  const normalized = normalizeSlug(workspaceSlug);
  if (!normalized) return null;
  const specific = packsBySlug.get(normalized);
  if (specific) return specific;
  // Generic customer workspaces — no per-slug registration required.
  return packsById.get("customer-intelligence") ?? null;
}

export function getIntelligencePackById(
  packId: string | null | undefined,
): RegisteredIntelligenceWorkspacePack | null {
  const id = String(packId ?? "").trim();
  if (!id) return null;
  return packsById.get(id) ?? null;
}

export function getIntelligenceProviderForDomain(
  workspaceSlug: string | null | undefined,
  domainId: IntelligenceDomainId,
): IntelligenceDomainProvider | null {
  const pack = getIntelligencePackBySlug(workspaceSlug);
  if (!pack) return null;
  const id = String(domainId ?? "").trim();
  if (!id) return null;
  return providersByDomainKey.get(domainKey(pack.slug, id)) ?? null;
}

export function listIntelligenceDomainsForWorkspace(
  workspaceSlug: string | null | undefined,
): readonly IntelligenceDomainDefinition[] {
  const pack = getIntelligencePackBySlug(workspaceSlug);
  return pack?.domains ?? [];
}

export function getIntelligenceDomain(
  workspaceSlug: string | null | undefined,
  domainId: IntelligenceDomainId,
): IntelligenceDomainDefinition | null {
  const pack = getIntelligencePackBySlug(workspaceSlug);
  if (!pack) return null;
  const id = String(domainId ?? "").trim();
  if (!id) return null;
  return pack.domains.find((d) => d.id === id) ?? null;
}

export function matchIntelligenceDomainByView(
  workspaceSlug: string | null | undefined,
  activeView: string | null | undefined,
): IntelligenceDomainDefinition | null {
  const view = String(activeView ?? "").trim();
  if (!view) return null;

  const pack = getIntelligencePackBySlug(workspaceSlug);
  if (!pack) return null;

  for (const registration of pack.uiViews ?? []) {
    if (registration.viewId === view) {
      return getIntelligenceDomain(workspaceSlug, registration.domainId);
    }
  }

  for (const domain of pack.domains) {
    if (domain.navViews?.includes(view)) return domain;
  }
  return null;
}

export function isIntelligenceWorkspaceSlug(
  workspaceSlug: string | null | undefined,
): boolean {
  return getIntelligencePackBySlug(workspaceSlug) != null;
}

export function assertIntelligenceWorkspaceSlug(
  workspaceSlug: string | null | undefined,
): IntelligenceWorkspaceSlug {
  const pack = getIntelligencePackBySlug(workspaceSlug);
  if (!pack) {
    throw new Error(`No intelligence pack registered for workspace "${normalizeSlug(workspaceSlug)}".`);
  }
  return pack.slug;
}
