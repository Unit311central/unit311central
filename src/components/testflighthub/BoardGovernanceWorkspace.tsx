"use client";

import { AbhiBoardPortalApp } from "@/components/abhi/board/AbhiBoardPortalApp";
import type { AbhiBoardPortalSection } from "@/lib/abhi/board-portal-data";

/** Staff-facing wrapper around Board Portal sections (read/write still in dedicated workspaces). */
export default function BoardGovernanceWorkspace({
  section,
}: {
  section: AbhiBoardPortalSection;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#07111f]/40 p-1 sm:p-2">
      <AbhiBoardPortalApp section={section} />
    </div>
  );
}
