"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import {
  demoDashboardEntranceProps,
  useDemoDashboardIntroPending,
  useDemoDashboardMotionArmed,
} from "./demo-dashboard-motion";
import { useLivingMotionEnabled } from "./living-motion";

export function DemoDashboardReveal({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  const motionEnabled = useLivingMotionEnabled();
  const armed = useDemoDashboardMotionArmed();
  const introPending = useDemoDashboardIntroPending();
  const props = demoDashboardEntranceProps(index, introPending, motionEnabled && armed);

  return (
    <motion.div {...props} className={className}>
      {children}
    </motion.div>
  );
}
