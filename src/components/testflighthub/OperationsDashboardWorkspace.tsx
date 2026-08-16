"use client";

import NorthstarOperationsDashboard from "@/components/demo/NorthstarOperationsDashboard";
import OnwardAirOperationsDashboard from "@/components/onwardair/OnwardAirOperationsDashboard";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";

export function OperationsDashboardWorkspace() {
  if (typeof window !== "undefined" && isBrowserDemoSurface()) {
    return <NorthstarOperationsDashboard />;
  }
  return <OnwardAirOperationsDashboard />;
}
