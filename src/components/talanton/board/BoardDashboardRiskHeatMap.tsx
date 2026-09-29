"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import {
  computeTiRiskRating,
  getTiRiskRegisterServerSnapshot,
  getTiRiskRegisterState,
  subscribeTiRiskRegister,
  type TiRiskLevel,
  type TiRiskRegisterEntry,
} from "@/lib/talanton/risk-register-store";
import { cn } from "@/lib/utils";

const LIKELIHOOD_ORDER: TiRiskLevel[] = ["L", "M", "H"];
const IMPACT_ORDER: TiRiskLevel[] = ["H", "M", "L"];

function heatCellTone(rating: number) {
  if (rating >= 15) return "border-rose-400/40 bg-rose-500/25 text-rose-50";
  if (rating >= 9) return "border-amber-400/35 bg-amber-500/20 text-amber-50";
  if (rating >= 3) return "border-yellow-400/25 bg-yellow-500/10 text-yellow-100";
  return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
}

function useTiRiskStore() {
  return useSyncExternalStore(
    subscribeTiRiskRegister,
    getTiRiskRegisterState,
    getTiRiskRegisterServerSnapshot,
  );
}

type Props = {
  /** When set, risk links use this prefix (board portal vs staff dashboard). */
  riskRegisterHref?: string;
};

export default function BoardDashboardRiskHeatMap({ riskRegisterHref = "/board/risk" }: Props) {
  const store = useTiRiskStore();
  const activeRisks = useMemo(() => store.risks.filter((r) => !r.archived), [store.risks]);

  const risksByCell = useMemo(() => {
    const map = new Map<string, TiRiskRegisterEntry[]>();
    for (const risk of activeRisks) {
      const key = `${risk.impact}:${risk.likelihood}`;
      const list = map.get(key) ?? [];
      list.push(risk);
      map.set(key, list);
    }
    return map;
  }, [activeRisks]);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0.5 text-left text-xs">
          <thead>
            <tr>
              <th className="min-w-[44px] px-0.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-white/45">
                Imp ↓
              </th>
              {LIKELIHOOD_ORDER.map((level) => (
                <th
                  key={level}
                  className="min-w-[40px] px-0.5 py-0.5 text-center text-[9px] font-medium uppercase tracking-[0.1em] text-white/45"
                >
                  {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IMPACT_ORDER.map((impact) => (
              <tr key={impact}>
                <td className="rounded border border-white/10 bg-black/30 px-1 py-0.5 text-[10px] font-semibold text-white/70">
                  {impact}
                </td>
                {LIKELIHOOD_ORDER.map((likelihood) => {
                  const cellRisks = risksByCell.get(`${impact}:${likelihood}`) ?? [];
                  const count = cellRisks.length;
                  const rating = computeTiRiskRating(impact, likelihood);
                  const href =
                    count === 1
                      ? `${riskRegisterHref}?riskId=${encodeURIComponent(cellRisks[0]!.id)}`
                      : count > 1
                        ? `${riskRegisterHref}?impact=${impact}&likelihood=${likelihood}`
                        : riskRegisterHref;
                  return (
                    <td key={`${impact}-${likelihood}`} className="p-0.5">
                      <Link
                        href={href}
                        title={`Impact ${impact} · Likelihood ${likelihood} · ${count} risk(s)`}
                        className={cn(
                          "flex h-8 w-full min-w-[40px] flex-col items-center justify-center rounded border text-center transition hover:ring-1 hover:ring-emerald-400/40",
                          heatCellTone(rating),
                          count === 0 && "pointer-events-none opacity-35",
                        )}
                      >
                        <span className="text-xs font-semibold tabular-nums">
                          {count > 0 ? count : "—"}
                        </span>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href={riskRegisterHref}
        className="inline-flex text-xs font-semibold text-emerald-200 hover:text-emerald-100"
      >
        Open Risk Register →
      </Link>
    </div>
  );
}
