"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

import {
  TqmsKpiTile,
  TqmsSection,
  TqmsStatusPill,
} from "@/components/testflighthub/tqms-ui";
import { SAEC_ENGINEERING_RISKS } from "@/lib/saec/engineering-risks-data";
import { SAEC_COMPANY_NAME } from "@/lib/saec-surface";
import { cn } from "@/lib/utils";

const SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const;
const LIKELIHOOD_LEVELS = ["low", "medium", "high"] as const;

function Shell({
  title,
  subtitle,
  children,
  compact = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("mx-auto max-w-6xl space-y-4 px-1", compact ? "py-2 sm:py-3" : "py-4 sm:py-6")}>
      <div className="border-b border-white/10 pb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
          {SAEC_COMPANY_NAME} · Engineering
        </p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/50">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ragClass(level: string) {
  if (level === "critical" || level === "high") return "border-rose-400/35 bg-rose-500/15 text-rose-100";
  if (level === "medium") return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
}

function riskMatrixCellClass(count: number) {
  if (count >= 3) return "bg-rose-500/35 text-white";
  if (count === 2) return "bg-amber-500/30 text-white";
  if (count === 1) return "bg-sky-500/25 text-white";
  return "bg-white/[0.04] text-white/35";
}

export default function SaecEngineeringRisksWorkspace() {
  const open = SAEC_ENGINEERING_RISKS.filter(
    (r) => r.status === "open" || r.status === "mitigating",
  );

  const matrix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const risk of SAEC_ENGINEERING_RISKS) {
      const key = `${risk.impact}:${risk.probability}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, []);

  return (
    <Shell
      compact
      title="Engineering Risks"
      subtitle={`${SAEC_COMPANY_NAME} risk register — probability, impact, mitigation, and ownership.`}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile label="Register" value={String(SAEC_ENGINEERING_RISKS.length)} hint="Total risks" />
        <TqmsKpiTile label="Open / mitigating" value={String(open.length)} hint="Active" />
        <TqmsKpiTile
          label="Critical / high impact"
          value={String(
            open.filter((r) => r.impact === "critical" || r.impact === "high").length,
          )}
          hint="Escalate"
        />
        <TqmsKpiTile
          label="Closed / accepted"
          value={String(
            SAEC_ENGINEERING_RISKS.filter((r) => r.status === "accepted" || r.status === "closed").length,
          )}
          hint="Parked"
        />
      </div>

      <TqmsSection title="Risk heatmap" subtitle="Impact × probability — register density.">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-1 text-left text-xs">
            <thead>
              <tr>
                <th className="min-w-[88px] px-2 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Impact ↓ / Probability →
                </th>
                {LIKELIHOOD_LEVELS.map((level) => (
                  <th
                    key={level}
                    className="min-w-[72px] px-1 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/45"
                  >
                    {level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...SEVERITY_LEVELS].reverse().map((impact) => (
                <tr key={impact}>
                  <td className="rounded-lg border border-white/10 bg-[#0b1524]/95 px-3 py-2 text-[11px] font-medium capitalize text-white/70">
                    {impact}
                  </td>
                  {LIKELIHOOD_LEVELS.map((probability) => {
                    const count = matrix.get(`${impact}:${probability}`) ?? 0;
                    return (
                      <td key={`${impact}-${probability}`} className="p-0.5">
                        <div
                          title={`${impact} / ${probability}: ${count} risk(s)`}
                          className={cn(
                            "flex h-12 items-center justify-center rounded-lg text-sm font-semibold tabular-nums",
                            riskMatrixCellClass(count),
                          )}
                        >
                          {count > 0 ? count : "—"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TqmsSection>

      <TqmsSection title="Risk register" subtitle="Score · owner · mitigation · review date.">
        <div className="space-y-3">
          {SAEC_ENGINEERING_RISKS.map((risk) => (
            <div
              key={risk.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <TqmsStatusPill className={ragClass(risk.impact)}>{risk.impact}</TqmsStatusPill>
                <TqmsStatusPill className={ragClass(risk.probability)}>{risk.probability}</TqmsStatusPill>
                <TqmsStatusPill className="border-violet-400/35 bg-violet-500/15 text-violet-100">
                  Score {risk.score}
                </TqmsStatusPill>
                <TqmsStatusPill className={ragClass(risk.status)}>{risk.status}</TqmsStatusPill>
                <span className="text-[10px] uppercase tracking-wide text-white/40">{risk.category}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{risk.title}</p>
              <p className="mt-1 text-[12px] text-white/45">
                {risk.program} · {risk.owner} · review by {risk.dueDate}
              </p>
              <p className="mt-2 text-[12px] text-white/60">
                <span className="font-medium text-white/75">Mitigation:</span> {risk.mitigation}
              </p>
            </div>
          ))}
        </div>
      </TqmsSection>
    </Shell>
  );
}
