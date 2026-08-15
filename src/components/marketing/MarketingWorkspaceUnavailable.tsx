"use client";

import type { InternalOperationsView } from "@/lib/internal-operations-data";

import { WorkspaceEmpty } from "@/components/workspace-ui";

export function MarketingWorkspaceUnavailable({
  title = "Marketing & Events",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Unit311 Central
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{message}</p>
      </header>
      <WorkspaceEmpty message="This workspace does not expose that Marketing & Events view yet." />
    </div>
  );
}

export type MarketingViewHostProps = {
  view: InternalOperationsView;
};
