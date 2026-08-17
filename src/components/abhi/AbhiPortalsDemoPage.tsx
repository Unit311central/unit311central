"use client";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { ABHI_SLUG } from "@/lib/abhi-surface";

export default function AbhiPortalsDemoPage() {
  return <PortalsBriefingPage workspaceSlug={ABHI_SLUG} />;
}
