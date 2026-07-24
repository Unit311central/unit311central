"use client";

import ExecutiveOperatingCentre from "@/components/executive-assistant/ExecutiveOperatingCentre";

/**
 * Full-page Executive Assistant — Operating Centre (briefing-first, not empty chat).
 */
export default function ExecutiveAssistantWorkspace() {
  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <ExecutiveOperatingCentre />
    </div>
  );
}
