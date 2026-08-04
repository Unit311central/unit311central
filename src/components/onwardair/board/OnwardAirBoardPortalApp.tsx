"use client";

import { AlertTriangle, Users } from "lucide-react";

import {
  OnwardAirBoardDashboardWorkspace,
  OnwardAirBoardDecksWorkspace,
  OnwardAirBoardMeetingsWorkspace,
  OnwardAirBoardMinutesWorkspace,
} from "@/components/onwardair/OnwardAirBoardWorkspaces";
import { OA_BOARD_DASHBOARD_RISKS } from "@/lib/onwardair/board-data";
import {
  OA_BOARD_PORTAL_MEMBERS,
  type OaBoardPortalSection,
} from "@/lib/onwardair/board-portal-data";
import { cn } from "@/lib/utils";

type Props = {
  section: OaBoardPortalSection;
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

function BoardRisk() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300/80">
          Risk Register
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Programme risks
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Board-level risks for Vertex VTOL™ / FLEX Pod™ certification, capital, and supply.
        </p>
      </header>

      <Card title="Active risks">
        <ul className="space-y-2">
          {OA_BOARD_DASHBOARD_RISKS.map((r) => (
            <li
              key={r.id}
              className="flex gap-3 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
              <div className="min-w-0">
                <p className="font-medium text-white/90">{r.description}</p>
                <p className="mt-1 text-xs text-white/45">
                  {r.id} · Impact {r.impact} · {r.owner} · {r.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function BoardMembers() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300/80">
          Board Members
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Founder & Luminary Advisors
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Governance roster for OnwardAir Houston — read-only directory for board access.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {OA_BOARD_PORTAL_MEMBERS.map((m) => (
          <article
            key={m.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-500/10 text-teal-200">
                <Users className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-white">{m.name}</p>
                <p className="mt-0.5 text-sm text-teal-100/80">{m.role}</p>
                <p className="mt-1 text-xs text-white/45">{m.organisation}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function OnwardAirBoardPortalApp({ section }: Props) {
  if (section === "meetings") return <OnwardAirBoardMeetingsWorkspace />;
  if (section === "decks") return <OnwardAirBoardDecksWorkspace readOnly />;
  if (section === "minutes") return <OnwardAirBoardMinutesWorkspace />;
  if (section === "risk") return <BoardRisk />;
  if (section === "members") return <BoardMembers />;
  return <OnwardAirBoardDashboardWorkspace />;
}
