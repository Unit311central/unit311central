"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, FileText, ListChecks } from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import type { AbhiBoardPortalSection } from "@/lib/abhi/board-portal-data";

export default function CustomerBoardGovernanceWorkspace({
  section,
}: {
  section: AbhiBoardPortalSection;
}) {
  const basePath = useInternalOperationsBasePath();
  const membersHref = getInternalNavHref("board-members", basePath);

  if (section === "dashboard") {
    return (
      <div className="space-y-4 p-2 sm:p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">
            Board dashboard
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Governance at a glance</h2>
          <p className="mt-2 text-sm text-white/55">
            Next meeting, approved packs, actions, risks, and recent decisions.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-white/70">
              <CalendarDays className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Next board meeting</h3>
            </div>
            <p className="mt-3 text-sm text-white/50">No scheduled meeting.</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-white/70">
              <FileText className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Latest approved board pack</h3>
            </div>
            <p className="mt-3 text-sm text-white/50">No approved board packs yet.</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-white/70">
              <ListChecks className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Open board actions</h3>
            </div>
            <p className="mt-3 text-sm text-white/50">No open board actions.</p>
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-white/70">
              <AlertTriangle className="h-4 w-4" />
              <h3 className="text-sm font-semibold">High risks</h3>
            </div>
            <p className="mt-3 text-sm text-white/50">No high risks recorded.</p>
          </section>
        </div>
        <p className="text-sm text-white/45">
          Add board members in{" "}
          <Link href={membersHref} className="text-sky-300 hover:text-sky-200">
            Board → Board Members
          </Link>
          .
        </p>
      </div>
    );
  }

  const copy: Record<Exclude<AbhiBoardPortalSection, "dashboard" | "members" | "decks">, { title: string; body: string }> = {
    meetings: {
      title: "Board meetings",
      body: "No board meetings scheduled. Schedule your first meeting when ready.",
    },
    minutes: {
      title: "Board minutes",
      body: "No board minutes on file yet.",
    },
    risk: {
      title: "Risk register",
      body: "No board risks recorded yet.",
    },
  };

  const sectionCopy = copy[section as keyof typeof copy];
  if (!sectionCopy) return null;

  return (
    <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-white">{sectionCopy.title}</h3>
      <p className="mt-2 text-sm text-white/50">{sectionCopy.body}</p>
    </div>
  );
}
