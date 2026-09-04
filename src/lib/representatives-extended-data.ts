export type RepDocument = {
  id: string;
  title: string;
  type: "Contract" | "NDA" | "Commission schedule" | "Territory map";
  updatedAt: string;
};

export type RepCommissionRow = {
  repId: string;
  client: string;
  period: string;
  amountEur: number;
  status: "Paid" | "Outstanding" | "Upcoming";
};

export const REP_DOCUMENTS: Record<string, RepDocument[]> = {
  "rep-1": [
    { id: "d1", title: "Iberia distribution agreement 2026", type: "Contract", updatedAt: "2026-01-12" },
    { id: "d2", title: "Commission schedule Q1", type: "Commission schedule", updatedAt: "2026-02-01" },
  ],
  "rep-2": [
    { id: "d3", title: "Portugal agency NDA", type: "NDA", updatedAt: "2025-11-20" },
  ],
  "rep-3": [
    { id: "d4", title: "UK territory map", type: "Territory map", updatedAt: "2026-03-05" },
  ],
};

export const REP_COMMISSIONS: RepCommissionRow[] = [
  { repId: "rep-1", client: "Catalonia Energy Partners", period: "Mar 2026", amountEur: 12400, status: "Paid" },
  { repId: "rep-1", client: "Iberia Infrastructure Group", period: "Q2 2026", amountEur: 8600, status: "Outstanding" },
  { repId: "rep-2", client: "Douro Maritime Logistics", period: "Apr 2026", amountEur: 5200, status: "Upcoming" },
  { repId: "rep-3", client: "Oxford Heritage Survey", period: "Feb 2026", amountEur: 3100, status: "Paid" },
];

/** ABHI membership agents — £5,000 outstanding each (£10k total). */
export const ABHI_REP_COMMISSIONS: RepCommissionRow[] = [
  {
    repId: "rep-abhi-1",
    client: "Oxbridge MedTech Ltd",
    period: "Aug 2026",
    amountEur: 5000,
    status: "Outstanding",
  },
  {
    repId: "rep-abhi-2",
    client: "Cambridge Diagnostics Group",
    period: "Aug 2026",
    amountEur: 5000,
    status: "Outstanding",
  },
];

/** OmniTransit (SAEC) partner commissions — ZAR amounts in amountEur field. */
export const OMNITRANSIT_REP_COMMISSIONS: RepCommissionRow[] = [
  {
    repId: "rep-omt-1",
    client: "Hyprop Investments",
    period: "Aug 2026",
    amountEur: 185_000,
    status: "Paid",
  },
  {
    repId: "rep-omt-1",
    client: "Growthpoint Properties",
    period: "Q3 2026",
    amountEur: 142_500,
    status: "Outstanding",
  },
  {
    repId: "rep-omt-2",
    client: "Redefine Properties",
    period: "Jul 2026",
    amountEur: 96_800,
    status: "Upcoming",
  },
  {
    repId: "rep-omt-3",
    client: "Attacq Limited",
    period: "Aug 2026",
    amountEur: 78_400,
    status: "Outstanding",
  },
];

/** Northstar demo partners — amounts stored in amountEur field, displayed as GBP. */
export const NORTHSTAR_REP_COMMISSIONS: RepCommissionRow[] = [
  {
    repId: "rep-nst-1",
    client: "Sheffield Precision Engineering",
    period: "Aug 2026",
    amountEur: 12_400,
    status: "Paid",
  },
  {
    repId: "rep-nst-1",
    client: "Trafford Packaging Ltd",
    period: "Q3 2026",
    amountEur: 8_600,
    status: "Outstanding",
  },
  {
    repId: "rep-nst-2",
    client: "Bristol Composites Ltd",
    period: "Jul 2026",
    amountEur: 5_200,
    status: "Upcoming",
  },
  {
    repId: "rep-nst-3",
    client: "Cardiff Port Logistics",
    period: "Aug 2026",
    amountEur: 4_800,
    status: "Paid",
  },
  {
    repId: "nst-partner-1",
    client: "Peak District Breweries",
    period: "Q3 2026",
    amountEur: 6_200,
    status: "Outstanding",
  },
  {
    repId: "nst-partner-2",
    client: "Nottingham Automation Group",
    period: "Sep 2026",
    amountEur: 3_400,
    status: "Outstanding",
  },
];

function activeRepCommissions(): RepCommissionRow[] {
  if (typeof window !== "undefined") {
    try {
      const { isOnwardAirBusinessCentralFixtures, getOaPartnerCommissions } =
        require("@/lib/onwardair/business-central-data") as typeof import("@/lib/onwardair/business-central-data");
      if (isOnwardAirBusinessCentralFixtures()) return getOaPartnerCommissions();
    } catch {
      // Fall through.
    }
    try {
      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (isBrowserAbhiSurface()) return ABHI_REP_COMMISSIONS;
    } catch {
      // Fall through.
    }
    try {
      const { isBrowserSaecSurface } =
        require("@/lib/saec-surface") as typeof import("@/lib/saec-surface");
      if (isBrowserSaecSurface()) return OMNITRANSIT_REP_COMMISSIONS;
    } catch {
      // Fall through.
    }
    try {
      const { isNorthstarDemoBrowser } =
        require("@/lib/demo/module-fixtures") as typeof import("@/lib/demo/module-fixtures");
      if (isNorthstarDemoBrowser()) return NORTHSTAR_REP_COMMISSIONS;
    } catch {
      // Fall through.
    }
    try {
      const { isBrowserGreenDesertSurface } =
        require("@/lib/greendesert-surface") as typeof import("@/lib/greendesert-surface");
      if (isBrowserGreenDesertSurface()) return [];
    } catch {
      // Fall through.
    }
  }
  return REP_COMMISSIONS;
}

export function commissionSummaryForRep(repId: string) {
  const rows = activeRepCommissions().filter((row) => row.repId === repId);
  const paid = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + r.amountEur, 0);
  const outstanding = rows.filter((r) => r.status === "Outstanding").reduce((s, r) => s + r.amountEur, 0);
  const upcoming = rows.filter((r) => r.status === "Upcoming").reduce((s, r) => s + r.amountEur, 0);
  return { paid, outstanding, upcoming, rows };
}

export function commissionTrendForRep(repId: string) {
  const rows = activeRepCommissions().filter((row) => row.repId === repId);
  const byPeriod = new Map<string, { paid: number; outstanding: number; upcoming: number }>();

  for (const row of rows) {
    const current = byPeriod.get(row.period) ?? { paid: 0, outstanding: 0, upcoming: 0 };
    if (row.status === "Paid") current.paid += row.amountEur;
    if (row.status === "Outstanding") current.outstanding += row.amountEur;
    if (row.status === "Upcoming") current.upcoming += row.amountEur;
    byPeriod.set(row.period, current);
  }

  return Array.from(byPeriod.entries()).map(([period, values]) => ({
    period,
    ...values,
    total: values.paid + values.outstanding + values.upcoming,
  }));
}
