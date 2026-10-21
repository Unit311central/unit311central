"use client";

import { useEffect, useRef, useState } from "react";

import {
  useLivingHomeMotionArmed,
  useLivingHomeMotionPaneActive,
  useLivingHomeVisitKey,
} from "./living-motion-context";
import { useIntroAnimationLock, useLivingMotionEnabled } from "./living-motion";

export type HomeMotionSectionId = "performance" | "activity" | "queue";

const SECTION_SELECTOR: Record<HomeMotionSectionId, string> = {
  performance: "performance",
  activity: "activity",
  queue: "queue",
};

/**
 * Viewport-gated intro for below-the-fold Home sections.
 * Fires once per visit until replay bumps homeVisitKey.
 */
export function useHomeSectionIntro(sectionId: HomeMotionSectionId) {
  const motionEnabled = useLivingMotionEnabled();
  const armed = useLivingHomeMotionArmed();
  const paneActive = useLivingHomeMotionPaneActive();
  const visitKey = useLivingHomeVisitKey();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [enteredView, setEnteredView] = useState(() => !motionEnabled);

  useEffect(() => {
    setEnteredView(!motionEnabled);
  }, [visitKey, motionEnabled]);

  useEffect(() => {
    if (!motionEnabled) return;
    if (!armed || !paneActive) return;
    const el = sectionRef.current;
    if (!el) return;

    const markEntered = () => {
      setEnteredView(true);
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.22) {
          markEntered();
          io.disconnect();
        }
      },
      { threshold: [0.22, 0.35], rootMargin: "0px 0px -48px 0px" },
    );

    io.observe(el);

    return () => io.disconnect();
  }, [motionEnabled, armed, paneActive, visitKey, sectionId]);

  const introPending = motionEnabled && armed && paneActive && enteredView;
  const playSectionIntro = useIntroAnimationLock(introPending, motionEnabled, visitKey);

  return {
    sectionRef,
    playSectionIntro,
    enteredView,
    sectionDataAttr: SECTION_SELECTOR[sectionId],
  };
}
