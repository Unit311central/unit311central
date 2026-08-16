"use client";

import { AbhiBoardPortalApp } from "@/components/abhi/board/AbhiBoardPortalApp";
import { AbhiBoardMinutesWorkspace } from "@/components/abhi/board/AbhiBoardMinutesWorkspace";
import { DemoBoardMembersWorkspace } from "@/components/demo/DemoBoardWorkspace";
import {
  NorthstarBoardDashboardWorkspace,
  NorthstarBoardMeetingsWorkspace,
  NorthstarBoardMinutesWorkspace,
  NorthstarBoardRisksWorkspace,
} from "@/components/demo/NorthstarBoardGovernanceWorkspaces";
import {
  OnwardAirBoardDashboardWorkspace,
  OnwardAirBoardMinutesWorkspace,
} from "@/components/onwardair/OnwardAirBoardWorkspaces";
import { TalantonBoardPortalApp } from "@/components/talanton/board/TalantonBoardPortalApp";
import type { AbhiBoardPortalSection } from "@/lib/abhi/board-portal-data";
import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import type { TiBoardPortalSection } from "@/lib/talanton/board-portal-data";

import AbhiBoardMembersWorkspace from "./AbhiBoardMembersWorkspace";
import BoardDirectorsWorkspace from "./BoardDirectorsWorkspace";

/** Staff-facing wrapper around Board Portal sections. */
export default function BoardGovernanceWorkspace({
  section,
}: {
  section: AbhiBoardPortalSection | TiBoardPortalSection;
}) {
  const isTalanton = isBrowserTalantonImpactSurface();
  const isOnwardAir = isBrowserOnwardAirSurface();
  const isAbhi = isBrowserAbhiSurface();
  const isDemo = isBrowserDemoSurface();

  if (isDemo) {
    if (section === "dashboard") return <NorthstarBoardDashboardWorkspace />;
    if (section === "meetings") return <NorthstarBoardMeetingsWorkspace />;
    if (section === "minutes") return <NorthstarBoardMinutesWorkspace />;
    if (section === "members") return <DemoBoardMembersWorkspace />;
    return <NorthstarBoardRisksWorkspace />;
  }

  if (isAbhi && section === "members") {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#07111f]/40 p-1 sm:p-2">
        <AbhiBoardMembersWorkspace />
      </div>
    );
  }

  if (isAbhi && section === "minutes") {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#07111f]/40 p-1 sm:p-2">
        <AbhiBoardMinutesWorkspace />
      </div>
    );
  }

  // OnwardAir Board → Board Members uses the same editable Corporate Board of Directors UI.
  if (isOnwardAir && section === "members") {
    return <BoardDirectorsWorkspace />;
  }

  if (isOnwardAir && section === "dashboard") {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#07111f]/40 p-1 sm:p-2">
        <OnwardAirBoardDashboardWorkspace />
      </div>
    );
  }

  if (isOnwardAir && section === "minutes") {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#07111f]/40 p-1 sm:p-2">
        <OnwardAirBoardMinutesWorkspace />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#07111f]/40 p-1 sm:p-2">
      {isTalanton ? (
        <TalantonBoardPortalApp section={section as TiBoardPortalSection} />
      ) : (
        <AbhiBoardPortalApp section={section as AbhiBoardPortalSection} />
      )}
    </div>
  );
}
