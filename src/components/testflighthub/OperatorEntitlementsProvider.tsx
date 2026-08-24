"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import type { CommandCentreHomeTileId } from "@/lib/command-centre-home-tiles";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { isViewAllowedForGrants } from "@/lib/internal-role-views";
import { usesInternalPlatformNav } from "@/lib/platform-workspaces/workspace-nav-resolver";
import { isSpecialistWorkspaceSlug } from "@/lib/platform-workspaces/workspace-product-nav";
import type { OperatorEntitlementsSnapshot } from "@/lib/operator-entitlements-server";
import {
  PLATFORM_CACHE_KEYS,
  fetchCachedJson,
  peekCachedJson,
  scopedPlatformCacheKey,
} from "@/lib/platform-fetch-cache";
import { mapUserRoleToInternalRoleView } from "@/lib/ai-operating-assistant/operator-entitlements";
import {
  primaryUserRole,
  type UserDepartment,
  type UserRole,
} from "@/lib/user-management-data";
import type { InternalRoleView } from "@/lib/internal-role-views";

export type OperatorEntitlements = {
  role: string | null;
  roles: string[];
  department: string | null;
  departments: string[];
  allowedViews: InternalOperationsView[] | null;
  homeTiles: CommandCentreHomeTileId[] | null;
  /** Mapped InternalRoleView for EA / shell (from primary access tier). */
  roleView: InternalRoleView | null;
  workspaceSlug: string | null;
  workspaceType: string | null;
  workspaceName: string | null;
  enabledModules: string[] | null;
  enabledSubModules: string[] | null;
  ready: boolean;
};

const EMPTY_ENTITLEMENTS: OperatorEntitlements = {
  role: null,
  roles: [],
  department: null,
  departments: [],
  allowedViews: null,
  homeTiles: null,
  roleView: null,
  workspaceSlug: null,
  workspaceType: null,
  workspaceName: null,
  enabledModules: null,
  enabledSubModules: null,
  ready: false,
};

const OperatorEntitlementsContext = createContext<OperatorEntitlements>(EMPTY_ENTITLEMENTS);

type WhoamiPayload = {
  role?: string | null;
  roles?: string[] | null;
  department?: string | null;
  departments?: string[] | null;
  allowedViews?: InternalOperationsView[] | null;
  dashboardPrefs?: { homeTiles?: CommandCentreHomeTileId[] } | null;
  workspaceName?: string | null;
  workspaceSlug?: string | null;
  workspaceType?: string | null;
  enabledModules?: string[] | null;
  enabledSubModules?: string[] | null;
};

function readHostWorkspaceSlug(): string | null {
  if (typeof window === "undefined") return null;
  return parseClientPlatformSubdomainSafe(window.location.hostname);
}

function readCachedWhoami(hostSlug: string | null): WhoamiPayload | null {
  return peekCachedJson<WhoamiPayload>(scopedPlatformCacheKey(PLATFORM_CACHE_KEYS.whoami, hostSlug));
}

function navCanRenderWithoutWhoami(snapshot: {
  workspaceSlug: string | null;
  workspaceType: string | null;
  workspaceName: string | null;
  enabledModules: string[] | null;
}): boolean {
  if (snapshot.enabledModules?.length) return true;
  if (isSpecialistWorkspaceSlug(snapshot.workspaceSlug)) return true;
  if (usesInternalPlatformNav(snapshot.workspaceSlug, snapshot.workspaceType)) return true;
  return false;
}

function buildEntitlementsFromPayload(
  payload: WhoamiPayload,
  hostSlug: string | null,
  ready = true,
): OperatorEntitlements {
  const roles = (payload.roles?.length ? payload.roles : payload.role ? [payload.role] : []) as UserRole[];
  const departments = (payload.departments?.length
    ? payload.departments
    : payload.department
      ? [payload.department]
      : []) as UserDepartment[];
  const roleView =
    roles.length > 0 ? mapUserRoleToInternalRoleView(primaryUserRole(roles)) : null;

  const workspaceSlug = payload.workspaceSlug ?? hostSlug ?? null;
  const workspaceType = payload.workspaceType ?? null;
  const workspaceName = payload.workspaceName ?? null;
  const enabledModules = payload.enabledModules ?? null;
  const enabledSubModules = payload.enabledSubModules ?? null;

  return {
    role: payload.role ?? null,
    roles,
    department: payload.department ?? null,
    departments,
    allowedViews: payload.allowedViews ?? null,
    homeTiles: payload.dashboardPrefs?.homeTiles ?? null,
    roleView,
    workspaceSlug,
    workspaceType,
    workspaceName,
    enabledModules,
    enabledSubModules,
    ready,
  };
}

function serverSnapshotHydratesPermissions(
  snapshot?: OperatorEntitlementsSnapshot | null,
): boolean {
  if (!snapshot) return false;
  return Boolean(snapshot.roles?.length || snapshot.role);
}

