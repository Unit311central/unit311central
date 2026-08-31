"use client";

import type { WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { buildAssumptionsRegister } from "@/lib/realtime-video-pipeline/workbench-assumptions";
import { cn } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "Verified Specification" || status === "Measured")
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "Calculated") return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  if (status === "User Input") return "border-violet-400/30 bg-violet-500/15 text-violet-100";
  if (status === "Reference Assumption" || status === "Assumed")
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-white/10 bg-white/5 text-slate-300";
}

export function AssumptionsTab({ model }: { model: WorkbenchModel }) {
  const entries = buildAssumptionsRegister(model.config);

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        Engineering assumptions and reference data register. Values marked Reference Assumption or TBD
        must not be presented as verified specifications.
      </p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2">Parameter</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {entries.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-medium text-white">{row.parameter}</td>
                <td className="px-3 py-2 font-mono text-white/80">
                  {row.value || "TBD"}
                  {row.unit ? ` ${row.unit}` : ""}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px]",
                      statusTone(row.status),
                    )}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-white/55">
                  {row.sourceUrl ? (
                    <a
                      href={row.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-white/20 hover:text-white"
                    >
                      {row.source.slice(0, 60)}
                      {row.source.length > 60 ? "…" : ""}
                    </a>
                  ) : (
                    row.source
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-white/45">{row.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
