"use client";

import { AbhiBoardPortalApp } from "@/components/abhi/board/AbhiBoardPortalApp";
import { TalantonBoardPortalApp } from "@/components/talanton/board/TalantonBoardPortalApp";
import type { AbhiBoardPortalSection } from "@/lib/abhi/board-portal-data";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import type { TiBoardPortalSection } from "@/lib/talanton/board-portal-data";

import BoardDirectorsWorkspace from "./BoardDirectorsWorkspace";

/** Staff-facing wrapper around Board Portal sections. */
export default function BoardGovernanceWorkspace({
  section,
}: {
  section: AbhiBoardPortalSection | TiBoardPortalSection;
}) {
  const isTalanton = isBrowserTalantonImpactSurface();
  const isOnwardAir = isBrowserOnwardAirSurface();

  // OnwardAir Board → Board Members uses the same editable Corporate Board of Directors UI.
  if (isOnwardAir && section === "members") {
    return <BoardDirectorsWorkspace />;
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
