"use client";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";

export default function OnwardAirPortalsDemoPage() {
  return <PortalsBriefingPage workspaceSlug={ONWARDAIR_SLUG} />;
}
