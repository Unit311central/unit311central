"use client";

import { startTransition, useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TutorialShellButton from "@/components/guided-tutorials/TutorialShellButton";
import { Menu, Sparkles, X } from "lucide-react";
import {
  getInternalNavBreadcrumb,
  isInternalOperationsView,
  resolveInternalNavSectionAccent,
  resolveInternalViewTitles,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { isDemoDomainHost, isInternalDomainHost } from "@/lib/app-domains";
import { isBrowserCorpCentreSurface } from "@/lib/corpcentre-surface";
import {
  isBrowserOnwardAirSurface,
  ONWARDAIR_EA_ACCENT,
  ONWARDAIR_HOME_ACCENT,
} from "@/lib/onwardair-surface";
import { PLATFORM_AI_ASSISTANT_VISIBLE } from "@/lib/product-surface-flags";
import { cn } from "@/lib/utils";
import {
  resolveBrowserWorkspaceAssistantButtonLabel,
  resolveBrowserWorkspaceProductName,
} from "@/lib/workspace-brand";
import {
  surveyViewTitles,
  type SurveyOperationsBasePath,
  type SurveyOperationsView,
} from "@/lib/survey-operations-mock-data";

import PlatformFloatingAiAssistant from "./PlatformFloatingAiAssistant";
import PlatformThemeProvider from "./PlatformThemeProvider";
import SurveyOperationsSidebar from "./SurveyOperationsSidebar";
import { WorkspaceBreadcrumb } from "./workspace-chrome";
import { prefetchViewOnIntent } from "@/lib/workspace-prefetch";
import DemoWorkspacePreviewSwitcher from "@/components/demo/DemoWorkspacePreviewSwitcher";
import { demoPreviewWorkspaceLabel, readBrowserDemoPreviewSlug } from "@/lib/demo/workspace-preview";
import QaWorkspaceProvider from "@/components/qa-workspace/QaWorkspaceProvider";
import QaModeButton from "@/components/qa-workspace/QaModeButton";
import { useOperatorEntitlements } from "./OperatorEntitlementsProvider";

type SurveyOperationsShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  mode?: "survey" | "internal";
  activeView?: SurveyOperationsView | InternalOperationsView;
  onViewChange?: (view: SurveyOperationsView | InternalOperationsView, query?: Record<string, string>) => void;
  basePath?: SurveyOperationsBasePath;
};

export default function SurveyOperationsShell({
  children,
  title = "Operations Dashboard",
  subtitle = "Survey Operations",
  mode = "survey",
  activeView,
  onViewChange,
  basePath = "/testflighthub",
}: SurveyOperationsShellProps) {
  const { workspaceSlug } = useOperatorEntitlements();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const [isInternalHost] = useState(() => {
    if (typeof window === "undefined") return true;
    const host = window.location.hostname;
    if (isInternalDomainHost(host) || isDemoDomainHost(host)) return true;
    if (host === "localhost" || host === "127.0.0.1") {
      return !host.includes(".") || host === "localhost";
    }
    return false;
  });
  const [isDemoHost] = useState(() => {
    if (typeof window === "undefined") return false;
    return isDemoDomainHost(window.location.hostname);
  });
  const [demoPreviewLabel, setDemoPreviewLabel] = useState<string | null>(null);
  const [isCorpCentre] = useState(() => {
    if (typeof window === "undefined") return false;
    return isBrowserCorpCentreSurface();
  });
  const [assistantButtonLabel, setAssistantButtonLabel] = useState("Assistant");
  const [assistantProductName, setAssistantProductName] = useState("");

  useLayoutEffect(() => {
    setAssistantProductName(resolveBrowserWorkspaceProductName());
    setAssistantButtonLabel(resolveBrowserWorkspaceAssistantButtonLabel());
  }, [demoPreviewLabel]);

  useEffect(() => {
    if (!isDemoHost) return;
    const preview = readBrowserDemoPreviewSlug();
    setDemoPreviewLabel(preview === "demo" ? null : demoPreviewWorkspaceLabel(preview));
  }, [isDemoHost]);

  useEffect(() => {
    startTransition(() => {
      setMobileNavOpen(false);
    });
  }, [pathname, activeView]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  const resolvedTitle =
    activeView != null
      ? mode === "internal" && isInternalOperationsView(activeView)
        ? activeView === "billing" && !isInternalHost
          ? "Billing"
          : resolveInternalViewTitles(activeView).title
        : surveyViewTitles[activeView as SurveyOperationsView].title
      : title;
  const resolvedSubtitle =
    activeView != null
      ? mode === "internal" && isInternalOperationsView(activeView)
        ? activeView === "billing" && !isInternalHost
          ? "Your subscription"
          : resolveInternalViewTitles(activeView).subtitle
        : surveyViewTitles[activeView as SurveyOperationsView].subtitle
      : subtitle;

  const showPlatformAi = PLATFORM_AI_ASSISTANT_VISIBLE && mode === "internal";

  const breadcrumbCrumbs =
    mode === "internal" &&
    activeView != null &&
    isInternalOperationsView(activeView)
      ? getInternalNavBreadcrumb(activeView)
      : null;

  const sectionAccent =
    mode === "internal" &&
    activeView != null &&
    isInternalOperationsView(activeView)
      ? activeView === "home" && isBrowserOnwardAirSurface()
        ? ONWARDAIR_HOME_ACCENT
        : activeView === "executive-assistant" && isBrowserOnwardAirSurface()
          ? ONWARDAIR_EA_ACCENT
          : resolveInternalNavSectionAccent(activeView)
      : null;

  const shell = (
    <div
      className="flex h-full min-h-0 w-full min-w-0"
      style={{ background: "var(--platform-background, #050B16)" }}
    >
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 touch-manipulation backdrop-blur-sm lg:hidden"
          style={{ background: "color-mix(in srgb, var(--platform-surface, #08111F) 80%, transparent)" }}
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <SurveyOperationsSidebar
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        mode={mode}
        activeView={activeView}
        onViewChange={onViewChange}
        basePath={basePath}
        onPrefetchView={(view) => prefetchViewOnIntent(view)}
      />

      <div
        className="relative flex min-h-0 min-w-0 flex-1 flex-col"
        style={{ background: "var(--platform-surface-elevated, #0B1524)" }}
      >
        {mode === "internal" ? (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(ellipse at top, color-mix(in srgb, var(--platform-accent, #2F80ED) 12%, transparent), transparent 55%), linear-gradient(180deg, var(--platform-surface-elevated, #0B1524) 0%, var(--platform-background, #050B16) 100%)",
            }}
            aria-hidden
          />
        ) : null}

        <header
          data-ai-target="page-header"
          className="safe-area-px relative z-10 shrink-0 border-b px-2 backdrop-blur-md max-md:backdrop-blur-none sm:px-4 md:px-5 lg:px-8 lg:backdrop-blur-xl"
          style={{
            borderColor: "color-mix(in srgb, var(--platform-card-border, #243347) 70%, transparent)",
            background: "color-mix(in srgb, var(--platform-surface, #08111F) 82%, transparent)",
          }}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-between gap-3",
              sectionAccent ? "min-h-14 py-2.5 xl:min-h-[4.25rem]" : "h-14 xl:h-16",
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border text-white/60 lg:hidden"
                style={{ borderColor: "var(--platform-card-border, #243347)" }}
                aria-label="Open navigation menu"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                {breadcrumbCrumbs && breadcrumbCrumbs.length > 0 ? (
                  <WorkspaceBreadcrumb crumbs={breadcrumbCrumbs} />
                ) : resolvedSubtitle ? (
                  <WorkspaceBreadcrumb crumbs={[resolvedSubtitle]} />
                ) : null}
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-base font-semibold tracking-tight text-white sm:text-lg md:text-xl">
                    {resolvedTitle}
                  </h1>
                  {isDemoHost ? (
                    <span
                      className="shrink-0 rounded border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-200"
                      title="Demo surface — same build as Internal; curated workspace content"
                    >
                      {demoPreviewLabel ? `Demo · ${demoPreviewLabel}` : "Demo"}
                    </span>
                  ) : null}
                </div>
                {sectionAccent ? (
                  <span
                    className="mt-2 block h-[3px] w-3/4 max-w-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${sectionAccent} 0%, ${sectionAccent} 38%, color-mix(in srgb, ${sectionAccent} 60%, transparent) 62%, transparent 100%)`,
                      boxShadow: `0 0 16px color-mix(in srgb, ${sectionAccent} 45%, transparent)`,
                    }}
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>

            <div className="relative flex shrink-0 items-center gap-2">
              <QaModeButton />
              {showPlatformAi ? (
                <>
                  {isDemoHost && activeView === "home" ? <DemoWorkspacePreviewSwitcher /> : null}
                  <TutorialShellButton />
                  <button
                    type="button"
                    data-ai-target="ai-assistant"
                    aria-label={`Open ${assistantButtonLabel}`}
                    aria-expanded={assistantOpen}
                    onClick={() => setAssistantOpen(true)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-xl border text-[11px] font-semibold transition-colors",
                      isCorpCentre ? "px-2.5 lg:px-2.5" : "px-2.5",
                      isCorpCentre && "h-10 w-10 justify-center px-0 lg:h-9 lg:w-auto lg:justify-start lg:px-2.5",
                    )}
                    style={{
                      borderColor: "color-mix(in srgb, var(--platform-accent, #2F80ED) 40%, transparent)",
                      background: "color-mix(in srgb, var(--platform-accent, #2F80ED) 14%, transparent)",
                      color: "color-mix(in srgb, var(--platform-accent, #2F80ED) 85%, white)",
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span className={cn("hidden max-w-[10rem] truncate sm:inline", isCorpCentre && "lg:inline")}>
                      {assistantButtonLabel}
                    </span>
                    <span className={cn("sm:hidden", isCorpCentre && "hidden")}>
                      {assistantProductName || "AI"}
                    </span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <div
          data-ai-target="page-main"
          className="safe-area-pb relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-2 py-2 sm:px-3 sm:py-3 md:px-4 [-webkit-overflow-scrolling:touch]"
        >
          {children}
        </div>
      </div>

      <PlatformFloatingAiAssistant
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        activeView={activeView}
        mode={mode}
      />
    </div>
  );

  return (
    <PlatformThemeProvider>
      <QaWorkspaceProvider
        activeView={activeView as InternalOperationsView | undefined}
        workspaceSlug={workspaceSlug}
      >
        {shell}
      </QaWorkspaceProvider>
    </PlatformThemeProvider>
  );
}
