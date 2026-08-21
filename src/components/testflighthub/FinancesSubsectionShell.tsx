"use client";

import Link from "next/link";
import { ArrowRight, Construction } from "lucide-react";

import {
  FINANCES_MODULE_SUBTITLE,
  FINANCES_SHELL_CONFIG,
  type FinancesShellView,
} from "@/lib/finances-nav";
import { INTERNAL_OPERATIONS_BASE_PATH } from "@/lib/internal-operations-data";

type Props = {
  view: FinancesShellView;
  basePath?: string;
};

function buildHref(basePath: string, view: string, query?: Record<string, string>) {
  const params = new URLSearchParams({ view });
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      params.set(key, value);
    }
  }
  const prefix = basePath === "/" ? "" : basePath;
  return `${prefix}?${params.toString()}`;
}

export default function FinancesSubsectionShell({ view, basePath = INTERNAL_OPERATIONS_BASE_PATH }: Props) {
  const config = FINANCES_SHELL_CONFIG[view];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-[#0c1a2e] via-[#0a1422] to-[#08101c] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
          {FINANCES_MODULE_SUBTITLE} · {config.areaLabel}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{config.sectionLabel}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">{config.summary}</p>
      </section>

      <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-2.5 text-amber-100">
            <Construction className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Section in development</h3>
            <p className="mt-1 text-sm text-white/50">
              Navigation is wired to the agreed Finances structure. Underlying workflows for{" "}
              <span className="text-white/75">{config.sectionLabel}</span> are not live on this
              workspace yet — no demo financial records are shown here.
            </p>
            {config.relatedView ? (
              <Link
                href={buildHref(basePath, config.relatedView)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/15"
              >
                {config.relatedLabel ?? "Open related workspace"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
