"use client";

import { useState } from "react";

import ExecutiveAssistantPanel from "@/components/executive-assistant/ExecutiveAssistantPanel";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import type { AssistantFollowUpAction } from "@/lib/ai-operating-assistant/tool-result";

function resolveGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

/**
 * Conversation-first Executive Assistant — chat workspace without the legacy brief sidebar.
 */
export default function ExecutiveOperatingCentre() {
  const [seedPrompt, setSeedPrompt] = useState<string | null>(null);
  const [seedAction, setSeedAction] = useState<AssistantFollowUpAction | null>(null);
  const { roleView } = useOperatorEntitlements();

  const greeting = resolveGreeting();

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[36rem] w-full min-w-0 flex-col">
      <header className="mb-1.5 shrink-0 px-0.5">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{greeting}</h2>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[color:var(--platform-card-border,#243347)]">
        <ExecutiveAssistantPanel
          variant="page"
          activeView="executive-assistant"
          mode="internal"
          roleView={roleView}
          hideSidebar
          embedded
          seedPrompt={seedPrompt}
          seedAction={seedAction}
          onSeedConsumed={() => {
            setSeedPrompt(null);
            setSeedAction(null);
          }}
          className="h-full min-h-0 rounded-none border-0"
        />
      </div>
    </div>
  );
}
