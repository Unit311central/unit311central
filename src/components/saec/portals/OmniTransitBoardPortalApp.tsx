"use client";

import { SaecBoardMinutesWorkspace } from "@/components/saec/board/SaecBoardMinutesWorkspace";
import {
  OT_BOARD_GOVERNANCE,
  OT_BOARD_PAPERS,
  OT_BOARD_PORTAL_DIRECTORS,
  OT_BOARD_RECENT_MEETINGS,
  OT_BOARD_UPCOMING_MEETINGS,
  type OtBoardPortalSection,
} from "@/lib/saec/board-portal-data";
import { OMNITRANSIT_DISPLAY_NAME } from "@/lib/saec-surface";
import { cn } from "@/lib/utils";

type Props = {
  section: OtBoardPortalSection;
};

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5",
        className,
      )}
    >
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function OmniTransitBoardPortalApp({ section }: Props) {
  if (section === "minutes" || section === "decisions" || section === "actions") {
    return <SaecBoardMinutesWorkspace />;
  }

  if (section === "members") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            Directors
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Board of directors
          </h1>
          <p className="mt-1 text-sm text-white/55">
            OmniTransit executive and non-executive directors (demo data).
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {OT_BOARD_PORTAL_DIRECTORS.map((director) => (
            <article
              key={director.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <p className="font-semibold text-white">{director.name}</p>
              <p className="mt-1 text-sm text-sky-100/80">{director.role}</p>
              <p className="mt-1 text-xs text-white/45">{director.department}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (section === "meetings") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            Board meetings
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Meeting schedule</h1>
        </header>
        <Panel title="Upcoming meetings">
          <ul className="space-y-3">
            {OT_BOARD_UPCOMING_MEETINGS.map((meeting) => (
              <li
                key={meeting.id}
                className="rounded-xl border border-sky-400/20 bg-sky-500/5 px-4 py-3 text-sm"
              >
                <p className="font-medium text-white">{meeting.title}</p>
                <p className="mt-1 text-xs text-white/50">
                  {formatDate(meeting.date)} · {meeting.location}
                </p>
                <p className="mt-2 text-white/70">{meeting.agenda}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent meetings">
          <ul className="space-y-3">
            {OT_BOARD_RECENT_MEETINGS.map((meeting) => (
              <li
                key={meeting.id}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/75"
              >
                <p className="font-medium text-white">{meeting.title}</p>
                <p className="mt-1 text-xs text-white/45">
                  {formatDate(meeting.date)} · {meeting.location}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  if (section === "papers") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Board papers</h1>
          <p className="mt-1 text-sm text-white/55">Published packs and draft materials.</p>
        </header>
        <Panel title="Papers">
          <ul className="space-y-2">
            {OT_BOARD_PAPERS.map((paper) => (
              <li
                key={paper.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{paper.title}</p>
                  <p className="text-xs text-white/45">
                    {paper.category} · Meeting {formatDate(paper.meetingDate)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    paper.status === "Published"
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-amber-500/15 text-amber-100",
                  )}
                >
                  {paper.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  if (section === "governance") {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Governance</h1>
        </header>
        <Panel title={OT_BOARD_GOVERNANCE.legalName}>
          <p className="text-sm text-white/70">{OT_BOARD_GOVERNANCE.charterSummary}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-white/40">Jurisdiction</dt>
              <dd className="text-white">{OT_BOARD_GOVERNANCE.jurisdiction}</dd>
            </div>
            <div>
              <dt className="text-white/40">Listing</dt>
              <dd className="text-white">{OT_BOARD_GOVERNANCE.listing}</dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Board committees">
          <ul className="space-y-2 text-sm">
            {OT_BOARD_GOVERNANCE.committees.map((committee) => (
              <li key={committee.name} className="rounded-lg border border-white/10 px-3 py-2">
                <p className="font-medium text-white">{committee.name}</p>
                <p className="text-white/55">Chair: {committee.chair}</p>
                <p className="text-xs text-white/40">{committee.focus}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
          {OMNITRANSIT_DISPLAY_NAME}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Board overview
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Governance snapshot for vertical transport operations across South Africa.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Panel title="Directors">
          <p className="text-3xl font-semibold text-white">{OT_BOARD_PORTAL_DIRECTORS.length}</p>
        </Panel>
        <Panel title="Upcoming meetings">
          <p className="text-3xl font-semibold text-white">{OT_BOARD_UPCOMING_MEETINGS.length}</p>
        </Panel>
        <Panel title="Board papers">
          <p className="text-3xl font-semibold text-white">{OT_BOARD_PAPERS.length}</p>
        </Panel>
        <Panel title="Next meeting">
          <p className="text-lg font-semibold text-white">
            {formatDate(OT_BOARD_UPCOMING_MEETINGS[0]?.date ?? "2026-09-15")}
          </p>
        </Panel>
      </div>
      <Panel title="Focus areas">
        <ul className="space-y-2 text-sm text-white/75">
          <li>Safety performance and SANS lift/escalator compliance</li>
          <li>Gauteng installation pipeline and capex discipline</li>
          <li>Supply chain resilience for escalator components</li>
        </ul>
      </Panel>
    </div>
  );
}
