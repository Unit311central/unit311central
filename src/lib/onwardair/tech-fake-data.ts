/**
 * OnwardAir-only Technology Management fixtures — Houston / USD.
 * Devices, telecoms, tech assets, renewals, and reports. Software & SaaS is DB-seeded.
 */

export type OaTechDevice = {
  id: string;
  name: string;
  type: string;
  assignedTo: string;
  location: string;
  status: "In use" | "Spare" | "Repair";
  warranty: string;
};

export type OaTechTelecom = {
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

export type OaTechRenewalItem = {
  id: string;
  label: string;
  category: "Software" | "Telecom" | "Device";
  dueDate: string;
  costUsd: number;
};

export type OaTechAsset = {
  id: string;
  tag: string;
  name: string;
  category: string;
  owner: string;
  location: string;
  valueUsd: number;
};

export type OaTechReport = {
  id: string;
  title: string;
  category: string;
  period: string;
  owner: string;
  status: "Ready" | "Draft" | "Scheduled";
  summary: string;
  generatedAt: string;
};

export const OA_TELECOMS_STORAGE_KEY = "unit311-oa-telecoms-v1";

export function isOaMobileTelecomService(service: string): boolean {
  return /mobile/i.test(service);
}

export const OA_TECH_DEVICES: OaTechDevice[] = [
  {
    id: "oa-dev-1",
    name: 'MacBook Pro 16" M3 Max',
    type: "Laptop",
    assignedTo: "Scott Parazynski",
    location: "Houston HQ",
    status: "In use",
    warranty: "Mar 2027",
  },
  {
    id: "oa-dev-2",
    name: "Dell Precision 5690",
    type: "Laptop",
    assignedTo: "Mike Teeter",
    location: "Houston Lab",
    status: "In use",
    warranty: "May 2027",
  },
  {
    id: "oa-dev-3",
    name: "Lenovo ThinkPad P16",
    type: "Laptop",
    assignedTo: "Keven Coates",
    location: "Houston Lab",
    status: "In use",
    warranty: "Jun 2027",
  },
  {
    id: "oa-dev-4",
    name: "iPhone 15 Pro",
    type: "Mobile",
    assignedTo: "Brian Whiteside",
    location: "Houston HQ",
    status: "In use",
    warranty: "Sep 2026",
  },
  {
    id: "oa-dev-5",
    name: "iPad Pro 12.9",
    type: "Tablet",
    assignedTo: "Carolyn Scott",
    location: "Houston HQ",
    status: "In use",
    warranty: "Jan 2027",
  },
  {
    id: "oa-dev-6",
    name: "Dell UltraSharp U3223QE",
    type: "Monitor",
    assignedTo: "David Colling",
    location: "Houston Lab",
    status: "In use",
    warranty: "Apr 2027",
  },
  {
    id: "oa-dev-7",
    name: "HP Z4 G5 Workstation",
    type: "Workstation",
    assignedTo: "Justin Dodrill",
    location: "Houston Lab",
    status: "In use",
    warranty: "Feb 2027",
  },
  {
    id: "oa-dev-8",
    name: "MacBook Pro 14 — spare pool",
    type: "Laptop",
    assignedTo: "IT Spare Pool",
    location: "Houston HQ",
    status: "Spare",
    warranty: "Aug 2026",
  },
  {
    id: "oa-dev-9",
    name: "Dell Latitude 5450",
    type: "Laptop",
    assignedTo: "Monte Mann",
    location: "Houston HQ",
    status: "Repair",
    warranty: "Nov 2026",
  },
  {
    id: "oa-dev-10",
    name: "CalDigit TS4 Dock",
    type: "Peripheral",
    assignedTo: "Jon Fenner",
    location: "Houston Lab",
    status: "In use",
    warranty: "Jul 2026",
  },
];

export const OA_TECH_TELECOMS: OaTechTelecom[] = [
  {
    id: "oa-tel-1",
    service: "Mobile plan",
    carrier: "AT&T Business",
    numberOrCircuit: "+1 713 555 0142",
    assignedTo: "Scott Parazynski",
    monthlyCostUsd: 85,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15 Pro",
  },
  {
    id: "oa-tel-2",
    service: "Mobile plan",
    carrier: "Verizon Business",
    numberOrCircuit: "+1 281 555 0198",
    assignedTo: "Brian Whiteside",
    monthlyCostUsd: 75,
    status: "Active",
    manufacturer: "Apple",
    model: "iPhone 15",
  },
  {
    id: "oa-tel-3",
    service: "Office fibre",
    carrier: "AT&T Fiber",
    numberOrCircuit: "ATT-HOU-OA-2201",
    assignedTo: "Houston HQ",
    monthlyCostUsd: 320,
    status: "Active",
  },
  {
    id: "oa-tel-4",
    service: "Lab dedicated circuit",
    carrier: "Comcast Business",
    numberOrCircuit: "CMC-LAB-OA-884",
    assignedTo: "Houston Lab",
    monthlyCostUsd: 180,
    status: "Active",
  },
  {
    id: "oa-tel-5",
    service: "Field hotspot SIMs",
    carrier: "T-Mobile Business",
    numberOrCircuit: "Pool × 6",
    assignedTo: "Flight Test Bay",
    monthlyCostUsd: 120,
    status: "Active",
  },
  {
    id: "oa-tel-6",
    service: "Teams Phone / DID",
    carrier: "Microsoft Teams Phone",
    numberOrCircuit: "+1 832 555 0100",
    assignedTo: "Reception",
    monthlyCostUsd: 48,
    status: "Pending",
  },
];

export const OA_TECH_ASSETS: OaTechAsset[] = [
  {
    id: "oa-ta-1",
    tag: "OA-LT-001",
    name: "MacBook Pro 16 — Scott Parazynski",
    category: "Laptop",
    owner: "Scott Parazynski",
    location: "Houston HQ",
    valueUsd: 3499,
  },
  {
    id: "oa-ta-2",
    tag: "OA-WS-002",
    name: "HP Z4 G5 — flight controls sim",
    category: "Workstation",
    owner: "Justin Dodrill",
    location: "Houston Lab",
    valueUsd: 4200,
  },
  {
    id: "oa-ta-3",
    tag: "OA-NET-001",
    name: "Ubiquiti UniFi switch stack",
    category: "Networking",
    owner: "Technology",
    location: "Houston HQ Comms",
    valueUsd: 1850,
  },
  {
    id: "oa-ta-4",
    tag: "OA-NAS-001",
    name: "Synology DS1823xs+ lab NAS",
    category: "Storage",
    owner: "Engineering",
    location: "Houston Lab",
    valueUsd: 3100,
  },
  {
    id: "oa-ta-5",
    tag: "OA-AV-001",
    name: "Boardroom AV kit (camera + mics)",
    category: "AV",
    owner: "Operations",
    location: "Houston HQ",
    valueUsd: 2200,
  },
  {
    id: "oa-ta-6",
    tag: "OA-PH-004",
    name: "iPhone 15 Pro — Brian Whiteside",
    category: "Mobile",
    owner: "Brian Whiteside",
    location: "Houston HQ",
    valueUsd: 1199,
  },
];

export const OA_UPCOMING_TECH_RENEWALS: OaTechRenewalItem[] = [
  {
    id: "oa-ren-1",
    label: "Microsoft 365 Business Premium",
    category: "Software",
    dueDate: "2026-10-01",
    costUsd: 5_184,
  },
  {
    id: "oa-ren-2",
    label: "SolidWorks Premium (5 seats)",
    category: "Software",
    dueDate: "2026-09-15",
    costUsd: 18_500,
  },
  {
    id: "oa-ren-3",
    label: "Office fibre — AT&T Fiber",
    category: "Telecom",
    dueDate: "2026-11-01",
    costUsd: 3_840,
  },
  {
    id: "oa-ren-4",
    label: "MATLAB + Simulink (3 seats)",
    category: "Software",
    dueDate: "2026-12-01",
    costUsd: 9_600,
  },
  {
    id: "oa-ren-5",
    label: "MacBook Pro 16 — Scott Parazynski",
    category: "Device",
    dueDate: "2027-03-12",
    costUsd: 3_499,
  },
];

/** Five COO / IT-ready reports for OnwardAir Technology Management. */
export const OA_TECH_REPORTS: OaTechReport[] = [
  {
    id: "oa-rpt-1",
    title: "Device utilisation — Houston estate",
    category: "Devices",
    period: "Q2 2026",
    owner: "Justin Dodrill",
    status: "Ready",
    summary:
      "In-use vs spare vs repair across laptops, workstations, and mobiles. 1 unit in repair; spare pool healthy at 1 laptop.",
    generatedAt: "2026-07-28",
  },
  {
    id: "oa-rpt-2",
    title: "SaaS licence compliance & seat waste",
    category: "Software",
    period: "Jul 2026",
    owner: "Monte Mann",
    status: "Ready",
    summary:
      "Seat allocation vs purchase for M365, SolidWorks, MATLAB, and Slack. Flags unused seats and upcoming renewals in USD.",
    generatedAt: "2026-07-30",
  },
  {
    id: "oa-rpt-3",
    title: "Telecom spend forecast (USD)",
    category: "Telecom",
    period: "FY2026 H2",
    owner: "Brian Whiteside",
    status: "Ready",
    summary:
      "Run-rate for fibre, lab circuit, mobile plans, and hotspot SIMs. Projects ~$10k/mo combined with software.",
    generatedAt: "2026-08-01",
  },
  {
    id: "oa-rpt-4",
    title: "Technology renewal calendar",
    category: "Renewals",
    period: "Next 6 months",
    owner: "Monte Mann",
    status: "Scheduled",
    summary:
      "SolidWorks, M365, AT&T fibre, MATLAB, and CEO laptop warranty/refresh windows with estimated USD costs.",
    generatedAt: "2026-08-02",
  },
  {
    id: "oa-rpt-5",
    title: "Lab network & storage health",
    category: "Infrastructure",
    period: "Aug 2026",
    owner: "Keven Coates",
    status: "Draft",
    summary:
      "UniFi stack uptime, NAS capacity for flight-test telemetry, and backup RPO for Houston Lab stores.",
    generatedAt: "2026-08-03",
  },
];

export function loadOaTelecoms(): OaTechTelecom[] {
  if (typeof window === "undefined") return [...OA_TECH_TELECOMS];
  try {
    const raw = window.localStorage.getItem(OA_TELECOMS_STORAGE_KEY);
    if (!raw) return [...OA_TECH_TELECOMS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...OA_TECH_TELECOMS];
    return parsed.filter(
      (row): row is OaTechTelecom =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as OaTechTelecom).id === "string" &&
        typeof (row as OaTechTelecom).service === "string",
    );
  } catch {
    return [...OA_TECH_TELECOMS];
  }
}

export function saveOaTelecoms(rows: readonly OaTechTelecom[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OA_TELECOMS_STORAGE_KEY, JSON.stringify(rows));
}

export function sumOaTelecomMonthlySpend(rows: readonly OaTechTelecom[]): number {
  return rows.reduce((sum, row) => sum + row.monthlyCostUsd, 0);
}

export function buildOaTechSpendTrend(input: {
  softwareMonthlyUsd: number;
  telecomMonthlyUsd: number;
}) {
  const latest = input.softwareMonthlyUsd + input.telecomMonthlyUsd;
  const momPct = 1.8;
  const prior = latest / (1 + momPct / 100);
  const momUsd = Math.round(latest - prior);
  const labels = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const scale = [0.94, 0.96, 0.98, 1.0, 1.012, 1];
  const values = scale.map((factor) => Math.round(latest * factor));
  values[values.length - 1] = Math.round(latest);
  return { momPct, momUsd, labels, values, latest: Math.round(latest) };
}
