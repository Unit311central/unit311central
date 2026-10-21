"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  useLivingHomeIntroComplete,
  useLivingHomeMotionArmed,
  useLivingHomeMotionPaneActive,
} from "./living-motion-context";

import {
  HOME_INTRO_CHART_BAR_MS,
  HOME_INTRO_COUNT_UP_MS,
  HOME_INTRO_TOTAL_MS,
} from "./home-intro-schedule";

export const LIVING_ENTER_DURATION = 0.5;
export const LIVING_STAGGER = 0.09;
export const LIVING_COUNT_UP_MS = HOME_INTRO_COUNT_UP_MS;
export const LIVING_CHART_MS = HOME_INTRO_CHART_BAR_MS;
export const LIVING_BAR_STAGGER_MAX_S = 0.85;
export const LIVING_EASE = [0.22, 1, 0.36, 1] as const;

export { HOME_INTRO_TOTAL_MS, homeIntroDelayMs, homeIntroDelaySec } from "./home-intro-schedule";
export type { HomeIntroLane } from "./home-intro-schedule";

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

/** One intro playback window — KPI count-up, trend line, bars, queue (≈3–5s story). */
export function estimateHomeLivingIntroPlaybackMs(): number {
  return HOME_INTRO_TOTAL_MS;
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
