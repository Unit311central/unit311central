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

export type OperatorEntitlements = {
  role: string | null;
  department: string | null;
  allowedViews: InternalOperationsView[] | null;
  homeTiles: CommandCentreHomeTileId[] | null;
  ready: boolean;
};

const OperatorEntitlementsContext = createContext<OperatorEntitlements>({
  role: null,
  department: null,
  allowedViews: null,
  homeTiles: null,
  ready: false,
});

export function OperatorEntitlementsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OperatorEntitlements>({
    role: null,
    department: null,
    allowedViews: null,
    homeTiles: null,
    ready: false,
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchCachedJson<{
        role?: string | null;
        department?: string | null;
        allowedViews?: InternalOperationsView[] | null;
        dashboardPrefs?: { homeTiles?: CommandCentreHomeTileId[] } | null;
      }>(PLATFORM_CACHE_KEYS.whoami, "/api/auth/whoami", { ttlMs: 60_000 });

      setState({
        role: data.role ?? null,
        department: data.department ?? null,
        allowedViews: data.allowedViews ?? null,
        homeTiles: data.dashboardPrefs?.homeTiles ?? null,
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
