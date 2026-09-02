"use client";

import NorthstarOperationsDashboard from "@/components/demo/NorthstarOperationsDashboard";
import CustomerOperationsDashboard from "@/components/testflighthub/CustomerOperationsDashboard";
import OmniTransitOperationsDashboard from "@/components/saec/OmniTransitOperationsDashboard";
import { isBrowserCustomerWorkspaceSurface } from "@/lib/customer-workspace-surface";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isBrowserSaecSurface } from "@/lib/saec-surface";
import { isBrowserWolfCentralSurface } from "@/lib/wolf/wolf-surface";
import WolfOperationsDashboard from "@/components/wolf/WolfOperationsDashboard";

export function OperationsDashboardWorkspace() {
  if (typeof window !== "undefined" && isBrowserDemoSurface()) {
    return <NorthstarOperationsDashboard />;
  }
  if (typeof window !== "undefined" && isBrowserSaecSurface()) {
    return <OmniTransitOperationsDashboard />;
  }
  if (typeof window !== "undefined" && isBrowserWolfCentralSurface()) {
    return <WolfOperationsDashboard />;
  }
  if (typeof window !== "undefined" && isBrowserCustomerWorkspaceSurface()) {
    return <CustomerOperationsDashboard />;
  }
  const OnwardAirOperationsDashboard =
    require("@/components/onwardair/OnwardAirOperationsDashboard").default as typeof import("@/components/onwardair/OnwardAirOperationsDashboard").default;
  return <OnwardAirOperationsDashboard />;
}
