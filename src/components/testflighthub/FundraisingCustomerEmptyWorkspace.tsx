"use client";

import { CalendarDays, FolderLock } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
};

export function FundraisingCustomerEmptyWorkspace({ title, subtitle }: Props) {
  const Icon = title.toLowerCase().includes("data") ? FolderLock : CalendarDays;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-1 py-6">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Fundraising</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">{subtitle}</p>
      </header>

      <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/45">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold text-white">No fundraising records yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
          This workspace does not have any {title.toLowerCase()} configured. Investor activity will appear here once
          your team creates workspace-owned fundraising records.
        </p>
      </section>
    </div>
  );
}
