"use client";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

export default function TalantonPortalsDemoPage() {
  return <PortalsBriefingPage workspaceSlug={TALANTON_IMPACT_SLUG} />;
}
