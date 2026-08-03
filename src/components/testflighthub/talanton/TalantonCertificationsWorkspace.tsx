"use client";

import { useMemo, useState } from "react";

import { buildCertificationRecords } from "@/lib/talanton/training-phase2";
import { cn } from "@/lib/utils";
import {
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

function statusClass(status: string) {
  if (status === "Active") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (status === "Expiring") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (status === "Expired") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  return "border-sky-400/30 bg-sky-500/10 text-sky-100";
}

export default function TalantonCertificationsWorkspace() {
  const certs = useMemo(() => buildCertificationRecords(), []);
  const [scope, setScope] = useState<"all" | "Internal Staff" | "Portfolio Company">("all");

  const filtered = useMemo(
    () => certs.filter((c) => (scope === "all" ? true : c.holderType === scope)),
    [certs, scope],
  );

  const expiring = certs.filter((c) => c.status === "Expiring").length;
  const inProgress = certs.filter((c) => c.status === "In Progress").length;
  const staff = certs.filter((c) => c.holderType === "Internal Staff").length;
  const portfolio = certs.filter((c) => c.holderType === "Portfolio Company").length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Training"
        title="Certifications"
        description="Track internal staff and portfolio company certifications — renewals, progress and expiry risk ahead of LP and board cycles."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TalantonImpactMetric label="Internal staff certifications" value={staff} />
        <TalantonImpactMetric label="Portfolio company certifications" value={portfolio} />
        <TalantonImpactMetric label="Expiring certifications" value={expiring} tone="watch" />
        <TalantonImpactMetric label="In progress" value={inProgress} />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "Internal Staff", "Portfolio Company"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              scope === s
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 text-white/50",
            )}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusClass(c.status))}>
                    {c.status}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/45">
                    {c.holderType}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white">{c.courseTitle}</h3>
                <p className="mt-1 text-xs text-white/50">
                  {c.holderName}
                  {c.companyName ? ` · ${c.companyName}` : " · Talanton Impact"}
                </p>
                <p className="mt-1 text-[11px] text-white/35">
                  Issued {c.issuedOn} · Expires {c.expiresOn}
                </p>
              </div>
              <div className="w-28">
                <p className="text-right text-sm font-semibold tabular-nums text-emerald-200">
                  {c.progressPct}%
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${c.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
