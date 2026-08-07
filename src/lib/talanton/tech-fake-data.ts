/**
 * Talanton Impact — Technology Management fixtures (Nairobi + Newtown Square · USD).
 */

export type TiTechDevice = {
  id: string;
  name: string;
  type: string;
  assignedTo: string;
  location: string;
  status: "In use" | "Spare" | "Repair";
  warranty: string;
};

export type TiTechTelecom = {
  id: string;
  service: string;
  carrier: string;
  numberOrCircuit: string;
  assignedTo: string;
  monthlyCostUsd: number;
  status: "Active" | "Pending" | "Cancelled";
  manufacturer?: string;
  model?: string;
};

export type TiTechRenewalItem = {
  id: string;
  label: string;
  category: "Software" | "Telecom" | "Device";
  dueDate: string;
  costUsd: number;
};

export type TiTechAsset = {
  id: string;
  tag: string;
  name: string;
  category: string;
  owner: string;
  location: string;
  valueUsd: number;
};

export type TiTechReport = {
  id: string;
  title: string;
  category: string;
  period: string;
  owner: string;
  status: "Ready" | "Draft" | "Scheduled";
  summary: string;
  generatedAt: string;
};

export const TI_TELECOMS_STORAGE_KEY = "unit311-ti-telecoms-v1";

export function isTiMobileTelecomService(service: string): boolean {
  return /mobile/i.test(service);
}

export const TI_TECH_DEVICES: TiTechDevice[] = [
  {
    id: "ti-dev-1",
    name: "MacBook Pro 14\" M3",
    type: "Laptop",
    assignedTo: "David Simms",
    location: "Newtown Square HQ",
    status: "In use",
    warranty: "Apr 2027",
  },
  {
    id: "ti-dev-2",
    name: "MacBook Air M3",
    type: "Laptop",
    assignedTo: "Iris Liang",
    location: "Newtown Square HQ",
    status: "In use",
    warranty: "Jun 2027",
  },
  {
    id: "ti-dev-3",
    name: "Dell Latitude 7440",
    type: "Laptop",
    assignedTo: "Andy Moore",
    location: "Nairobi Office",
    status: "In use",
    warranty: "May 2027",
  },
  {
    id: "ti-dev-4",
    name: "Lenovo ThinkPad X1 Carbon",
    type: "Laptop",
    assignedTo: "Cynthia Omondi",
    location: "Nairobi Office",
    status: "In use",
    warranty: "Jul 2027",
  },
  {
    id: "ti-dev-5",
    name: "iPhone 15 Pro",
    type: "Mobile",
    assignedTo: "Michelle Ochieng",
    location: "Nairobi Office",
    status: "In use",
    warranty: "Oct 2026",
  },
  {
    id: "ti-dev-6",
    name: "iPhone 14",
    type: "Mobile",
    assignedTo: "Kenneth Muchina",
    location: "Nairobi Office",
    status: "In use",
    warranty: "Aug 2026",
  },
  {
    id: "ti-dev-7",
    name: "Dell UltraSharp U2723QE",
    type: "Monitor",
    assignedTo: "Mercy Nelima",
    location: "Nairobi Office",
    status: "In use",
    warranty: "Mar 2027",
  },
  {
    id: "ti-dev-8",
    name: "MacBook Pro 14 — spare",
    type: "Laptop",
    assignedTo: "IT Spare Pool",
    location: "Newtown Square HQ",
    status: "Spare",
    warranty: "Jan 2027",
  },
  {
    id: "ti-dev-9",
    name: "Surface Laptop 5",
    type: "Laptop",
    assignedTo: "Desiree Latu",
    location: "Newtown Square HQ",
    status: "Repair",
    warranty: "Nov 2026",
  },
  {
    id: "ti-dev-10",
    name: "iPad Air",
    type: "Tablet",
    assignedTo: "Brooke Wyman",
    location: "Newtown Square HQ",
    status: "In use",
    warranty: "Sep 2026",
  },
];

