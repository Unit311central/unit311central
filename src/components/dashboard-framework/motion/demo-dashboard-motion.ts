"use client";

import { useEffect, useMemo, useState } from "react";

import { useDemoDashboardMotionContext } from "./demo-dashboard-motion-context";
import {
  LIVING_EASE,
  LIVING_ENTER_DURATION,
  LIVING_STAGGER,
  useIntroAnimationLock,
  useLivingMotionEnabled,
} from "./living-motion";
import { useDemoClientMotionArmed } from "./use-demo-client-armed";

export const DEMO_DASHBOARD_INTRO_MS = 2800;
export const DEMO_CHART_ANIMATION_MS = 560;
export const DEMO_CONTENT_CHART_MS = 320;
export const DEMO_CHART_INTRO_GRACE_MS = 1600;

export function useDemoDashboardMotionArmed(): boolean {
  const ctx = useDemoDashboardMotionContext();
  const clientArmed = useDemoClientMotionArmed();
  return Boolean(ctx?.armed && clientArmed);
}

export function useDemoDashboardIntroPending(): boolean {
  const ctx = useDemoDashboardMotionContext();
  const armed = useDemoDashboardMotionArmed();
  if (!ctx || !armed) return false;
  return !ctx.introComplete;
}

export function useDemoDashboardChartIntroActive(): boolean {
  const ctx = useDemoDashboardMotionContext();
  const armed = useDemoDashboardMotionArmed();
  const motionEnabled = useLivingMotionEnabled();
  const introPending = useDemoDashboardIntroPending();
  const visitKey = ctx?.visitKey ?? 0;
  const latched = useIntroAnimationLock(introPending, armed && motionEnabled, visitKey);
  const [graceActive, setGraceActive] = useState(false);

  useEffect(() => {
    if (!armed || !motionEnabled) {
      setGraceActive(false);
      return;
    }
    if (introPending) {
      setGraceActive(true);
      return;
    }
    const endedAt = ctx?.introEndedAtMs;
    if (!endedAt) {
      setGraceActive(false);
      return;
    }
    setGraceActive(true);
    const remaining = DEMO_CHART_INTRO_GRACE_MS - (Date.now() - endedAt);
    const timeout = window.setTimeout(() => setGraceActive(false), Math.max(0, remaining));
    return () => window.clearTimeout(timeout);
  }, [armed, motionEnabled, introPending, ctx?.introEndedAtMs, visitKey]);

  return latched || graceActive;
}

export function DemoDashboardIntroScheduler() {
  const ctx = useDemoDashboardMotionContext();
  const pending = useDemoDashboardIntroPending();
  const visitKey = ctx?.visitKey ?? 0;
  const markIntroComplete = ctx?.markIntroComplete;

  useEffect(() => {
    if (!pending || !markIntroComplete) return;
    const timeout = window.setTimeout(() => markIntroComplete(), DEMO_DASHBOARD_INTRO_MS);
    return () => window.clearTimeout(timeout);
  }, [pending, visitKey, markIntroComplete]);

  return null;
}

export function demoDashboardEntranceProps(index: number, introPending: boolean, motionEnabled: boolean) {
  if (!motionEnabled || !introPending) {
    return { initial: false as const, animate: { opacity: 1, y: 0, scale: 1 } };
  }
  return {
    initial: { opacity: 0, y: 12, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: LIVING_ENTER_DURATION,
      delay: index * LIVING_STAGGER,
      ease: LIVING_EASE,
    },
  };
}

export function useDemoRechartsMotion(chartIndex = 0): {
  isAnimationActive: boolean;
  animationDuration: number;
  animationBegin: number;
} {
  const motionEnabled = useLivingMotionEnabled();
  const chartIntroActive = useDemoDashboardChartIntroActive();
  const ctx = useDemoDashboardMotionContext();
  const armed = useDemoDashboardMotionArmed();

  return useMemo(() => {
    if (!armed || !motionEnabled) {
      return { isAnimationActive: false, animationDuration: 0, animationBegin: 0 };
    }
    if (chartIntroActive) {
      return {
        isAnimationActive: true,
        animationDuration: DEMO_CHART_ANIMATION_MS,
        animationBegin: chartIndex * 90,
      };
    }
    if (ctx && ctx.contentEpoch > 0) {
      return {
        isAnimationActive: true,
        animationDuration: DEMO_CONTENT_CHART_MS,
        animationBegin: 0,
      };
    }
    return { isAnimationActive: false, animationDuration: 0, animationBegin: 0 };
  }, [armed, motionEnabled, chartIntroActive, chartIndex, ctx?.contentEpoch]);
}
