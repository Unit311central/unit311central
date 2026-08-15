import { requireIntelligenceAccess, type IntelligenceAccessContext } from "@/lib/intelligence/access";
import {
  assertIntelligenceWorkspaceScope,
  assertRecordsBelongToWorkspace,
  createIntelligenceScopedContext,
} from "@/lib/intelligence/isolation";
import {
  ensureIntelligencePacksBootstrapped,
  getIntelligenceDomain,
  getIntelligencePackBySlug,
  getIntelligenceProviderForDomain,
} from "@/lib/intelligence/registry";
import type {
  IntelligenceBriefing,
  IntelligenceDomainId,
  IntelligenceProviderContext,
  IntelligenceRecord,
  IntelligenceSearchQuery,
  IntelligenceSearchResult,
  IntelligenceSource,
  IntelligenceSpecialistActionRequest,
  IntelligenceWorkspaceSlug,
} from "@/lib/intelligence/types";

export type IntelligenceServiceAccess = Pick<
  IntelligenceAccessContext,
  "roleView" | "hostSurface" | "isExternal" | "isAdmin"
>;

function providerContext(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId: IntelligenceDomainId,
  data?: IntelligenceProviderContext["data"],
): IntelligenceProviderContext {
  return createIntelligenceScopedContext(workspaceSlug, domainId) as IntelligenceProviderContext;
}

function assertReadAccess(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId: IntelligenceDomainId,
  access?: IntelligenceServiceAccess,
): void {
  if (!access) return;
  const pack = getIntelligencePackBySlug(workspaceSlug);
  requireIntelligenceAccess(pack, {
    workspaceSlug,
    domainId,
    operation: "read",
    ...access,
  });
}

function assertWriteAccess(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId: IntelligenceDomainId,
  access?: IntelligenceServiceAccess,
): void {
  if (!access) return;
  const pack = getIntelligencePackBySlug(workspaceSlug);
  requireIntelligenceAccess(pack, {
    workspaceSlug,
    domainId,
    operation: "write",
    ...access,
  });
}

function resolveProvider(workspaceSlug: IntelligenceWorkspaceSlug, domainId: IntelligenceDomainId) {
  ensureIntelligencePacksBootstrapped();
  const pack = getIntelligencePackBySlug(workspaceSlug);
  if (!pack) {
    throw new Error(`No intelligence pack registered for workspace "${workspaceSlug}".`);
  }
  const domain = getIntelligenceDomain(workspaceSlug, domainId);
  if (!domain) {
    throw new Error(`Intelligence domain "${domainId}" is not registered for "${workspaceSlug}".`);
  }
  const provider = getIntelligenceProviderForDomain(workspaceSlug, domainId);
  if (!provider) {
    throw new Error(`No intelligence provider for domain "${domainId}" on "${workspaceSlug}".`);
  }
  return { pack, domain, provider };
}

export async function listIntelligenceSources(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId: IntelligenceDomainId,
  options?: {
    access?: IntelligenceServiceAccess;
    data?: IntelligenceProviderContext["data"];
  },
): Promise<readonly IntelligenceSource[]> {
  assertReadAccess(workspaceSlug, domainId, options?.access);
  const { provider } = resolveProvider(workspaceSlug, domainId);
  if (!provider.listSources) return [];
  const ctx = providerContext(workspaceSlug, domainId, options?.data);
  assertIntelligenceWorkspaceScope(ctx, workspaceSlug);
  return provider.listSources(ctx);
}

export async function searchIntelligenceRecords(
  query: IntelligenceSearchQuery,
  options?: {
    access?: IntelligenceServiceAccess;
    data?: IntelligenceProviderContext["data"];
  },
): Promise<IntelligenceSearchResult> {
  const workspaceSlug = query.workspaceSlug;
  const domainId = query.filter?.domainIds?.[0];
  if (!domainId) {
    throw new Error("searchIntelligenceRecords requires filter.domainIds[0].");
  }

  assertReadAccess(workspaceSlug, domainId, options?.access);
  const { provider } = resolveProvider(workspaceSlug, domainId);
  if (!provider.searchRecords) {
    return { records: [], total: 0 };
  }

  const ctx = providerContext(workspaceSlug, domainId, options?.data);
  assertIntelligenceWorkspaceScope(ctx, workspaceSlug);
  const result = await provider.searchRecords(ctx, query);
  assertRecordsBelongToWorkspace(result.records, workspaceSlug);
  return result;
}

export async function getIntelligenceRecord(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId: IntelligenceDomainId,
  recordId: string,
  options?: {
    access?: IntelligenceServiceAccess;
    data?: IntelligenceProviderContext["data"];
  },
): Promise<IntelligenceRecord | null> {
  assertReadAccess(workspaceSlug, domainId, options?.access);
  const { provider } = resolveProvider(workspaceSlug, domainId);
  if (!provider.getRecord) return null;

  const ctx = providerContext(workspaceSlug, domainId, options?.data);
  assertIntelligenceWorkspaceScope(ctx, workspaceSlug);
  const record = await provider.getRecord(ctx, recordId);
  if (record) assertRecordsBelongToWorkspace([record], workspaceSlug);
  return record;
}

export async function buildIntelligenceBriefing(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId: IntelligenceDomainId,
  options?: {
    access?: IntelligenceServiceAccess;
    data?: IntelligenceProviderContext["data"];
  },
): Promise<IntelligenceBriefing> {
  assertReadAccess(workspaceSlug, domainId, options?.access);
  const { provider } = resolveProvider(workspaceSlug, domainId);
  if (!provider.buildBriefing) {
    throw new Error(`Domain "${domainId}" on "${workspaceSlug}" does not support briefings.`);
  }

  const ctx = providerContext(workspaceSlug, domainId, options?.data);
  assertIntelligenceWorkspaceScope(ctx, workspaceSlug);
  const briefing = await provider.buildBriefing(ctx);
  assertIntelligenceWorkspaceScope(
    { workspaceSlug: briefing.workspaceSlug, domainId: briefing.domainId },
    workspaceSlug,
  );
  if (briefing.domainId !== domainId) {
    throw new Error(`Briefing domain mismatch: expected "${domainId}", got "${briefing.domainId}".`);
  }
  return briefing;
}

export async function runIntelligenceSpecialistAction(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId: IntelligenceDomainId,
  request: IntelligenceSpecialistActionRequest,
  options?: {
    access?: IntelligenceServiceAccess;
    data?: IntelligenceProviderContext["data"];
  },
): Promise<unknown> {
  assertWriteAccess(workspaceSlug, domainId, options?.access);
  const { provider } = resolveProvider(workspaceSlug, domainId);
  if (!provider.runSpecialistAction) {
    throw new Error(`Domain "${domainId}" on "${workspaceSlug}" does not support specialist actions.`);
  }

  const ctx = providerContext(workspaceSlug, domainId, options?.data);
  assertIntelligenceWorkspaceScope(ctx, workspaceSlug);
  return provider.runSpecialistAction(ctx, request);
}
