"use client";

import { FileText, FolderOpen, LifeBuoy, MessageSquare, Package } from "lucide-react";

import {
  WOLF_PAILEX_PROPOSAL_FILE,
  type WolfPailexPortalSection,
} from "@/lib/wolf/wolf-pailex-portal-data";

type Props = {
  companyName: string;
  section: WolfPailexPortalSection;
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function WolfPailexPortalApp({ companyName, section }: Props) {
  if (section === "dashboard") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
            Programme dashboard
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {companyName} delivery programme
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Shared programme workspace for proposals, work packages, and client files.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active work packages", value: "0" },
            { label: "Open tasks", value: "0" },
            { label: "Shared files", value: "0" },
            { label: "Open requests", value: "0" },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                {tile.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
            </div>
          ))}
        </div>

        <Panel title="Programme proposal">
          <div className="flex items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
            <div>
              <p className="text-sm font-semibold text-white">{WOLF_PAILEX_PROPOSAL_FILE.name}</p>
              <p className="mt-1 text-sm text-white/60">
                {WOLF_PAILEX_PROPOSAL_FILE.note} Location:{" "}
                <span className="text-white/80">{WOLF_PAILEX_PROPOSAL_FILE.location}</span>
              </p>
              <p className="mt-2 text-xs uppercase tracking-wide text-amber-200/80">
                {WOLF_PAILEX_PROPOSAL_FILE.status}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (section === "work-packages") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
            Delivery
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Work package items</h1>
          <p className="mt-1 text-sm text-white/50">Programme work packages will appear here as delivery begins.</p>
        </header>
        <Panel title="Work packages">
          <div className="flex items-center gap-3 text-sm text-white/55">
            <Package className="h-5 w-5 text-emerald-300/70" />
            No work packages have been published to this portal yet.
          </div>
        </Panel>
      </div>
    );
  }

  if (section === "files") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
            Repository
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">File Repository</h1>
          <p className="mt-1 text-sm text-white/50">
            External programme files shared from WOLF Business Productivity.
          </p>
        </header>
        <Panel title="External files">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <FolderOpen className="mt-0.5 h-5 w-5 text-emerald-300/70" />
            <div>
              <p className="text-sm font-medium text-white">{WOLF_PAILEX_PROPOSAL_FILE.name}</p>
              <p className="mt-1 text-xs text-white/45">{WOLF_PAILEX_PROPOSAL_FILE.status}</p>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (section === "support") {
    return (
      <div className="space-y-5">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
            Programme support
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Support</h1>
        </header>
        <Panel title="Requests">
          <div className="flex items-center gap-3 text-sm text-white/55">
            <LifeBuoy className="h-5 w-5 text-emerald-300/70" />
            No open support requests.
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Programme comms
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Communications</h1>
      </header>
      <Panel title="Messages">
        <div className="flex items-center gap-3 text-sm text-white/55">
          <MessageSquare className="h-5 w-5 text-emerald-300/70" />
          No programme messages yet.
        </div>
      </Panel>
    </div>
  );
}
