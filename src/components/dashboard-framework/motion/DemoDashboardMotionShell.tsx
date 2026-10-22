"use client";

import type { ReactNode } from "react";

import { isBrowserDemoSurface } from "@/lib/demo-enterprise";

import {
  DemoDashboardMotionProvider,
  type DemoDashboardModuleId,
} from "./demo-dashboard-motion-context";
import { DemoDashboardIntroScheduler } from "./demo-dashboard-motion";
import { useLivingMotionEnabled } from "./living-motion";

export function DemoDashboardMotionShell({
  moduleId,
  filterKey,
  children,
}: {
  moduleId: DemoDashboardModuleId;
  filterKey?: string | number;
  children: ReactNode;
}) {
  const motionEnabled = useLivingMotionEnabled();
  const demoSurface = typeof window !== "undefined" && isBrowserDemoSurface();
  const armed = motionEnabled && demoSurface;

  if (!armed) {
    return <>{children}</>;
  }

  return (
    <DemoDashboardMotionProvider moduleId={moduleId} armed={armed} filterKey={filterKey}>
      <DemoDashboardIntroScheduler />
      {children}
    </DemoDashboardMotionProvider>
  );
}
