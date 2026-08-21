"use client";

import { Boxes } from "lucide-react";

type WorkspacesPlaceholderProps = {
  title: string;
  description: string;
};

/**
 * Phase 1 Workspaces shell — navigation and copy only.
 * Provisioning workflows ship in a later phase.
 */
export function WorkspacesPlaceholderWorkspace({
  title,
  description,
}: WorkspacesPlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-1 py-6">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-200">
            <Boxes className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Internal Central · Workspaces
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{description}</p>
          </div>
        </div>
      </header>
      <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
        <p className="text-sm font-medium text-white/70">Module placeholder</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
          Workspace administration navigation is live on internal Central. Customer workspace
          provisioning and management workflows will be added in a later phase.
        </p>
      </section>
    </div>
  );
}
