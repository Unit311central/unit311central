"use client";

import type { AbhiMemberPortalSection } from "@/lib/abhi/member-portal-data";
import { AbhiMemberAssistantPage } from "@/components/abhi/portal/AbhiMemberAssistantPage";
import { AbhiMemberFundingPage } from "@/components/abhi/portal/AbhiMemberFundingPage";
import { AbhiMemberHomeDashboard } from "@/components/abhi/portal/AbhiMemberHomeDashboard";
import {
  AbhiMemberEventsPage,
  AbhiMemberMembershipOverview,
  AbhiMemberWorkingGroupsPage,
} from "@/components/abhi/portal/AbhiMemberMembershipPages";

type Props = {
  companyPath: string;
  companyId: string;
  companyName: string;
  section: AbhiMemberPortalSection;
};

export function AbhiMemberPortalApp({
  companyPath,
  companyId,
  companyName,
  section,
}: Props) {
  switch (section) {
    case "funding":
      return (
        <AbhiMemberFundingPage
          companyPath={companyPath}
          companyId={companyId}
          companyName={companyName}
        />
      );
    case "assistant":
      return (
        <AbhiMemberAssistantPage
          companyPath={companyPath}
          companyId={companyId}
          companyName={companyName}
        />
      );
    case "membership":
      return (
        <AbhiMemberMembershipOverview
          companyPath={companyPath}
          companyId={companyId}
          companyName={companyName}
        />
      );
    case "events":
      return <AbhiMemberEventsPage companyName={companyName} />;
    case "working-groups":
      return <AbhiMemberWorkingGroupsPage companyName={companyName} />;
    case "dashboard":
    default:
      return (
        <AbhiMemberHomeDashboard
          companyPath={companyPath}
          companyId={companyId}
          companyName={companyName}
        />
      );
  }
}
