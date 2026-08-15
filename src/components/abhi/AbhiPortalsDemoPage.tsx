"use client";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { abhiBriefingUiConfig } from "@/lib/portals/briefing/pack-ui-configs";

export default function AbhiPortalsDemoPage() {
  return <PortalsBriefingPage config={abhiBriefingUiConfig} />;
}
