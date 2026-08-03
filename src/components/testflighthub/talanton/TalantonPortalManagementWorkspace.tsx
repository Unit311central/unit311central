"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";

import { buildPortalManagementRows } from "@/lib/talanton/training-phase2";
import { cn } from "@/lib/utils";
import {
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

function statusClass(status: string) {
  if (status === "Active") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (status === "Invited") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-white/15 bg-white/5 text-white/55";
}

export default function TalantonPortalManagementWorkspace() {
  const rows = useMemo(() => buildPortalManagementRows(), []);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.companyName.toLowerCase().includes(q) ||
        r.portalUrl.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const active = rows.filter((r) => r.portalStatus === "Active").length;
  const avgProgress = Math.round(
    rows.reduce((s, r) => s + r.learningProgress, 0) / Math.max(rows.length, 1),
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Training · Portals"
        title="Portfolio Company Portal Management"
        description="Manage portfolio company portals — access status, portal URLs, assigned courses and learning progress across Talanton holdings."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TalantonImpactMetric label="Company portals" value={rows.length} />
        <TalantonImpactMetric label="Active portals" value={active} tone="good" />
        <TalantonImpactMetric label="Avg learning progress" value={`${avgProgress}%`} />
        <TalantonImpactMetric
          label="Courses assigned (typical)"
          value={rows[0]?.assignedCourses ?? 0}
          hint="Compliance curriculum per portal"
        />
      </div>

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white/80 outline-none focus:border-emerald-400/40"
          placeholder="Search portfolio company portals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="overflow-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-black/40 text-[10px] uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Portal URL</th>
              <th className="px-4 py-3 font-medium">Last access</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Assigned courses</th>
              <th className="px-4 py-3 font-medium">Learning progress</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.companyId} className="border-t border-white/8 bg-black/20">
                <td className="px-4 py-3 font-medium text-white">{r.companyName}</td>
                <td className="px-4 py-3">
                  <a
                    href={r.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-300/90 hover:text-emerald-200"
                  >
                    /{r.path}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-4 py-3 text-white/60">{r.lastAccess}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusClass(r.portalStatus))}>
                    {r.portalStatus}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-white/70">{r.assignedCourses}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${r.learningProgress}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-white/70">{r.learningProgress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
