"use client";

import { motion } from "framer-motion";

import { homeIntroDelaySec } from "./home-intro-schedule";
import {
  LIVING_CHART_MS,
  useHomeLivingIntroPending,
  useIntroAnimationLock,
  useLivingMotionEnabled,
} from "./living-motion";

type AnimatedMetricRingProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  laneIndex?: number;
};

export function AnimatedMetricRing({
  value,
  max = 10,
  size = 44,
  strokeWidth = 3,
  laneIndex = 0,
}: AnimatedMetricRingProps) {
  const motionEnabled = useLivingMotionEnabled();
  const { introPending } = useHomeLivingIntroPending();
  const playIntro = useIntroAnimationLock(introPending, motionEnabled);
  const animateRing = playIntro;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const targetOffset = circumference * (1 - ratio);

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="color-mix(in srgb, white 12%, transparent)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--platform-accent, #2F80ED)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={animateRing ? { strokeDashoffset: circumference } : false}
        animate={{ strokeDashoffset: targetOffset }}
        transition={
          animateRing
            ? {
                duration: LIVING_CHART_MS * 1.4,
                delay: homeIntroDelaySec("ai-metric", laneIndex),
                ease: [0.22, 1, 0.36, 1],
              }
            : { duration: 0 }
        }
      />
    </svg>
  );
}
