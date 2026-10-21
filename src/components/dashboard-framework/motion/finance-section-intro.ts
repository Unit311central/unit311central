"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useFinanceMotionArmed, useFinanceVisitKey } from "./finance-living-motion-context";
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

export function useFinanceSectionIntro(sectionId: FinanceMotionSectionId) {
  const motionEnabled = useLivingMotionEnabled();
  const armed = useFinanceMotionArmed();
  const visitKey = useFinanceVisitKey();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [enteredView, setEnteredView] = useState(() => !motionEnabled);

  useLayoutEffect(() => {
    setEnteredView(!motionEnabled);
  }, [visitKey, motionEnabled]);

  useEffect(() => {
    if (!motionEnabled) return;
    if (!armed) return;
    const el = sectionRef.current;
    if (!el) return;

    const markEntered = () => setEnteredView(true);

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.14) {
          markEntered();
          io.disconnect();
        }
      },
      { threshold: [0.14, 0.28], rootMargin: "0px 0px -48px 0px" },
    );

    io.observe(el);

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh * 0.92 && rect.bottom > vh * 0.06) {
      markEntered();
      io.disconnect();
    }

    return () => io.disconnect();
  }, [motionEnabled, armed, visitKey, sectionId]);

  const introPending = motionEnabled && armed && enteredView;
  const playSectionIntro = useIntroAnimationLock(introPending, motionEnabled, visitKey);

  return {
    sectionRef,
    playSectionIntro,
    enteredView,
    sectionDataAttr: SECTION_SELECTOR[sectionId],
  };
}
