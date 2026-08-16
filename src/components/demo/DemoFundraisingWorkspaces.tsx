"use client";

import {
  NORTHSTAR_FUNDING_ROUNDS,
  NORTHSTAR_INVESTORS,
  NORTHSTAR_TOTAL_RAISED_GBP,
} from "@/lib/demo/fundraising-data";
import {
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
} from "@/components/testflighthub/corporate-ui";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    value,
  );
}

export function DemoFundraisingDashboardWorkspace() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Fundraising Dashboard</h1>
        <p className="mt-1 text-sm text-white/60">Northstar funding history and investor relations</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <CorporateKpiTile label="Total raised" value={formatGbp(NORTHSTAR_TOTAL_RAISED_GBP)} hint="3 rounds" />
        <CorporateKpiTile label="ARR" value={formatGbp(4_800_000)} hint="Current run-rate" />
        <CorporateKpiTile label="Cash" value={formatGbp(1_900_000)} hint="Treasury position" />
      </div>
      <CorporateSection title="Funding rounds">
        <div className="space-y-3">
          {NORTHSTAR_FUNDING_ROUNDS.map((round) => (
            <div
              key={round.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">
                  {round.label} · {round.year}
                </p>
                <p className="text-sm text-white/55">Lead: {round.lead}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{formatGbp(round.amountGbp)}</p>
                <CorporateStatusPill>{round.status}</CorporateStatusPill>
              </div>
            </div>
          ))}
        </div>
      </CorporateSection>
    </div>
  );
}

export function DemoFundraisingInvestorsWorkspace() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Investors</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {NORTHSTAR_INVESTORS.map((inv) => (
          <div key={inv.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-medium text-white">{inv.firm}</h2>
            <p className="text-sm text-white/55">{inv.contact}</p>
            <p className="mt-2 text-sm text-white/70">
              {inv.stage} · Last contact {inv.lastContact}
            </p>
            <CorporateStatusPill className="mt-3">{inv.status}</CorporateStatusPill>
          </div>
        ))}
      </div>
    </div>
  );
}
