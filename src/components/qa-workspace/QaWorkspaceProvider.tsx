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
import { usePathname, useSearchParams } from "next/navigation";

import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { resolveQaPageContext } from "@/lib/qa-workspace/page-context";
import { isBrowserTestWorkspaceSurface } from "@/lib/qa-workspace/surface";
import type { QaElementContext, QaPageContext } from "@/lib/qa-workspace/types";

import QaModeOverlay from "./QaModeOverlay";
import QaTaskDialog from "./QaTaskDialog";

type QaWorkspaceContextValue = {
  enabled: boolean;
  qaMode: boolean;
  setQaMode: (value: boolean) => void;
  pageContext: QaPageContext | null;
  openPageLevelTask: () => void;
};

const QaWorkspaceContext = createContext<QaWorkspaceContextValue>({
  enabled: false,
  qaMode: false,
  setQaMode: () => undefined,
  pageContext: null,
  openPageLevelTask: () => undefined,
});

export function useQaWorkspace() {
  return useContext(QaWorkspaceContext);
}

type QaWorkspaceProviderProps = {
  children: ReactNode;
  activeView?: InternalOperationsView;
  workspaceSlug?: string | null;
};

export default function QaWorkspaceProvider({
  children,
  activeView,
  workspaceSlug,
}: QaWorkspaceProviderProps) {
  const enabled =
    isBrowserTestWorkspaceSurface() || workspaceSlug?.trim().toLowerCase() === "test";
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const [qaMode, setQaMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [elementContext, setElementContext] = useState<QaElementContext | null>(null);

  const pageContext = useMemo(() => {
    if (!enabled || !activeView) return null;
    return resolveQaPageContext({
      activeView,
      pathname,
      search,
    });
  }, [enabled, activeView, pathname, search]);

  useEffect(() => {
    setQaMode(false);
    setDialogOpen(false);
    setElementContext(null);
  }, [activeView, pathname, search]);

  const openPageLevelTask = useCallback(() => {
    if (!enabled || !pageContext) return;
    setElementContext({
      elementLabel: "Page-level",
      elementType: "page",
      elementId: pageContext.pageViewId,
    });
    setDialogOpen(true);
  }, [enabled, pageContext]);

  const handleElementSelected = useCallback((context: QaElementContext) => {
    setElementContext(context);
    setDialogOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      qaMode,
      setQaMode,
      pageContext,
      openPageLevelTask,
    }),
    [enabled, qaMode, pageContext, openPageLevelTask],
  );

  return (
    <QaWorkspaceContext.Provider value={value}>
      {children}
      {enabled && qaMode && pageContext ? (
        <QaModeOverlay
          pageContext={pageContext}
          onElementSelected={handleElementSelected}
          onPageLevelTask={openPageLevelTask}
        />
      ) : null}
      {enabled && pageContext && elementContext ? (
        <QaTaskDialog
          open={dialogOpen}
          pageContext={pageContext}
          elementContext={elementContext}
          onClose={() => {
            setDialogOpen(false);
            setElementContext(null);
          }}
        />
      ) : null}
    </QaWorkspaceContext.Provider>
  );
}
