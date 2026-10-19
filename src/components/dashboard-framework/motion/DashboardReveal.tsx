"use client";

import { motion } from "framer-motion";

import { livingEntranceProps, useHomeLivingIntroPending, useLivingMotionEnabled } from "./living-motion";

type DashboardRevealProps = {
  index?: number;
  className?: string;
  children: React.ReactNode;
};

export function DashboardReveal({ index = 0, className, children }: DashboardRevealProps) {
  const motionEnabled = useLivingMotionEnabled();
  const { introPending } = useHomeLivingIntroPending();
  const props = livingEntranceProps(index, motionEnabled, introPending);

  return (
    <motion.div {...props} className={className}>
      {children}
    </motion.div>
  );
}
