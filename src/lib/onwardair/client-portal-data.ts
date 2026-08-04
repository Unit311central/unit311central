/**
 * OnwardAir client portal — Coastal Freight Partners VTOL programme data.
 */

export type OaClientPortalSection =
  | "dashboard"
  | "fleet"
  | "missions"
  | "documents"
  | "support";

export type OaClientNavItem = {
  id: OaClientPortalSection;
  label: string;
  hrefSuffix: string;
};

export type OaClientNavGroup = {
  id: string;
  label: string | null;
  items: OaClientNavItem[];
};

export const OA_CLIENT_PORTAL_NAV: readonly OaClientNavGroup[] = [
  {
    id: "home",
    label: null,
    items: [{ id: "dashboard", label: "Programme Dashboard", hrefSuffix: "" }],
  },
  {
    id: "ops",
    label: "Operations",
    items: [
      { id: "fleet", label: "Fleet & VTOL", hrefSuffix: "/fleet" },
      { id: "missions", label: "Missions & Corridors", hrefSuffix: "/missions" },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "documents", label: "Documents", hrefSuffix: "/documents" },
      { id: "support", label: "Support", hrefSuffix: "/support" },
    ],
  },
] as const;

export function oaClientPortalHref(companyPath: string, hrefSuffix: string) {
  return `/${companyPath}${hrefSuffix}`;
}

export function parseOaClientPortalSection(
  section: string[] | undefined,
): OaClientPortalSection | null {
  const parts = (section ?? []).map((p) => p.toLowerCase()).filter(Boolean);
  if (parts.length === 0) return "dashboard";
  if (parts[0] === "fleet") return "fleet";
  if (parts[0] === "missions") return "missions";
  if (parts[0] === "documents") return "documents";
  if (parts[0] === "support") return "support";
  return null;
}

export type OaPortalKpi = { id: string; label: string; value: string; hint: string };

export type OaPortalAircraft = {
  id: string;
  name: string;
  type: string;
  status: "Flight ready" | "Maintenance" | "Demo configured" | "In trial";
  location: string;
  utilizationPct: number;
  nextEvent: string;
};

export type OaPortalMission = {
  id: string;
  name: string;
  corridor: string;
  payload: string;
  status: "Scheduled" | "Completed" | "Planning" | "On hold";
  date: string;
  aircraft: string;
};

export type OaPortalDocument = {
  id: string;
  title: string;
  kind: string;
  updatedAt: string;
};

export type OaPortalSupportTicket = {
  id: string;
  subject: string;
  status: "Open" | "Waiting" | "Resolved";
  updatedAt: string;
};

export function getCoastalFreightPortalData() {
  const kpis: OaPortalKpi[] = [
    {
      id: "k1",
      label: "Assigned VTOLs",
      value: "2",
      hint: "Vertex trial fleet",
    },
    {
      id: "k2",
      label: "Active corridors",
      value: "3",
      hint: "Gulf Coast middle-mile",
    },
    {
      id: "k3",
      label: "Missions (30d)",
      value: "14",
      hint: "Demo + rehearsal",
    },
    {
      id: "k4",
      label: "Avg turn time",
      value: "18 min",
      hint: "FLEX Pod™ swap target ≤15",
    },
  ];

  const aircraft: OaPortalAircraft[] = [
    {
      id: "ac-1",
      name: "Vertex VTOL™ · CFP-01",
      type: "Vertex multi-mission VTOL",
      status: "In trial",
      location: "Houston · Port of Houston pad",
      utilizationPct: 62,
      nextEvent: "Galveston middle-mile rehearsal · 12 Aug 2026",
    },
    {
      id: "ac-2",
      name: "Vertex VTOL™ · CFP-02",
      type: "Vertex multi-mission VTOL",
      status: "Demo configured",
      location: "Houston HQ · Flight Test staging",
      utilizationPct: 28,
      nextEvent: "FLEX Pod cargo ICD fit-check · 18 Aug 2026",
    },
  ];

  const missions: OaPortalMission[] = [
    {
      id: "m1",
      name: "Houston → Galveston parcel relay",
      corridor: "IAH corridor · Port of Houston → Galveston",
      payload: "FLEX Pod™ · dry goods (mock)",
      status: "Completed",
      date: "2026-07-28",
      aircraft: "CFP-01",
    },
    {
      id: "m2",
      name: "Galveston → Corpus Christi time-critical",
      corridor: "Gulf Coast middle-mile",
      payload: "FLEX Pod™ · cold-chain pharmacy (demo)",
      status: "Scheduled",
      date: "2026-08-12",
      aircraft: "CFP-01",
    },
    {
      id: "m3",
      name: "Port of Houston pad CONOPS drill",
      corridor: "Houston HQ · operator pad",
      payload: "Empty pod swap drill",
      status: "Planning",
      date: "2026-08-20",
      aircraft: "CFP-02",
    },
    {
      id: "m4",
      name: "Weather abort rehearsal",
      corridor: "Galveston coastal",
      payload: "Training payload",
      status: "On hold",
      date: "2026-08-25",
      aircraft: "CFP-01",
    },
  ];

  const documents: OaPortalDocument[] = [
    {
      id: "d1",
      title: "Coastal Freight · Vertex Trial CONOPS v1.2",
      kind: "CONOPS",
      updatedAt: "2026-07-30",
    },
    {
      id: "d2",
      title: "FLEX Pod™ ICD excerpt — Coastal pad interfaces",
      kind: "ICD",
      updatedAt: "2026-08-01",
    },
    {
      id: "d3",
      title: "Gulf Coast corridor risk register (shared)",
      kind: "Risk",
      updatedAt: "2026-07-22",
    },
    {
      id: "d4",
      title: "Trial SOW & milestone schedule",
      kind: "Commercial",
      updatedAt: "2026-06-18",
    },
    {
      id: "d5",
      title: "Operator readout — July demo day",
      kind: "Report",
      updatedAt: "2026-07-29",
    },
  ];

  const tickets: OaPortalSupportTicket[] = [
    {
      id: "t1",
      subject: "Pad power drop during Galveston rehearsal",
      status: "Open",
      updatedAt: "2026-08-03",
    },
    {
      id: "t2",
      subject: "Request updated FLEX Pod torque card",
      status: "Waiting",
      updatedAt: "2026-07-31",
    },
    {
      id: "t3",
      subject: "Access for Elena Vargas to shared data room",
      status: "Resolved",
      updatedAt: "2026-07-15",
    },
  ];

  const programmeNotes = [
    "Pilot corridor Houston–Galveston–Corpus Christi for Vertex multi-mission utilization.",
    "Trial focuses on middle-mile parcel and cold-chain pharmacy payloads via FLEX Pod™.",
    "OnwardAir programme lead: Brian Whiteside · Account: Carolyn Scott.",
  ];

  return { kpis, aircraft, missions, documents, tickets, programmeNotes };
}
