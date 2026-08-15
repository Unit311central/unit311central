"use client";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { onwardAirBriefingUiConfig } from "@/lib/portals/briefing/pack-ui-configs";

export default function OnwardAirPortalsDemoPage() {
  return <PortalsBriefingPage config={onwardAirBriefingUiConfig} />;
}
