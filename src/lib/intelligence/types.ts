/**
 * L1 — Central AI Intelligence framework contracts.
 * Workspace-specific domain data and providers remain in L3 packs.
 */

import type { IntelligenceEaBridge } from "@/lib/intelligence/ea-bridge";

/** Workspace slug — intelligence records are always scoped to one workspace. */
export type IntelligenceWorkspaceSlug = string;

/** Provider-owned domain identifier (unique within a workspace pack). */
export type IntelligenceDomainId = string;

export type IntelligenceSeverity = "critical" | "high" | "medium" | "low" | "info";

export type IntelligenceScoreBand = "excellent" | "healthy" | "watch" | "elevated" | "critical";

export type IntelligenceSourceKind =
  | "regulatory"
  | "public_feed"
  | "internal_fixture"
  | "crm_derived"
  | "portfolio_derived"
  | "manual"
  | string;

/** Connector or catalogue entry for ingested / referenced intelligence. */
export type IntelligenceSource = {
  id: string;
  workspaceSlug: IntelligenceWorkspaceSlug;
  domainId: IntelligenceDomainId;
  name: string;
  url?: string;
  kind: IntelligenceSourceKind;
  /** ISO 8601 duration hint, e.g. weekly refresh — provider-defined. */
  refreshCadence?: string;
  description?: string;
};

export type IntelligenceCategory = {
  id: string;
  label: string;
  description?: string;
};

export type IntelligenceTag = {
  id: string;
  label: string;
};

export type IntelligenceEntityRef = {
  entityType: string;
  entityId: string;
  label?: string;
};

/**
 * Normalised intelligence item. Business payloads stay provider-specific in `metadata`.
 * Records MUST NOT be shared across workspaces.
 */
export type IntelligenceRecord = {
  id: string;
  workspaceSlug: IntelligenceWorkspaceSlug;
  domainId: IntelligenceDomainId;
  title: string;
  summary: string;
  severity: IntelligenceSeverity;
  score?: IntelligenceScore;
  categories: readonly IntelligenceCategory[];
  tags: readonly IntelligenceTag[];
  sourceId?: string;
  entityRefs?: readonly IntelligenceEntityRef[];
  occurredAt?: string;
  updatedAt?: string;
  /** Provider-specific payload — never interpreted by L1. */
  metadata?: Record<string, unknown>;
};

export type IntelligenceScore = {
  value: number;
  band: IntelligenceScoreBand;
  label?: string;
  reasoning?: string;
};

export type IntelligenceFilter = {
  domainIds?: readonly IntelligenceDomainId[];
  severities?: readonly IntelligenceSeverity[];
  categories?: readonly string[];
  tags?: readonly string[];
  entityType?: string;
  entityId?: string;
  search?: string;
};

export type IntelligenceSearchQuery = {
  workspaceSlug: IntelligenceWorkspaceSlug;
  filter?: IntelligenceFilter;
  limit?: number;
  offset?: number;
};

export type IntelligenceBriefingSection = {
  id: string;
  title: string;
  bullets: string[];
  recordIds?: string[];
};

/** Aggregated executive-style briefing for a domain or workspace. */
export type IntelligenceBriefing = {
  workspaceSlug: IntelligenceWorkspaceSlug;
  domainId: IntelligenceDomainId;
  asOf: string;
  headline: string;
  posture?: IntelligenceScoreBand;
  postureReason?: string;
  sections: readonly IntelligenceBriefingSection[];
  recommendedActions?: readonly string[];
  recordIds?: readonly string[];
};

/**
 * L2 — One intelligence domain registered under a workspace pack.
 * Providers supply domain definitions; L3 implements data and UI.
 */
export type IntelligenceDomainDefinition = {
  id: IntelligenceDomainId;
  label: string;
  description?: string;
  /** Internal dashboard view ids (e.g. member-intelligence) — optional until UI migrates. */
  navViews?: readonly string[];
  categories?: readonly IntelligenceCategory[];
  defaultSeverity?: IntelligenceSeverity;
  /** Future L3 provider module id within the workspace pack. */
  providerId?: string;
};

export type IntelligenceHostSurface =
  | "internal"
  | "demo"
  | "onwardair"
  | "talanton"
  | "abhi"
  | "corpcentre"
  | string;

