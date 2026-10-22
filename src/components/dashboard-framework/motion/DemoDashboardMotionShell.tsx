"use client";

import type { ReactNode } from "react";

import {
  DemoDashboardMotionProvider,
  type DemoDashboardModuleId,
} from "./demo-dashboard-motion-context";
import { DemoDashboardIntroScheduler } from "./demo-dashboard-motion";
import { useDemoClientMotionArmed } from "./use-demo-client-armed";

export function DemoDashboardMotionShell({
  moduleId,
  filterKey,
  children,
}: {
  moduleId: DemoDashboardModuleId;
  filterKey?: string | number;
  children: ReactNode;
}) {
  const armed = useDemoClientMotionArmed();

  return (
    <DemoDashboardMotionProvider moduleId={moduleId} armed={armed} filterKey={filterKey}>
      {armed ? <DemoDashboardIntroScheduler /> : null}
      {children}
    </DemoDashboardMotionProvider>
  );
}
