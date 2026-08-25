"use client";

import { SAEC_DIRECTORS } from "@/lib/saec/demo/people";
import { SAEC_LEGAL_NAME } from "@/lib/saec/demo/company";

type Section = "dashboard" | "meetings" | "minutes" | "members" | "risks";

export function SaecBoardGovernanceSection({ section }: { section: Section }) {
  if (section === "members") {
    return (
      <div className="space-y-4 p-4">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {SAEC_LEGAL_NAME} · Board
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Board of Directors</h2>
        </header>
        <ul className="grid gap-3 md:grid-cols-2">
          {SAEC_DIRECTORS.map((director) => (
            <li
              key={director.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <p className="font-medium text-white">{director.fullName}</p>
              <p className="text-sm text-white/55">{director.roleTitle}</p>
              <p className="mt-1 text-xs text-white/40">{director.department}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (section === "minutes") {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-white">Board minutes</h2>
        <ul className="space-y-2 text-sm text-white/70">
          <li className="rounded-lg border border-white/10 px-3 py-2">
            Q2 2026 board meeting — safety performance and Gauteng expansion approved
          </li>
          <li className="rounded-lg border border-white/10 px-3 py-2">
            Q1 2026 board meeting — annual maintenance pricing and capex plan noted
          </li>
        </ul>
      </div>
    );
  }

  if (section === "meetings") {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-white">Board meetings</h2>
        <p className="text-sm text-white/55">Next scheduled: 15 Sep 2026 · Pretoria HQ</p>
      </div>
    );
  }

  if (section === "risks") {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-lg font-semibold text-white">Risk register</h2>
        <ul className="space-y-2 text-sm">
          <li className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-amber-100">
            Supply chain lead times for escalator step chains
          </li>
          <li className="rounded-lg border border-white/10 px-3 py-2 text-white/75">
            Skills availability for high-rise modernisation projects
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {SAEC_LEGAL_NAME} · Governance
      </p>
      <h2 className="text-lg font-semibold text-white">Board dashboard</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] uppercase text-white/40">Directors</p>
          <p className="text-xl font-semibold text-white">{SAEC_DIRECTORS.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] uppercase text-white/40">Open actions</p>
          <p className="text-xl font-semibold text-white">3</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] uppercase text-white/40">Next meeting</p>
          <p className="text-sm font-semibold text-white">15 Sep 2026</p>
        </div>
      </div>
    </div>
  );
}
