"use client";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { talantonBriefingUiConfig } from "@/lib/portals/briefing/pack-ui-configs";

export default function TalantonPortalsDemoPage() {
  return <PortalsBriefingPage config={talantonBriefingUiConfig} />;
}
