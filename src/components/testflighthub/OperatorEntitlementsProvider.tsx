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

import type { CommandCentreHomeTileId } from "@/lib/command-centre-home-tiles";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { isViewAllowedForGrants } from "@/lib/internal-role-views";
import { PLATFORM_CACHE_KEYS, fetchCachedJson } from "@/lib/platform-fetch-cache";
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
  enabledModules: string[] | null;
  enabledSubModules: string[] | null;
  ready: boolean;
};

const OperatorEntitlementsContext = createContext<OperatorEntitlements>({
  role: null,
  roles: [],
  department: null,
  departments: [],
  allowedViews: null,
  homeTiles: null,
  roleView: null,
  workspaceSlug: null,
  workspaceType: null,
  enabledModules: null,
  enabledSubModules: null,
  ready: false,
});

export function OperatorEntitlementsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OperatorEntitlements>({
    role: null,
    roles: [],
    department: null,
    departments: [],
    allowedViews: null,
    homeTiles: null,
    roleView: null,
    workspaceSlug: null,
    workspaceType: null,
    enabledModules: null,
    enabledSubModules: null,
    ready: false,
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchCachedJson<{
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
      }>(PLATFORM_CACHE_KEYS.whoami, "/api/auth/whoami", { ttlMs: 60_000 });

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

      const roles = (data.roles?.length ? data.roles : data.role ? [data.role] : []) as UserRole[];
      const departments = (data.departments?.length
        ? data.departments
        : data.department
          ? [data.department]
          : []) as UserDepartment[];
      const roleView =
        roles.length > 0
          ? mapUserRoleToInternalRoleView(primaryUserRole(roles))
          : null;

      setState({
        role: data.role ?? null,
        roles,
        department: data.department ?? null,
        departments,
        allowedViews: data.allowedViews ?? null,
        homeTiles: data.dashboardPrefs?.homeTiles ?? null,
        roleView,
        workspaceSlug: data.workspaceSlug ?? null,
        workspaceType: data.workspaceType ?? null,
        enabledModules: data.enabledModules ?? null,
        enabledSubModules: data.enabledSubModules ?? null,
        ready: true,
      });
    } catch {
      setState((current) => ({ ...current, ready: true }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
