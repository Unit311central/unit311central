import type { PortalRouteDefinition, PortalWorkspacePack } from "@/lib/portals/types";

const packsBySlug = new Map<string, PortalWorkspacePack>();
let packsBootstrapped = false;

function normalizeSlug(slug: string | null | undefined): string {
  return String(slug ?? "")
    .trim()
    .toLowerCase();
}

function validatePack(pack: PortalWorkspacePack): void {
  const normalizedSlug = normalizeSlug(pack.slug);
  if (!normalizedSlug) {
    throw new Error("Portal pack must have a non-empty slug.");
  }
  if (!pack.implBase?.trim()) {
    throw new Error(`Portal pack "${normalizedSlug}" must declare implBase.`);
  }
  if (!pack.routes.length) {
    throw new Error(`Portal pack "${normalizedSlug}" must declare at least one route.`);
  }
}

function indexPack(pack: PortalWorkspacePack): void {
  const normalizedSlug = normalizeSlug(pack.slug);
  const indexed: PortalWorkspacePack = { ...pack, slug: normalizedSlug };
  packsBySlug.set(normalizedSlug, indexed);
  for (const alias of pack.slugAliases ?? []) {
    packsBySlug.set(normalizeSlug(alias), indexed);
  }
}

/**
 * Register a workspace portal pack (L2/L3 boundary).
 * New workspaces add a pack file and one entry in workspace-packs/index.ts — no L1 edits.
 */
export function registerPortalPack(pack: PortalWorkspacePack): void {
  validatePack(pack);
  indexPack(pack);
}

/** Idempotent — loads all packs from workspace-packs/index when registry is empty. */
export function ensurePortalPacksBootstrapped(): void {
  if (packsBootstrapped) return;
  if (packsBySlug.size > 0) {
    packsBootstrapped = true;
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { bootstrapPortalWorkspacePacks } =
    require("@/lib/portals/workspace-packs") as typeof import("@/lib/portals/workspace-packs");
  bootstrapPortalWorkspacePacks();
  packsBootstrapped = true;
}

/** Test-only — clear all registered packs and bootstrap flag. */
export function clearPortalRegistryForTests(): void {
  packsBySlug.clear();
  packsBootstrapped = false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { resetPortalWorkspacePackBootstrapForTests } =
    require("@/lib/portals/workspace-packs") as typeof import("@/lib/portals/workspace-packs");
  resetPortalWorkspacePackBootstrapForTests();
}

/** Resolve pack for host slug, including registered aliases. */
export function getPortalPackBySlug(workspaceSlug: string | null | undefined): PortalWorkspacePack | null {
  ensurePortalPacksBootstrapped();
  const normalized = normalizeSlug(workspaceSlug);
  if (!normalized) return null;
  return packsBySlug.get(normalized) ?? null;
}

export function listPortalWorkspacePacks(): readonly PortalWorkspacePack[] {
  ensurePortalPacksBootstrapped();
  const seen = new Set<string>();
  const result: PortalWorkspacePack[] = [];
  for (const pack of packsBySlug.values()) {
    if (seen.has(pack.slug)) continue;
    seen.add(pack.slug);
    result.push(pack);
  }
  return result;
}

export function isPortalWorkspaceSlug(workspaceSlug: string | null | undefined): boolean {
  return getPortalPackBySlug(workspaceSlug) != null;
}

export function portalImplBaseForSlug(workspaceSlug: string): string | null {
  return getPortalPackBySlug(workspaceSlug)?.implBase ?? null;
}

export function matchPortalPathnameForSlug(
  workspaceSlug: string,
  pathname: string,
): { route: PortalRouteDefinition; rest: string } | null {
  const pack = getPortalPackBySlug(workspaceSlug);
  if (!pack) return null;
  return pack.matcher.matchPathname(pathname);
}

export function canonicalizePortalRedirect(
  redirectPath: string | null | undefined,
): string | null {
  if (!redirectPath) return null;
  for (const pack of listPortalWorkspacePacks()) {
    const match = pack.matcher.matchPathname(redirectPath);
    if (match) return `/${match.route.path}`;
  }
  return null;
}

export function isPortalsBriefingAllowedUsername(
  username: string | null | undefined,
  workspaceSlug: string,
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getPortalsBriefingPackBySlug } =
    require("@/lib/portals/briefing/pack-registry") as typeof import("@/lib/portals/briefing/pack-registry");
  const pack = getPortalsBriefingPackBySlug(workspaceSlug);
  if (!pack?.briefing) return false;
  return pack.briefing.isAllowedUsername(username);
}

export function portalsBriefingLoginUrl(origin: string, workspaceSlug: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getPortalsBriefingPackBySlug } =
    require("@/lib/portals/briefing/pack-registry") as typeof import("@/lib/portals/briefing/pack-registry");
  const pack = getPortalsBriefingPackBySlug(workspaceSlug);
  const base = origin.replace(/\/$/, "");
  if (!pack?.briefing) {
    return `${base}/login?next=${encodeURIComponent("/portals")}`;
  }
  if (pack.briefing.usesDedicatedPortalsLogin) {
    return `${base}/portals/login`;
  }
  return `${base}${pack.briefing.loginPath.startsWith("/") ? pack.briefing.loginPath : `/${pack.briefing.loginPath}`}`;
}

/** ECA and admin surfaces: list external portal routes for a workspace slug. */
export function listPortalRoutesForWorkspace(
  workspaceSlug: string,
): readonly PortalRouteDefinition[] {
  const pack = getPortalPackBySlug(workspaceSlug);
  return pack?.routes ?? [];
}

export function portalOriginForWorkspace(workspaceSlug: string): string | null {
  return getPortalPackBySlug(workspaceSlug)?.origin ?? null;
}
