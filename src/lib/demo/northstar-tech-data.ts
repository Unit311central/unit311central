export type NorthstarTechSpendSnapshot = {
  lastMonthGbp: number;
  upcomingGbp: number;
};

export const NORTHSTAR_TECH_HARDWARE: NorthstarTechSpendSnapshot & {
  physicalAssets: number;
} = {
  lastMonthGbp: 18_420,
  upcomingGbp: 9_675,
  physicalAssets: 142,
};

export const NORTHSTAR_TECH_TELECOM: NorthstarTechSpendSnapshot = {
  lastMonthGbp: 4_280,
  upcomingGbp: 1_890,
};

export function buildNorthstarTechSpendTrend(input: {
  softwareMonthlyGbp: number;
  hardwareMonthlyGbp?: number;
  telecomMonthlyGbp?: number;
}) {
  const hardware = input.hardwareMonthlyGbp ?? Math.round(NORTHSTAR_TECH_HARDWARE.lastMonthGbp);
  const telecom = input.telecomMonthlyGbp ?? NORTHSTAR_TECH_TELECOM.lastMonthGbp;
  const software = Math.round(input.softwareMonthlyGbp);
  const labels = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const multipliers = [0.88, 0.91, 0.94, 0.97, 1, 1.03];
  const base = hardware + telecom + software;
  const values = multipliers.map((factor) => Math.round(base * factor));
  const first = values[0] ?? base;
  const last = values[values.length - 1] ?? base;
  const changePct = first > 0 ? ((last - first) / first) * 100 : 0;
  return { labels, values, changePct, currentMonthly: last };
}

export function formatNorthstarTechGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}