export const TI_TECH_TELECOMS: TiTechTelecom[] = [
  {
    id: "ti-tel-1",
    service: "Mobile plan",
    carrier: "Safaricom Business",
    numberOrCircuit: "+254 712 555 014",
    assignedTo: "Cynthia Omondi",
    monthlyCostUsd: 42,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15 Pro",
  },
  {
    id: "ti-tel-2",
    service: "Mobile plan",
    carrier: "AT&T Business",
    numberOrCircuit: "+1 610 555 0198",
    assignedTo: "David Simms",
    monthlyCostUsd: 78,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15 Pro",
  },
  {
    id: "ti-tel-3",
    service: "Office fibre",
    carrier: "Safaricom Fibre",
    numberOrCircuit: "SAF-NBO-TI-2201",
    assignedTo: "Nairobi Office",
    monthlyCostUsd: 285,
    status: "Active",
  },
  {
    id: "ti-tel-4",
    service: "US HQ broadband",
    carrier: "Comcast Business",
    numberOrCircuit: "CMC-PA-TI-884",
    assignedTo: "Newtown Square HQ",
    monthlyCostUsd: 195,
    status: "Active",
  },
  {
    id: "ti-tel-5",
    service: "Field hotspot SIMs",
    carrier: "Airtel Kenya",
    numberOrCircuit: "Pool × 6 SIMs",
    assignedTo: "Investment team",
    monthlyCostUsd: 96,
    status: "Active",
  },
  {
    id: "ti-tel-6",
    service: "VoIP lines",
    carrier: "RingCentral",
    numberOrCircuit: "RC-TI-MAIN",
    assignedTo: "Fund Operations",
    monthlyCostUsd: 124,
    status: "Active",
  },
];

export const TI_TECH_ASSETS: TiTechAsset[] = [
  {
    id: "ti-ta-1",
    tag: "TI-LT-001",
    name: "MacBook Pro 14 — David Simms",
    category: "Laptop",
    owner: "David Simms",
    location: "Newtown Square HQ",
    valueUsd: 2499,
  },
  {
    id: "ti-ta-2",
    tag: "TI-NET-001",
    name: "UniFi office stack (Nairobi)",
    category: "Networking",
    owner: "Technology",
    location: "Nairobi Office",
    valueUsd: 4200,
  },
  {
    id: "ti-ta-3",
    tag: "TI-AV-001",
    name: "Boardroom AV (video + audio)",
    category: "AV",
    owner: "Operations",
    location: "Newtown Square HQ",
    valueUsd: 3800,
  },
  {
    id: "ti-ta-4",
    tag: "TI-ST-001",
    name: "Synology NAS — fund documents",
    category: "Storage",
    owner: "Fund Operations",
    location: "Newtown Square HQ",
    valueUsd: 2900,
  },
  {
    id: "ti-ta-5",
    tag: "TI-PH-003",
    name: "iPhone 15 Pro — Michelle Ochieng",
    category: "Mobile",
    owner: "Michelle Ochieng",
    location: "Nairobi Office",
    valueUsd: 1199,
  },
];

export const TI_UPCOMING_TECH_RENEWALS: TiTechRenewalItem[] = [
  {
    id: "ti-ren-1",
    label: "Microsoft 365 Business Premium",
    category: "Software",
    dueDate: "2026-10-01",
    costUsd: 4320,
  },
  {
    id: "ti-ren-2",
    label: "Salesforce Nonprofit Cloud",
    category: "Software",
    dueDate: "2026-09-20",
    costUsd: 14_400,
  },
  {
    id: "ti-ren-3",
    label: "Safaricom Fibre — Nairobi",
    category: "Telecom",
    dueDate: "2026-11-01",
    costUsd: 3420,
  },
  {
    id: "ti-ren-4",
    label: "DocuSign + Zoom Business",
    category: "Software",
    dueDate: "2026-12-01",
    costUsd: 4800,
  },
  {
    id: "ti-ren-5",
    label: "MacBook Pro 14 — David Simms",
    category: "Device",
    dueDate: "2027-04-12",
    costUsd: 2499,
  },
];