function buildInitialEntitlementsState(
  serverSnapshot?: OperatorEntitlementsSnapshot | null,
): OperatorEntitlements {
  const hostSlug = readHostWorkspaceSlug();
  const cached = readCachedWhoami(hostSlug);
  const serverHydratesPermissions = serverSnapshotHydratesPermissions(serverSnapshot);
  const payload: WhoamiPayload = {
    ...(serverHydratesPermissions ? {} : cached),
    ...serverSnapshot,
    workspaceSlug: serverSnapshot?.workspaceSlug ?? cached?.workspaceSlug ?? hostSlug ?? null,
    workspaceType: serverSnapshot?.workspaceType ?? cached?.workspaceType ?? null,
    workspaceName: serverSnapshot?.workspaceName ?? cached?.workspaceName ?? null,
    enabledModules: serverSnapshot?.enabledModules ?? cached?.enabledModules ?? null,
    enabledSubModules: serverSnapshot?.enabledSubModules ?? cached?.enabledSubModules ?? null,
    allowedViews: serverHydratesPermissions
      ? (serverSnapshot?.allowedViews ?? null)
      : (serverSnapshot?.allowedViews ?? cached?.allowedViews ?? null),
    dashboardPrefs: serverSnapshot?.homeTiles
      ? { homeTiles: serverSnapshot.homeTiles }
      : cached?.dashboardPrefs,
    role: serverHydratesPermissions
      ? (serverSnapshot?.role ?? null)
      : (serverSnapshot?.role ?? cached?.role ?? null),
    roles: serverHydratesPermissions
      ? (serverSnapshot?.roles ?? null)
      : (serverSnapshot?.roles ?? cached?.roles ?? null),
    department: serverHydratesPermissions
      ? (serverSnapshot?.department ?? null)
      : (serverSnapshot?.department ?? cached?.department ?? null),
    departments: serverHydratesPermissions
      ? (serverSnapshot?.departments ?? null)
      : (serverSnapshot?.departments ?? cached?.departments ?? null),
  };

  const entitlements = buildEntitlementsFromPayload(
    payload,
    hostSlug,
    navCanRenderWithoutWhoami({
      workspaceSlug: payload.workspaceSlug ?? hostSlug ?? null,
      workspaceType: payload.workspaceType ?? null,
      workspaceName: payload.workspaceName ?? null,
      enabledModules: payload.enabledModules ?? null,
    }),
  );

  return entitlements;
}

function serverSnapshotHydratesNav(snapshot?: OperatorEntitlementsSnapshot | null): boolean {
  if (!snapshot) return false;
  return navCanRenderWithoutWhoami({
    workspaceSlug: snapshot.workspaceSlug ?? null,
    workspaceType: snapshot.workspaceType ?? null,
    workspaceName: snapshot.workspaceName ?? null,
    enabledModules: snapshot.enabledModules ?? null,
  });
}

export function OperatorEntitlementsProvider({
  children,
  initialSnapshot,
}: {
  children: ReactNode;
  initialSnapshot?: OperatorEntitlementsSnapshot | null;
}) {
  const [state, setState] = useState<OperatorEntitlements>(() =>
    buildInitialEntitlementsState(initialSnapshot),
  );

  const load = useCallback(async () => {
    try {
      const hostSlug = readHostWorkspaceSlug();
      const data = await fetchCachedJson<WhoamiPayload>(
        scopedPlatformCacheKey(PLATFORM_CACHE_KEYS.whoami, hostSlug),
        "/api/auth/whoami",
        { ttlMs: 60_000 },
      );

      if (data.workspaceName?.trim()) {
        try {
          window.sessionStorage.setItem(
            "unit311-whoami-workspace-name",
            data.workspaceName.trim(),
          );
        } catch {
          /* ignore */
        }
      }

      setState(buildEntitlementsFromPayload(data, hostSlug, true));
    } catch {
      setState((current) => ({ ...current, ready: true }));
    }
  }, []);

  useEffect(() => {
    // SSR hydrated nav + permissions — skip duplicate whoami on first paint.
    if (
      serverSnapshotHydratesNav(initialSnapshot) &&
      serverSnapshotHydratesPermissions(initialSnapshot)
    ) {
      return;
    }
    void load();
  }, [load, initialSnapshot]);

  const value = useMemo(() => state, [state]);

  return (
    <OperatorEntitlementsContext.Provider value={value}>
      {children}
    </OperatorEntitlementsContext.Provider>
  );
}

export function useOperatorEntitlements() {
  return useContext(OperatorEntitlementsContext);
}

export function useCanAccessView(view: InternalOperationsView) {
  const { allowedViews, ready } = useOperatorEntitlements();
  if (!ready) return true;
  return isViewAllowedForGrants(view, allowedViews);
}
