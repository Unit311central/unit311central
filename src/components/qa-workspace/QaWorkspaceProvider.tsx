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
import {
  buildElementCapture,
  buildModuleCapture,
  buildPageCapture,
  buildWorkspaceCapture,
} from "@/lib/qa-workspace/scope";
import { isBrowserTestWorkspaceSurface } from "@/lib/qa-workspace/surface";
import type { QaPageContext, QaTaskCaptureContext } from "@/lib/qa-workspace/types";

import QaModeOverlay from "./QaModeOverlay";
import QaTaskDialog from "./QaTaskDialog";

type QaWorkspaceContextValue = {
  enabled: boolean;
  qaMode: boolean;
  setQaMode: (value: boolean) => void;
  pageContext: QaPageContext | null;
  openPageLevelTask: () => void;
  openModuleLevelTask: () => void;
  openWorkspaceLevelTask: () => void;
};

const QaWorkspaceContext = createContext<QaWorkspaceContextValue>({
  enabled: false,
  qaMode: false,
  setQaMode: () => undefined,
  pageContext: null,
  openPageLevelTask: () => undefined,
  openModuleLevelTask: () => undefined,
  openWorkspaceLevelTask: () => undefined,
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
  const [captureContext, setCaptureContext] = useState<QaTaskCaptureContext | null>(null);

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
    setCaptureContext(null);
  }, [activeView, pathname, search]);

  const openCapture = useCallback(
    (context: QaTaskCaptureContext) => {
      if (!enabled) return;
      setCaptureContext(context);
      setDialogOpen(true);
    },
    [enabled],
  );

  const openPageLevelTask = useCallback(() => {
    if (!pageContext) return;
    openCapture(buildPageCapture(pageContext));
  }, [openCapture, pageContext]);

  const openModuleLevelTask = useCallback(() => {
    if (!pageContext) return;
    openCapture(buildModuleCapture(pageContext));
  }, [openCapture, pageContext]);

  const openWorkspaceLevelTask = useCallback(() => {
    if (!pageContext) return;
    openCapture(buildWorkspaceCapture(pageContext));
  }, [openCapture, pageContext]);

  const handleElementSelected = useCallback(
    (elementContext: Parameters<typeof buildElementCapture>[1]) => {
      if (!pageContext) return;
      openCapture(buildElementCapture(pageContext, elementContext));
    },
    [openCapture, pageContext],
  );

  const value = useMemo(
    () => ({
      enabled,
      qaMode,
      setQaMode,
      pageContext,
      openPageLevelTask,
      openModuleLevelTask,
      openWorkspaceLevelTask,
    }),
    [enabled, qaMode, pageContext, openPageLevelTask, openModuleLevelTask, openWorkspaceLevelTask],
  );

  return (
    <QaWorkspaceContext.Provider value={value}>
      {children}
      {enabled && qaMode && pageContext ? (
        <QaModeOverlay
          onElementSelected={handleElementSelected}
          onPageLevelTask={openPageLevelTask}
          onModuleLevelTask={openModuleLevelTask}
          onWorkspaceLevelTask={openWorkspaceLevelTask}
        />
      ) : null}
      {enabled && captureContext ? (
        <QaTaskDialog
          open={dialogOpen}
          captureContext={captureContext}
          onClose={() => {
            setDialogOpen(false);
            setCaptureContext(null);
          }}
        />
      ) : null}
    </QaWorkspaceContext.Provider>
  );
}
