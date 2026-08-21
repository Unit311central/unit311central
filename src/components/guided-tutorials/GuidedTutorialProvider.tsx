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

import {
  GUIDED_TUTORIAL_EVENT,
  type GuidedTutorialClientAction,
} from "@/lib/guided-tutorials/client-actions";
import {
  buildTutorialContext,
  formatTutorialContextPath,
  type TutorialContext,
} from "@/lib/guided-tutorials/context";
import { tutorialProgressStore } from "@/lib/guided-tutorials/progress";
import { resolveTutorial } from "@/lib/guided-tutorials/client-resolver";
import { stepUsesDomHighlight } from "@/lib/guided-tutorials/step-presentation";
import { measureTutorialTarget } from "@/lib/guided-tutorials/targets";
import type { TutorialDefinition, TutorialResolution, TutorialStep } from "@/lib/guided-tutorials/types";
import { resolveBrowserTutorialWorkspaceSlug } from "@/lib/guided-tutorials/workspace-slug";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

export type GuidedTutorialPhase = "idle" | "active" | "complete";

type GuidedTutorialContextValue = {
  workspaceSlug: string;
  activeView: string;
  tabKey?: string;
  context: TutorialContext;
  contextPath: string;
  phase: GuidedTutorialPhase;
  resolution: TutorialResolution | null;
  tutorial: TutorialDefinition | null;
  steps: readonly TutorialStep[];
  stepIndex: number;
  currentStep: TutorialStep | null;
  highlightRect: DOMRect | null;
  isAvailable: boolean;
  unavailableMessage: string | null;
  openTutorial: () => void;
  closeTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTutorial: () => void;
};

const GuidedTutorialContext = createContext<GuidedTutorialContextValue | null>(null);

