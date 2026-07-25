"use client";

import ExecutiveAssistantPanel from "@/components/executive-assistant/ExecutiveAssistantPanel";
import { useOperatorEntitlements } from "./OperatorEntitlementsProvider";

/**
 * Home-embedded Executive Assistant shell.
 * Reuses the global ExecutiveAssistantPanel (UI foundation only — no AI yet).
 */
export default function HomeExecutiveAssistantPanel() {
  const { roleView } = useOperatorEntitlements();

  return (
    <ExecutiveAssistantPanel
      variant="home"
      activeView="home"
      mode="internal"
      roleView={roleView}
      className="h-full min-h-[36rem]"
    />
  );
}
