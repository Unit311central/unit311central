"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useLivingHomeMotionArmed } from "./living-motion-context";

export const LIVING_ENTER_DURATION = 0.45;
export const LIVING_STAGGER = 0.07;
export const LIVING_COUNT_UP_MS = 1000;
export const LIVING_CHART_MS = 0.85;
export const LIVING_BAR_STAGGER_MAX_S = 0.72;
export const LIVING_EASE = [0.22, 1, 0.36, 1] as const;

import {
  HOME_LIVING_INTRO_CHANGED_EVENT,
  markHomeLivingIntroPlayed,
  readHomeLivingIntroPlayed,
} from "./living-motion-session";

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
  const [sessionRevision, setSessionRevision] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setSessionRevision((n) => n + 1);
    window.addEventListener(HOME_LIVING_INTRO_CHANGED_EVENT, sync);
    return () => window.removeEventListener(HOME_LIVING_INTRO_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    if (motionEnabled) return;
    if (!readHomeLivingIntroPlayed()) markHomeLivingIntroPlayed();
  }, [motionEnabled]);

  void sessionRevision;
  const armed = useLivingHomeMotionArmed();
  const introPending = motionEnabled && armed && !readHomeLivingIntroPlayed();

  const completeIntro = useCallback(() => {
    markHomeLivingIntroPlayed();
  }, []);

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
