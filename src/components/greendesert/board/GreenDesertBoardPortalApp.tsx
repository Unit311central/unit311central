"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Users } from "lucide-react";

import {
  getCustomerBoardGovernanceSnapshot,
  subscribeCustomerBoardGovernance,
} from "@/lib/customer-board-governance-store";
import {
  listApprovedGreenDesertBoardPacks,
  resolveGreenDesertPackPdfUrl,
} from "@/lib/greendesert/greendesert-board-pack-store";
import type { GreenDesertBoardPortalSection } from "@/lib/greendesert/greendesert-board-portal-data";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { cn } from "@/lib/utils";

type Props = {
  section: GreenDesertBoardPortalSection;
};

function Card({
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

function useGovernanceSnapshot() {
  const [snapshot, setSnapshot] = useState(() =>
    getCustomerBoardGovernanceSnapshot(GREENDESERT_SLUG),
  );

  useEffect(
    () =>
      subscribeCustomerBoardGovernance(() =>
        setSnapshot(getCustomerBoardGovernanceSnapshot(GREENDESERT_SLUG)),
      ),
    [],
  );

  return snapshot;
}

function BoardDashboard() {
  const snapshot = useGovernanceSnapshot();
  const nextMeeting = snapshot.meetings[0] ?? null;
  const openActions = snapshot.actions.filter((row) => row.status !== "complete");
  const highRisks = snapshot.risks.filter((row) => row.impact === "H");

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
          Board Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Governance at a glance
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Next meeting, open actions, risks, and recent decisions.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Next board meeting">
          {nextMeeting ? (
            <div>
              <p className="text-lg font-semibold text-white">{nextMeeting.title}</p>
              <p className="mt-1 text-sm text-white/60">
                {nextMeeting.scheduledFor || "Unscheduled"}
                {nextMeeting.location ? ` · ${nextMeeting.location}` : ""}
              </p>
              {nextMeeting.notes ? (
                <p className="mt-2 text-sm text-white/55">{nextMeeting.notes}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-white/50">No scheduled meeting.</p>
          )}
        </Card>

        <Card title="Latest approved board pack">
          {(() => {
            const approved = listApprovedGreenDesertBoardPacks()[0];
            if (!approved) {
              return <p className="text-sm text-white/50">No approved board packs yet.</p>;
            }
            return (
              <div>
                <p className="text-lg font-semibold text-white">{approved.packName}</p>
                <p className="mt-1 text-sm text-white/60">
                  Meeting {approved.meetingDate}
                  {approved.quarter ? ` · ${approved.quarter}` : ""}
                </p>
                <a
                  href={resolveGreenDesertPackPdfUrl(approved.meetingDate)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/15"
                >
                  Open board pack PDF
                </a>
              </div>
            );
          })()}
        </Card>

        <Card title="Open board actions">
          <ul className="space-y-2">
            {openActions.length === 0 ? (
              <li className="text-sm text-white/50">No open actions.</li>
            ) : (
              openActions.map((action) => (
                <li
                  key={action.id}
                  className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm"
                >
                  <p className="text-white/90">{action.title}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {action.owner || "Unassigned"} · due {action.dueDate || "—"} · {action.status}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card title="High risks">
          <ul className="space-y-2">
            {highRisks.length === 0 ? (
              <li className="text-sm text-white/50">No high risks recorded.</li>
            ) : (
              highRisks.map((risk) => (
                <li
                  key={risk.id}
                  className="flex gap-2 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-2 text-sm"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  <div>
                    <p className="text-white/90">{risk.title}</p>
                    <p className="mt-1 text-xs text-white/45">
                      Impact {risk.impact} · {risk.owner || "Unassigned"} · {risk.status}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card title="Recent decisions" className="lg:col-span-2">
          <ul className="space-y-2">
            {snapshot.decisions.length === 0 ? (
              <li className="text-sm text-white/50">No decisions recorded yet.</li>
            ) : (
              snapshot.decisions.slice(0, 6).map((decision) => (
                <li key={decision.id} className="text-sm">
                  <p className="text-white/85">{decision.title}</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    {decision.decidedOn || "Undated"} · {decision.owner || "Unassigned"}
                  </p>
                  {decision.notes ? (
                    <p className="mt-1 text-xs text-emerald-200/70">{decision.notes}</p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function BoardMeetings() {
  const snapshot = useGovernanceSnapshot();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Meetings</h1>
        <p className="mt-1 text-sm text-white/55">Scheduled meetings and notes.</p>
      </header>
      <div className="space-y-3">
        {snapshot.meetings.length === 0 ? (
          <p className="text-sm text-white/50">No board meetings scheduled.</p>
        ) : (
          snapshot.meetings.map((meeting) => (
            <article
              key={meeting.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <h2 className="text-lg font-semibold text-white">{meeting.title}</h2>
              <p className="mt-1 text-sm text-white/50">
                {meeting.scheduledFor || "Unscheduled"}
                {meeting.location ? ` · ${meeting.location}` : ""}
              </p>
              {meeting.notes ? (
                <p className="mt-3 text-sm text-white/65">{meeting.notes}</p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function BoardDecks() {
  const approved = listApprovedGreenDesertBoardPacks();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Decks</h1>
        <p className="mt-1 text-sm text-white/55">
          Approved board packs only. Draft packs are not visible to board members.
        </p>
      </header>
      {approved.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/50">
          No approved board packs available yet.
        </p>
      ) : (
        <div className="space-y-3">
          {approved.map((pack) => (
            <article
              key={pack.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{pack.packName}</h2>
                  <p className="mt-1 text-sm text-white/50">
                    {pack.quarter} · Meeting {pack.meetingDate}
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                  {pack.status}
                </span>
              </div>
              <a
                href={resolveGreenDesertPackPdfUrl(pack.meetingDate)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/15"
              >
                Open PDF
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function BoardMinutes() {
  const snapshot = useGovernanceSnapshot();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Minutes & Decisions</h1>
        <p className="mt-1 text-sm text-white/55">Board minutes and recorded decisions.</p>
      </header>

      <div className="space-y-4">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
            Minutes
          </h2>
          <div className="mt-3 space-y-3">
            {snapshot.minutes.length === 0 ? (
              <p className="text-sm text-white/50">No board minutes on file yet.</p>
            ) : (
              snapshot.minutes.map((minute) => (
                <article
                  key={minute.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-white">{minute.title}</h3>
                    <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                      {minute.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">{minute.meetingDate || "Undated"}</p>
                  {minute.content ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{minute.content}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
            Decisions
          </h2>
          <div className="mt-3 space-y-3">
            {snapshot.decisions.length === 0 ? (
              <p className="text-sm text-white/50">No board decisions recorded yet.</p>
            ) : (
              snapshot.decisions.map((decision) => (
                <article
                  key={decision.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <h3 className="text-lg font-semibold text-white">{decision.title}</h3>
                  <p className="mt-1 text-sm text-white/50">
                    {decision.decidedOn || "Undated"} · {decision.owner || "Unassigned"}
                  </p>
                  {decision.notes ? (
                    <p className="mt-2 text-sm text-white/65">{decision.notes}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function BoardRisk() {
  const snapshot = useGovernanceSnapshot();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Risk Register</h1>
        <p className="mt-1 text-sm text-white/55">Read-only board view.</p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.14em] text-white/40">
            <tr>
              <th className="px-3 py-3">Risk</th>
              <th className="px-3 py-3">Impact</th>
              <th className="px-3 py-3">Owner</th>
              <th className="px-3 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.risks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-white/50">
                  No board risks recorded yet.
                </td>
              </tr>
            ) : (
              snapshot.risks.map((risk) => (
                <tr key={risk.id} className="border-t border-white/8 text-white/75">
                  <td className="px-3 py-3 font-medium text-white/90">{risk.title}</td>
                  <td className="px-3 py-3">{risk.impact}</td>
                  <td className="px-3 py-3">{risk.owner || "—"}</td>
                  <td className="px-3 py-3">{risk.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BoardMembers() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold text-white">Board Members</h1>
        <p className="mt-1 text-sm text-white/55">Director directory — board portal view.</p>
      </header>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center">
        <Users className="mx-auto h-8 w-8 text-white/25" />
        <p className="mt-3 text-sm text-white/50">No board members listed yet.</p>
      </div>
    </div>
  );
}

export function GreenDesertBoardPortalApp({ section }: Props) {
  if (section === "meetings") return <BoardMeetings />;
  if (section === "decks") return <BoardDecks />;
  if (section === "minutes") return <BoardMinutes />;
  if (section === "risk") return <BoardRisk />;
  if (section === "members") return <BoardMembers />;
  return <BoardDashboard />;
}
