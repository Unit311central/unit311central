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
import {
  isBrowserInterfaceWorxQaSurface,
  isBrowserTestWorkspaceSurface,
  isQaBetaWorkspaceSlug,
  isQaEnabledWorkspaceSlug,
} from "@/lib/qa-workspace/surface";
import type { QaPageContext, QaTaskCaptureContext } from "@/lib/qa-workspace/types";

import QaBetaReportDialog, { QaBetaReportFab } from "./QaBetaReportDialog";
import QaModeOverlay from "./QaModeOverlay";
import QaTaskDialog from "./QaTaskDialog";

type QaWorkspaceContextValue = {
  enabled: boolean;
  betaMode: boolean;
  qaMode: boolean;
  setQaMode: (value: boolean) => void;
  pageContext: QaPageContext | null;
  openPageLevelTask: () => void;
  openModuleLevelTask: () => void;
  openWorkspaceLevelTask: () => void;
  openBetaReport: () => void;
};

const QaWorkspaceContext = createContext<QaWorkspaceContextValue>({
  enabled: false,
  betaMode: false,
  qaMode: false,
  setQaMode: () => undefined,
  pageContext: null,
  openPageLevelTask: () => undefined,
  openModuleLevelTask: () => undefined,
  openWorkspaceLevelTask: () => undefined,
  openBetaReport: () => undefined,
});

export function useQaWorkspace() {
  return useContext(QaWorkspaceContext);
}

function qaModeStorageKey(workspaceSlug: string | null | undefined): string | null {
  const slug = String(workspaceSlug ?? "").trim().toLowerCase();
  if (!slug) return null;
  return `qa-mode:${slug}`;
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
  const slug = workspaceSlug?.trim().toLowerCase() ?? "";
  const enabled =
    isQaEnabledWorkspaceSlug(slug) ||
    isBrowserTestWorkspaceSurface() ||
    isBrowserInterfaceWorxQaSurface();
  const betaMode = isQaBetaWorkspaceSlug(slug) || isBrowserInterfaceWorxQaSurface();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const [qaMode, setQaModeState] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [betaDialogOpen, setBetaDialogOpen] = useState(false);
  const [captureContext, setCaptureContext] = useState<QaTaskCaptureContext | null>(null);

  const pageContext = useMemo(() => {
    if (!enabled || !activeView) return null;
    return resolveQaPageContext({
      activeView,
      pathname,
      search,
    });
  }, [enabled, activeView, pathname, search]);

  const setQaMode = useCallback(
    (value: boolean) => {
      setQaModeState(value);
      const key = qaModeStorageKey(slug);
      if (key && typeof window !== "undefined") {
        window.localStorage.setItem(key, value ? "1" : "0");
      }
    },
    [slug],
  );

  useEffect(() => {
    const key = qaModeStorageKey(slug);
    if (!key || typeof window === "undefined") return;
    setQaModeState(window.localStorage.getItem(key) === "1");
  }, [slug]);

  useEffect(() => {
    if (!qaMode) {
      setDialogOpen(false);
      setBetaDialogOpen(false);
      setCaptureContext(null);
    }
  }, [qaMode]);

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

  const openBetaReport = useCallback(() => {
    if (!enabled || !betaMode || !pageContext) return;
    setBetaDialogOpen(true);
  }, [enabled, betaMode, pageContext]);

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
      betaMode,
      qaMode,
      setQaMode,
      pageContext,
      openPageLevelTask,
      openModuleLevelTask,
      openWorkspaceLevelTask,
      openBetaReport,
    }),
    [
      enabled,
      betaMode,
      qaMode,
      setQaMode,
      pageContext,
      openPageLevelTask,
      openModuleLevelTask,
      openWorkspaceLevelTask,
      openBetaReport,
    ],
  );

  return (
    <QaWorkspaceContext.Provider value={value}>
      {children}
      {enabled && qaMode && !betaMode && pageContext ? (
        <QaModeOverlay
          onElementSelected={handleElementSelected}
          onPageLevelTask={openPageLevelTask}
          onModuleLevelTask={openModuleLevelTask}
          onWorkspaceLevelTask={openWorkspaceLevelTask}
        />
      ) : null}
      {enabled && qaMode && betaMode && activeView !== "qa-tasks" ? (
        <div
          data-qa-overlay
          className="pointer-events-none fixed bottom-5 right-5 z-[80] flex justify-end"
        >
          <QaBetaReportFab onClick={openBetaReport} />
        </div>
      ) : null}
      {enabled && !betaMode && captureContext ? (
        <QaTaskDialog
          open={dialogOpen}
          captureContext={captureContext}
          onClose={() => {
            setDialogOpen(false);
            setCaptureContext(null);
          }}
        />
      ) : null}
      {enabled && betaMode && pageContext ? (
        <QaBetaReportDialog
          open={betaDialogOpen}
          pageContext={pageContext}
          onClose={() => setBetaDialogOpen(false)}
        />
      ) : null}
    </QaWorkspaceContext.Provider>
  );
}