/** L2 — Per-domain access rules (evaluated server-side in later phases). */
export type IntelligenceDomainAccessPolicy = {
  /** Role view ids allowed to read this domain (empty = inherit pack default). */
  allowedRoleViews?: readonly string[];
  /** Host surfaces where this domain may appear (empty = inherit pack default). */
  allowedHostSurfaces?: readonly IntelligenceHostSurface[];
  /** Block external portal sessions from intelligence surfaces. */
  denyExternal?: boolean;
  /** Writes (ingest, annotate) require admin — reads use allowedRoleViews. */
  adminOnlyWrite?: boolean;
};

export type IntelligenceAccessPolicy = {
  /** Pack-wide defaults; domain policies may override. */
  defaultAllowedRoleViews?: readonly string[];
  defaultAllowedHostSurfaces?: readonly IntelligenceHostSurface[];
  denyExternal?: boolean;
  domains?: Readonly<Record<IntelligenceDomainId, IntelligenceDomainAccessPolicy>>;
};

/**
 * L2/L3 — Workspace intelligence pack: domains, access, optional EA bridge.
 * Business records remain in workspace-specific stores (L4).
 */
export type IntelligenceWorkspacePack = {
  id: string;
  slug: IntelligenceWorkspaceSlug;
  label: string;
  /** Primary host surface id for access policy (e.g. onwardair, talanton, abhi, demo). */
  hostSurface: IntelligenceHostSurface;
  domains: readonly IntelligenceDomainDefinition[];
  accessPolicy: IntelligenceAccessPolicy;
  /** Optional slug aliases (e.g. onward → onwardair). */
  slugAliases?: readonly string[];
};

/** Required scope for every intelligence operation — enforces workspace isolation. */
export type IntelligenceScopedContext = {
  workspaceSlug: IntelligenceWorkspaceSlug;
  domainId?: IntelligenceDomainId;
};

export type IntelligenceIsolationPolicy = {
  /** When true, cross-workspace record access throws. Always true in production framework use. */
  enforceWorkspaceBoundary: boolean;
};

/** Caller-supplied handles — each L3 provider documents its own keys (e.g. clients). */
export type IntelligenceProviderData = Readonly<Record<string, unknown>>;

/** Scope passed into every L3 domain provider call. */
export type IntelligenceProviderContext = IntelligenceScopedContext & {
  data?: IntelligenceProviderData;
};

export type IntelligenceSearchResult = {
  records: readonly IntelligenceRecord[];
  total: number;
};

export type IntelligenceSpecialistAction = {
  id: string;
  label: string;
  description?: string;
  domainId: IntelligenceDomainId;
};

export type IntelligenceSpecialistActionRequest = {
  actionId: string;
  input?: Record<string, unknown>;
};

/** UI surface registration — views remain workspace-owned; central only indexes ids. */
export type IntelligenceUiViewRegistration = {
  viewId: string;
  domainId: IntelligenceDomainId;
  label?: string;
};

/**
 * L3 — Domain provider contract. Workspace packs implement one provider per domain.
 * Central services delegate here; no workspace slug branching in L1.
 */
export type IntelligenceDomainProvider = {
  readonly domainId: IntelligenceDomainId;
  listSources?: (ctx: IntelligenceProviderContext) => Promise<readonly IntelligenceSource[]>;
  searchRecords?: (
    ctx: IntelligenceProviderContext,
    query: IntelligenceSearchQuery,
  ) => Promise<IntelligenceSearchResult>;
  getRecord?: (ctx: IntelligenceProviderContext, recordId: string) => Promise<IntelligenceRecord | null>;
  buildBriefing?: (ctx: IntelligenceProviderContext) => Promise<IntelligenceBriefing>;
  runSpecialistAction?: (
    ctx: IntelligenceProviderContext,
    request: IntelligenceSpecialistActionRequest,
  ) => Promise<unknown>;
};

/**
 * Full workspace intelligence pack — metadata + L3 providers.
 * Register via {@link registerIntelligencePack}; never branch on slug in L1.
 */
export type IntelligenceWorkspacePackRegistration = IntelligenceWorkspacePack & {
  providers: readonly IntelligenceDomainProvider[];
  uiViews?: readonly IntelligenceUiViewRegistration[];
  specialistActions?: readonly IntelligenceSpecialistAction[];
  /** Documented EA tool names (wired in a later EA phase). */
  eaToolNames?: readonly string[];
  /** Optional per-pack EA bridge — intent resolvers and tool handlers. */
  eaBridge?: IntelligenceEaBridge;
};
