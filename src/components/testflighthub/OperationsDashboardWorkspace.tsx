"use client";

import { useEffect, useState } from "react";

import NorthstarOperationsDashboard from "@/components/demo/NorthstarOperationsDashboard";
import OnwardAirOperationsDashboard from "@/components/onwardair/OnwardAirOperationsDashboard";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";

export function OperationsDashboardWorkspace() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(isBrowserDemoSurface());
  }, []);

  if (isDemo) return <NorthstarOperationsDashboard />;
  return <OnwardAirOperationsDashboard />;
}