export function GuidedTutorialProvider({
  activeView,
  tabKey,
  userId,
  children,
}: {
  activeView: string;
  tabKey?: string;
  userId?: string | null;
  children: ReactNode;
}) {
  const [workspaceSlug, setWorkspaceSlug] = useState(INTERNAL_WORKSPACE_SLUG);
  const [phase, setPhase] = useState<GuidedTutorialPhase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [resolution, setResolution] = useState<TutorialResolution | null>(null);

  useEffect(() => {
    setWorkspaceSlug(resolveBrowserTutorialWorkspaceSlug());
  }, [activeView, tabKey]);

  const context = useMemo(
    () =>
      buildTutorialContext({
        workspaceSlug,
        viewId: activeView,
        tabKey,
      }),
    [activeView, tabKey, workspaceSlug],
  );

  const contextPath = useMemo(() => formatTutorialContextPath(context), [context]);

  const currentResolution = useMemo(
    () =>
      resolveTutorial({
        workspaceSlug,
        viewId: activeView,
        tabKey,
      }),
    [activeView, tabKey, workspaceSlug],
  );

  const tutorial = currentResolution.status === "available" ? currentResolution.tutorial : null;
  const steps = tutorial?.steps ?? [];
  const currentStep = steps[stepIndex] ?? null;

  const applyStepHighlight = useCallback((step: TutorialStep | null | undefined) => {
    if (!stepUsesDomHighlight(step)) {
      setHighlightRect(null);
      return;
    }
    const { rect } = measureTutorialTarget(step!.targetId);
    setHighlightRect(rect);
  }, []);

  const resetSession = useCallback(() => {
    setPhase("idle");
    setStepIndex(0);
    setHighlightRect(null);
    setResolution(null);
  }, []);

  const openTutorial = useCallback(() => {
    const nextResolution = resolveTutorial({
      workspaceSlug: resolveBrowserTutorialWorkspaceSlug(),
      viewId: activeView,
      tabKey,
    });
    setWorkspaceSlug(resolveBrowserTutorialWorkspaceSlug());
    setResolution(nextResolution);

    if (nextResolution.status !== "available") {
      setPhase("idle");
      setHighlightRect(null);
      return;
    }

    setStepIndex(0);
    setPhase("active");
    window.setTimeout(() => {
      applyStepHighlight(nextResolution.tutorial.steps[0]);
    }, 80);
  }, [activeView, applyStepHighlight, tabKey]);

  const closeTutorial = useCallback(() => {
    resetSession();
  }, [resetSession]);

  const completeTutorial = useCallback(() => {
    if (resolution?.status === "available") {
      tutorialProgressStore.markCompleted(
        resolution.tutorial.tutorialId,
        resolution.identity.workspaceSlug,
        userId,
      );
    }
    setPhase("complete");
    setHighlightRect(null);
  }, [resolution, userId]);

  const nextStep = useCallback(() => {
    if (!resolution || resolution.status !== "available") return;
    const total = resolution.tutorial.steps.length;
    const next = stepIndex + 1;
    if (next >= total) {
      completeTutorial();
      return;
    }
    setStepIndex(next);
    const step = resolution.tutorial.steps[next];
    window.setTimeout(() => applyStepHighlight(step), 40);
  }, [applyStepHighlight, completeTutorial, resolution, stepIndex]);

  const prevStep = useCallback(() => {
    if (!resolution || resolution.status !== "available") return;
    const prev = Math.max(0, stepIndex - 1);
    setStepIndex(prev);
    const step = resolution.tutorial.steps[prev];
    window.setTimeout(() => applyStepHighlight(step), 40);
  }, [applyStepHighlight, resolution, stepIndex]);

  useEffect(() => {
    const onAction = (event: Event) => {
      const detail = (event as CustomEvent<GuidedTutorialClientAction>).detail;
      if (!detail) return;
      if (detail.type === "start") {
        if (detail.viewId !== activeView) return;
        if (detail.tabKey && detail.tabKey !== tabKey) return;
        openTutorial();
      }
      if (detail.type === "stop") {
        closeTutorial();
      }
    };
    window.addEventListener(GUIDED_TUTORIAL_EVENT, onAction as EventListener);
    return () => window.removeEventListener(GUIDED_TUTORIAL_EVENT, onAction as EventListener);
  }, [activeView, closeTutorial, openTutorial, tabKey]);

  useEffect(() => {
    resetSession();
  }, [activeView, resetSession, tabKey, workspaceSlug]);

  useEffect(() => {
    if (phase !== "active") return;
    const onLayout = () => {
      if (stepUsesDomHighlight(currentStep)) applyStepHighlight(currentStep);
    };
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [applyStepHighlight, currentStep, phase]);

  const value = useMemo<GuidedTutorialContextValue>(
    () => ({
      workspaceSlug,
      activeView,
      tabKey,
      context,
      contextPath,
      phase,
      resolution: resolution ?? currentResolution,
      tutorial,
      steps,
      stepIndex,
      currentStep,
      highlightRect,
      isAvailable: currentResolution.status === "available",
      unavailableMessage:
        currentResolution.status === "unavailable" ? currentResolution.message : null,
      openTutorial,
      closeTutorial,
      nextStep,
      prevStep,
      completeTutorial,
    }),
    [
      activeView,
      closeTutorial,
      completeTutorial,
      currentResolution,
      currentStep,
      highlightRect,
      openTutorial,
      phase,
      prevStep,
      resolution,
      stepIndex,
      steps,
      tabKey,
      context,
      contextPath,
      tutorial,
      workspaceSlug,
      nextStep,
    ],
  );

  return (
    <GuidedTutorialContext.Provider value={value}>{children}</GuidedTutorialContext.Provider>
  );
}

export function useGuidedTutorial() {
  const ctx = useContext(GuidedTutorialContext);
  if (!ctx) {
    throw new Error("useGuidedTutorial must be used within GuidedTutorialProvider");
  }
  return ctx;
}

export function useOptionalGuidedTutorial() {
  return useContext(GuidedTutorialContext);
}
