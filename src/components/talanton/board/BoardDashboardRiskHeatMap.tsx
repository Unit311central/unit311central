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

  const highlighted = useMemo(
    () => [...activeRisks].sort((a, b) => b.rating - a.rating).slice(0, 4),
    [activeRisks],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/50">
        Impact × likelihood from the live Risk Register. Cell colour reflects score (H=5, M=3, L=1).
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-1 text-left text-xs">
          <thead>
            <tr>
              <th className="min-w-[72px] px-1 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                Impact ↓
              </th>
              {LIKELIHOOD_ORDER.map((level) => (
                <th
                  key={level}
                  className="min-w-[56px] px-1 py-1 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/45"
                >
                  {level}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IMPACT_ORDER.map((impact) => (
              <tr key={impact}>
                <td className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-semibold text-white/70">
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
                          "flex h-11 w-full min-w-[56px] flex-col items-center justify-center rounded-lg border text-center transition hover:ring-1 hover:ring-emerald-400/40",
                          heatCellTone(rating),
                          count === 0 && "pointer-events-none opacity-35",
                        )}
                      >
                        <span className="text-sm font-semibold tabular-nums">
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
      {highlighted.length > 0 ? (
        <ul className="space-y-1.5">
          {highlighted.map((risk) => (
            <li key={risk.id}>
              <Link
                href={`${riskRegisterHref}?riskId=${encodeURIComponent(risk.id)}`}
                className="block rounded-lg border border-white/8 bg-black/20 px-2.5 py-2 text-sm text-white/80 transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.06]"
              >
                <span className="text-xs font-semibold text-emerald-200/90">{risk.id}</span>
                <span className="mx-1.5 text-white/30">·</span>
                <span className="line-clamp-1">{risk.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/45">No active risks in the register.</p>
      )}
      <Link
        href={riskRegisterHref}
        className="inline-flex text-xs font-semibold text-emerald-200 hover:text-emerald-100"
      >
        Open Risk Register →
      </Link>
    </div>
  );
}
