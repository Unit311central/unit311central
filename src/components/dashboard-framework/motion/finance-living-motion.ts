"use client";

import { useCallback, useEffect } from "react";

import { FINANCE_HERO_TOTAL_MS } from "./finance-intro-schedule";
import {
  useFinanceIntroComplete,
  useFinanceMotionArmed,
} from "./finance-living-motion-context";
import { useLivingMotionEnabled } from "./living-motion";

export { useFinanceSectionIntro } from "./finance-section-intro";
export type { FinanceMotionSectionId } from "./finance-section-intro";

export function useFinanceHeroIntroPending(): {
  heroIntroPending: boolean;
  completeHeroIntro: () => void;
} {
  const motionEnabled = useLivingMotionEnabled();
  const armed = useFinanceMotionArmed();
  const { introComplete, markIntroComplete } = useFinanceIntroComplete();

  useEffect(() => {
    if (motionEnabled) return;
    if (!introComplete) markIntroComplete();
  }, [motionEnabled, introComplete, markIntroComplete]);

  const heroIntroPending = motionEnabled && armed && !introComplete;

  const completeHeroIntro = useCallback(() => {
    markIntroComplete();
  }, [markIntroComplete]);

  return { heroIntroPending, completeHeroIntro };
}

export function FinanceLivingIntroScheduler() {
  const { heroIntroPending, completeHeroIntro } = useFinanceHeroIntroPending();

  useEffect(() => {
    if (!heroIntroPending) return;
    const timeout = window.setTimeout(() => completeHeroIntro(), FINANCE_HERO_TOTAL_MS);
    return () => window.clearTimeout(timeout);
  }, [heroIntroPending, completeHeroIntro]);

  return null;
}

export function financeHeroEntranceProps(
  index: number,
  motionEnabled: boolean,
  heroIntroPending: boolean,
) {
  if (!motionEnabled || !heroIntroPending) {
    return { initial: false as const, animate: { opacity: 1, y: 0 } };
  }
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.48,
      delay: index === 0 ? 0.08 : 0.28 + (index - 1) * 0.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  };
}
