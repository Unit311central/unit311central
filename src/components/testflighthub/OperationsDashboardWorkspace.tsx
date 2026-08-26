"use client";

import NorthstarOperationsDashboard from "@/components/demo/NorthstarOperationsDashboard";
import OmniTransitOperationsDashboard from "@/components/saec/OmniTransitOperationsDashboard";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isBrowserSaecSurface } from "@/lib/saec-surface";

export function OperationsDashboardWorkspace() {
  if (typeof window !== "undefined" && isBrowserDemoSurface()) {
    return <NorthstarOperationsDashboard />;
  }
  if (typeof window !== "undefined" && isBrowserSaecSurface()) {
    return <OmniTransitOperationsDashboard />;
  }
  const OnwardAirOperationsDashboard =
    require("@/components/onwardair/OnwardAirOperationsDashboard").default as typeof import("@/components/onwardair/OnwardAirOperationsDashboard").default;
  return <OnwardAirOperationsDashboard />;
}
