"use client";

import type { WolfEstateAlert } from "@/lib/wolf/central/types";
import { WolfStatusPill, wolfCardClass, wolfEyebrowClass } from "@/components/wolf/wolf-ui";

type WolfWatchProps = {
  alerts: WolfEstateAlert[];
};

export default function WolfWatch({ alerts }: WolfWatchProps) {
  return (
    <section className={`${wolfCardClass} p-5 sm:p-6`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className={wolfEyebrowClass}>WOLF Watch</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Operational intelligence</h2>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
          Know before the client knows
        </span>
      </div>
      <ul className="space-y-3">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="rounded-xl border border-white/[0.06] bg-black/25 px-4 py-3 transition-colors hover:border-white/12"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{alert.reserveName}</p>
                <p className="mt-0.5 text-sm text-white/75">{alert.title}</p>
                <p className="mt-1 text-xs text-white/50">{alert.detail}</p>
              </div>
              <WolfStatusPill status={alert.severity} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
