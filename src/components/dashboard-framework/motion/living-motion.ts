"use client";

import { useEffect, useState } from "react";

export const LIVING_ENTER_DURATION = 0.45;
export const LIVING_STAGGER = 0.07;
export const LIVING_COUNT_UP_MS = 900;
export const LIVING_CHART_MS = 0.85;
export const LIVING_EASE = [0.22, 1, 0.36, 1] as const;

export function useLivingMotionEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);

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

export function livingEntranceProps(index: number, motionEnabled: boolean) {
  if (!motionEnabled) {
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