export const TI_TECH_REPORTS: TiTechReport[] = [
  {
    id: "ti-rpt-1",
    title: "Device utilisation — Nairobi & US offices",
    category: "Devices",
    period: "Q2 2026",
    owner: "Andy Moore",
    status: "Ready",
    summary:
      "In-use vs spare vs repair across laptops, mobiles and monitors. One laptop in repair; spare pool healthy.",
    generatedAt: "2026-07-25",
  },
  {
    id: "ti-rpt-2",
    title: "SaaS licence compliance & seat allocation",
    category: "Software",
    period: "Jul 2026",
    owner: "Mercy Nelima",
    status: "Ready",
    summary:
      "Seat usage for M365, Salesforce, DocuSign and Zoom across Nairobi and US staff. Flags unused seats and renewals.",
    generatedAt: "2026-07-28",
  },
  {
    id: "ti-rpt-3",
    title: "Telecom spend forecast (USD)",
    category: "Telecom",
    period: "FY2026 H2",
    owner: "Carol Rubiro",
    status: "Ready",
    summary:
      "Run-rate for Safaricom fibre, US broadband, mobile plans and field SIMs across East Africa field team.",
    generatedAt: "2026-08-01",
  },
  {
    id: "ti-rpt-4",
    title: "Technology renewal calendar",
    category: "Renewals",
    period: "Next 6 months",
    owner: "Andy Moore",
    status: "Scheduled",
    summary:
      "Salesforce, M365, fibre circuits, DocuSign/Zoom bundle and MD laptop refresh windows with USD estimates.",
    generatedAt: "2026-08-02",
  },
  {
    id: "ti-rpt-5",
    title: "Fund data security & backup posture",
    category: "Infrastructure",
    period: "Aug 2026",
    owner: "David Simms",
    status: "Draft",
    summary:
      "NAS backup RPO for LP reporting, Nairobi office network uptime, and MFA coverage across portfolio portals.",
    generatedAt: "2026-08-03",
  },
];

export function loadTiTelecoms(): TiTechTelecom[] {
  if (typeof window === "undefined") return [...TI_TECH_TELECOMS];
  try {
    const raw = window.localStorage.getItem(TI_TELECOMS_STORAGE_KEY);
    if (!raw) return [...TI_TECH_TELECOMS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...TI_TECH_TELECOMS];
    return parsed.filter(
      (row): row is TiTechTelecom =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as TiTechTelecom).id === "string" &&
        typeof (row as TiTechTelecom).service === "string",
    );
  } catch {
    return [...TI_TECH_TELECOMS];
  }
}

export function saveTiTelecoms(rows: readonly TiTechTelecom[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TI_TELECOMS_STORAGE_KEY, JSON.stringify(rows));
}

export function sumTiTelecomMonthlySpend(rows: readonly TiTechTelecom[]): number {
  return rows.reduce((sum, row) => sum + row.monthlyCostUsd, 0);
}

export function buildTiTechSpendTrend(input: {
  softwareMonthlyUsd: number;
  telecomMonthlyUsd: number;
}) {
  const latest = input.softwareMonthlyUsd + input.telecomMonthlyUsd;
  const momPct = 2.1;
  const prior = latest / (1 + momPct / 100);
  const momUsd = Math.round(latest - prior);
  const labels = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const scale = [0.95, 0.97, 0.99, 1.01, 1.015, 1];
  const values = scale.map((factor) => Math.round(latest * factor));
  values[values.length - 1] = Math.round(latest);
  return { momPct, momUsd, labels, values, latest: Math.round(latest) };
}
