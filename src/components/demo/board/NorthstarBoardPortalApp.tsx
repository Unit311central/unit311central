"use client";

import {
  NorthstarBoardDashboardWorkspace,
  NorthstarBoardMeetingsWorkspace,
  NorthstarBoardPacksWorkspace,
  NorthstarBoardRisksWorkspace,
} from "@/components/demo/NorthstarBoardGovernanceWorkspaces";
import { NorthstarBoardMinutesWorkspace } from "@/components/demo/NorthstarBoardMinutesWorkspace";
import { DemoBoardMembersWorkspace } from "@/components/demo/DemoBoardWorkspace";
import type { NorthstarBoardPortalSection } from "@/lib/demo/northstar-board-portal-data";

type Props = {
  section: NorthstarBoardPortalSection;
};

export function NorthstarBoardPortalApp({ section }: Props) {
  if (section === "meetings") return <NorthstarBoardMeetingsWorkspace />;
  if (section === "decks") return <NorthstarBoardPacksWorkspace />;
  if (section === "minutes") return <NorthstarBoardMinutesWorkspace />;
  if (section === "risk") return <NorthstarBoardRisksWorkspace />;
  if (section === "members") return <DemoBoardMembersWorkspace />;
  return <NorthstarBoardDashboardWorkspace />;
}
