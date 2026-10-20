"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useLivingHomeIntroComplete,
  useLivingHomeMotionArmed,
  useLivingHomeMotionPaneActive,
} from "./living-motion-context";

export const LIVING_ENTER_DURATION = 0.45;
export const LIVING_STAGGER = 0.07;
export const LIVING_COUNT_UP_MS = 1200;
export const LIVING_CHART_MS = 0.85;
export const LIVING_BAR_STAGGER_MAX_S = 0.72;
export const LIVING_EASE = [0.22, 1, 0.36, 1] as const;

/** @deprecated Session storage is no longer used to gate intro playback. */
export {
  HOME_LIVING_INTRO_CHANGED_EVENT,
  HOME_LIVING_INTRO_SESSION_KEY,
  markHomeLivingIntroPlayed,
  readHomeLivingIntroPlayed,
} from "./living-motion-session";

function readLivingMotionEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useLivingMotionEnabled(): boolean {
  const [enabled, setEnabled] = useState(readLivingMotionEnabled);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return enabled;
}

export function useHomeLivingIntroPending(): {
  introPending: boolean;
  completeIntro: () => void;
} {
  const motionEnabled = useLivingMotionEnabled();
  const armed = useLivingHomeMotionArmed();
  const paneActive = useLivingHomeMotionPaneActive();
  const { introComplete, markIntroComplete } = useLivingHomeIntroComplete();

  useEffect(() => {
    if (motionEnabled) return;
    if (!introComplete) markIntroComplete();
  }, [motionEnabled, introComplete, markIntroComplete]);

  const introPending = motionEnabled && armed && paneActive && !introComplete;

  const completeIntro = useCallback(() => {
    markIntroComplete();
  }, [markIntroComplete]);

  return { introPending, completeIntro };
}

/** One intro playback window — long enough for KPI count-up, card stagger, and chart bars. */
export function estimateHomeLivingIntroPlaybackMs(): number {
  const chartMs = LIVING_CHART_MS * 1000;
  return Math.ceil(
    LIVING_COUNT_UP_MS + LIVING_STAGGER * 6 + chartMs + LIVING_BAR_STAGGER_MAX_S * 1000 + 120,
  );
}

/** Lock whether this instance should run intro motion on first mount (avoids mid-draw snaps). */
export function useIntroAnimationLock(introPending: boolean, motionEnabled: boolean): boolean {
  const locked = useRef<boolean | null>(null);
  if (locked.current === null) {
    locked.current = motionEnabled && introPending;
  }
  return locked.current;
}

export function HomeLivingIntroScheduler() {
  const { introPending, completeIntro } = useHomeLivingIntroPending();

  useEffect(() => {
    if (!introPending) return;
    const timeout = window.setTimeout(() => completeIntro(), estimateHomeLivingIntroPlaybackMs());
    return () => window.clearTimeout(timeout);
  }, [introPending, completeIntro]);

  return null;
}

export function livingEntranceProps(index: number, motionEnabled: boolean, introPending: boolean) {
  if (!motionEnabled || !introPending) {
    return { initial: false as const, animate: { opacity: 1, y: 0, scale: 1 } };
  }
  return {
    initial: { opacity: 0, y: 14, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: LIVING_ENTER_DURATION,
      delay: index * LIVING_STAGGER,
      ease: LIVING_EASE,
    },
  };
}
