"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  useFinanceIntroComplete,
  useFinanceMotionArmed,
  useFinanceVisitKey,
} from "./finance-living-motion-context";
import { useIntroAnimationLock, useLivingMotionEnabled } from "./living-motion";

export type FinanceMotionSectionId =
  | "liquidity"
  | "ar-ageing"
  | "margin"
  | "revenue"
  | "ar-detail"
  | "payroll"
  | "cash-flow"
  | "cash-trajectory"
  | "monthly-revenue";

const SECTION_SELECTOR: Record<FinanceMotionSectionId, string> = {
  liquidity: "liquidity",
  "ar-ageing": "ar-ageing",
  margin: "margin",
  revenue: "revenue",
  "ar-detail": "ar-detail",
  payroll: "payroll",
  "cash-flow": "cash-flow",
  "cash-trajectory": "cash-trajectory",
  "monthly-revenue": "monthly-revenue",
};

const VIEW_RATIO = 0.18;

/**
 * Viewport-gated intro for Finance chart sections.
 * Does not mark entered until hero intro has finished and the section intersects the viewport
 * (IntersectionObserver only — no synchronous "already on screen" shortcut on arm).
 */
export function useFinanceSectionIntro(sectionId: FinanceMotionSectionId) {
  const motionEnabled = useLivingMotionEnabled();
  const armed = useFinanceMotionArmed();
  const { introComplete } = useFinanceIntroComplete();
  const visitKey = useFinanceVisitKey();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [enteredView, setEnteredView] = useState(() => !motionEnabled);

  useLayoutEffect(() => {
    setEnteredView(!motionEnabled);
  }, [visitKey, motionEnabled]);

  useEffect(() => {
    if (!motionEnabled) return;
    if (!armed || !introComplete) return;
    const el = sectionRef.current;
    if (!el) return;

    const markEntered = () => setEnteredView(true);

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && entry.intersectionRatio >= VIEW_RATIO) {
          markEntered();
          io.disconnect();
        }
      },
      { threshold: [VIEW_RATIO, VIEW_RATIO + 0.08], rootMargin: "0px 0px -12% 0px" },
    );

    io.observe(el);

    return () => io.disconnect();
  }, [motionEnabled, armed, introComplete, visitKey, sectionId]);

  const introPending = motionEnabled && armed && introComplete && enteredView;
  const playSectionIntro = useIntroAnimationLock(introPending, motionEnabled, visitKey);

  return {
    sectionRef,
    playSectionIntro,
    enteredView,
    sectionDataAttr: SECTION_SELECTOR[sectionId],
  };
}
