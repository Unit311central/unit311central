/**
 * L1 — Central External Portal framework contracts.
 * Workspace-specific route data and UI remain in workspace packs (L3).
 */

export type PortalKind = "client" | "board" | "overview" | "company" | "member" | string;

/** Canonical route entry for a workspace external portal programme. */
export type PortalRouteDefinition = {
  path: string;
  displayName: string;
  /** internal_clients.id */
  clientId: string;
  username: string;
  redirectPath: string;
  companyLogoSrc?: string;
  portalKind?: PortalKind;
  /** Talanton portfolio company id (optional). */
  companyId?: string;
};

export type PortalPathMatch = {
  route: PortalRouteDefinition;
  rest: string;
};

export type PortalExtraGateKind = "overview";

export type PortalAccessPolicy = {
  /** External users only at middleware gate (staff must use portal login). */
  externalOnly: boolean;
  /** Internal staff may preview company portals in layout auth (never board when blocked). */
  allowStaffPreview: boolean;
  /** Portal kinds that reject staff preview even when allowStaffPreview is true. */
  staffPreviewBlockedKinds?: PortalKind[];
  /** Additional gate layers beyond platform JWT (e.g. OnwardAir overview cookies). */
  extraGates?: PortalExtraGateKind[];
};

export type PortalsIndent = 0 | 1 | 2 | 3;

export type PortalsModuleRow = {
  id: string;
  text: string;
  indent?: PortalsIndent;
};

export type PortalsEditableContent = {
  majorModules: PortalsModuleRow[];
  customModules: PortalsModuleRow[];
};

export type PortalsBriefingAuthConfig = {
  isAllowedUsername: (username: string | null | undefined) => boolean;
  isAdminUsername: (username: string | null | undefined) => boolean;
  sharedPassword?: string;
  /** Public login URL for the briefing (full path or query-style next). */
  loginPath: string;
  /** Uses dedicated /portals/login instead of org /login?next=/portals */
  usesDedicatedPortalsLogin: boolean;
};

export type PortalsBriefingContentConfig = {
  contentTable: string;
  defaultContent: () => PortalsEditableContent;
  sanitizeContent: (raw: unknown) => PortalsEditableContent;
};

export type PortalRouteMatcher = {
  matchPathname: (pathname: string) => PortalPathMatch | null;
  getRouteByPath: (path: string | null | undefined) => PortalRouteDefinition | null;
  getRouteByClientId: (clientId: string | null | undefined) => PortalRouteDefinition | null;
  absoluteUrl: (route: PortalRouteDefinition) => string;
};

/**
 * L2/L3 — Workspace portal pack: routes, access policy, briefing, and matchers.
 */
export type PortalWorkspacePack = {
  slug: string;
  /** Host / session aliases that resolve to this pack (e.g. onward → onwardair). */
  slugAliases?: readonly string[];
  implBase: string;
  publicPathPrefix: string;
  origin: string;
  routes: readonly PortalRouteDefinition[];
  accessPolicy: PortalAccessPolicy;
  matcher: PortalRouteMatcher;
  briefing?: PortalsBriefingAuthConfig & PortalsBriefingContentConfig;
};

export type PortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
  isStaffPreview: boolean;
};
