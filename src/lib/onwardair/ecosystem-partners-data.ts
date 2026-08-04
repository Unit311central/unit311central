/**
 * OnwardAir Ecosystem Partners — who matters before commercial ops.
 *
 * Replaces Potential Clients TAM for OnwardAir Intelligence. Pre-revenue focus:
 * airport/vertiport authorities, middle-mile logistics, investors, regulators/advisors.
 * Honest blanks preferred over invention.
 */

export type EcosystemPartnerCategory =
  | "Airport / Vertiport"
  | "Middle-mile Logistics"
  | "Investor / Strategic"
  | "Regulator / Advisor"
  | "Defense / Public Sector";

export type EcosystemEngagementStatus =
  | "Active trial"
  | "Engaged"
  | "Priority target"
  | "Watch"
  | "Advisor relationship";

export type EcosystemPartner = {
  id: string;
  name: string;
  category: EcosystemPartnerCategory;
  region: string;
  status: EcosystemEngagementStatus;
  whyItMatters: string;
  nextEngagement: string;
  owner: string;
  relatedProgram: string;
  website: string;
  notes?: string;
};

export const ECOSYSTEM_PARTNERS: EcosystemPartner[] = [
  {
    id: "coastal-freight-partners",
    name: "Coastal Freight Partners",
    category: "Middle-mile Logistics",
    region: "Gulf Coast · United States",
    status: "Active trial",
    whyItMatters:
      "Primary middle-mile logistics trial partner for Vertex VTOL / FLEX Pod corridor learning before commercial ops.",
    nextEngagement: "Trial ops review · evidence pack for corridor lessons learned",
    owner: "Marcus Bell",
    relatedProgram: "External · Coastal Freight Partners trial",
    website: "https://onwardair.unit311central.com/coastalfreightpartners.com",
    notes: "Client portal live on OnwardAir surface.",
  },
  {
    id: "faa-aam",
    name: "FAA — Advanced Air Mobility / Aircraft Certification",
    category: "Regulator / Advisor",
    region: "United States",
    status: "Priority target",
    whyItMatters:
      "Type certification, airworthiness, and AAM guidance set the critical path for Vertex — the only customer that can stop the calendar.",
    nextEngagement: "Programme Manager cadence on FAA pathway gates (oa-int-faa-pathway)",
    owner: "Elena Rossi",
    relatedProgram: "Internal · FAA Type Certification Pathway",
    website: "https://www.faa.gov/air-taxis",
  },
  {
    id: "houston-airport-system",
    name: "Houston Airport System (HAS)",
    category: "Airport / Vertiport",
    region: "Houston · Texas",
    status: "Priority target",
    whyItMatters:
      "HQ-market airport authority for vertiport / airspace access near future Gulf Coast middle-mile corridors.",
    nextEngagement: "Introductory authority briefing · noise and corridor constraints",
    owner: "Brian Whiteside",
    relatedProgram: "Internal · Corridor & airspace readiness",
    website: "https://www.fly2houston.com/",
  },
  {
    id: "easa-sc-vtol",
    name: "EASA — SC-VTOL / UAM policy watch",
    category: "Regulator / Advisor",
    region: "Europe",
    status: "Watch",
    whyItMatters:
      "Secondary dual-path legislation watch. SC-VTOL and U-space language may inform design margins even if FAA is primary.",
    nextEngagement: "Quarterly watch brief into Regulatory Intelligence (when live)",
    owner: "Elena Rossi",
    relatedProgram: "Internal · Dual-path certification awareness",
    website: "https://www.easa.europa.eu/en/domains/urban-air-mobility-uam",
  },
  {
    id: "nasa-aam",
    name: "NASA Advanced Air Mobility",
    category: "Defense / Public Sector",
    region: "United States",
    status: "Watch",
    whyItMatters:
      "AAM research, noise, and integration studies often foreshadow FAA guidance useful for a 5-year cert runway.",
    nextEngagement: "Track published AAM / noise / integration reports for design inputs",
    owner: "Scott Parazynski",
    relatedProgram: "Internal · Engineering assurance inputs",
    website: "https://www.nasa.gov/mission/aam/",
  },
  {
    id: "as9100-qms-advisor",
    name: "AS9100 / aerospace QMS registrar path",
    category: "Regulator / Advisor",
    region: "United States",
    status: "Engaged",
    whyItMatters:
      "Quality system maturity is a gate for aerospace supply and certification evidence — not optional for Vertex.",
    nextEngagement: "Align QMS CAPA / audit calendar with cert evidence needs",
    owner: "Elena Rossi",
    relatedProgram: "Internal · AS9100 QMS programme",
    website: "",
    notes: "Treat as advisory relationship track; specific registrar TBD — left blank.",
  },
  {
    id: "strategic-aerospace-capital",
    name: "Strategic aerospace / AAM capital (target)",
    category: "Investor / Strategic",
    region: "United States / Global",
    status: "Priority target",
    whyItMatters:
      "Pre-revenue survival through a multi-year cert slog depends on patient capital that understands FAA calendars.",
    nextEngagement: "Board one-pager: runway + cert gate risks (CoS brief)",
    owner: "Brian Whiteside",
    relatedProgram: "Fundraising · certification-aligned capital",
    website: "",
    notes: "Placeholder relationship class — no named fund invented.",
  },
  {
    id: "gulf-coast-vertiport-infra",
    name: "Gulf Coast vertiport / ground infrastructure partners",
    category: "Airport / Vertiport",
    region: "Gulf Coast · United States",
    status: "Watch",
    whyItMatters:
      "FLEX Pod and middle-mile ops need ground nodes long before passenger vertiports matter.",
    nextEngagement: "Map candidate nodes against Coastal Freight corridor learning",
    owner: "Marcus Bell",
    relatedProgram: "External · Coastal corridor ground nodes",
    website: "",
  },
  {
    id: "usaf-contested-logistics",
    name: "US DoD / contested logistics interest (watch)",
    category: "Defense / Public Sector",
    region: "United States",
    status: "Watch",
    whyItMatters:
      "Defense logistics demand can fund early flight hours and utility certification paths (see Beta analogue).",
    nextEngagement: "Monitor AFWERX / logistics RFI language relevant to VTOL cargo",
    owner: "Scott Parazynski",
    relatedProgram: "Internal · Defense utility pathway awareness",
    website: "",
    notes: "No active contract claimed — watch only.",
  },
  {
    id: "battery-propulsion-supply",
    name: "Battery & propulsion supply partners (critical path)",
    category: "Investor / Strategic",
    region: "United States / Allied",
    status: "Engaged",
    whyItMatters:
      "Battery and propulsion are top certification-calendar failure modes — supply partners are ecosystem, not commodity vendors.",
    nextEngagement: "Link supply readiness to Engineering Risks + cert evidence pack",
    owner: "Marcus Bell",
    relatedProgram: "Internal · Supply & dependencies",
    website: "",
    notes: "Named suppliers intentionally blank until disclosed.",
  },
];

export const ECOSYSTEM_PARTNERS_INTRO = {
  eyebrow: "OnwardAir Intelligence · Pre-ops ecosystem",
  title: "Ecosystem Partners",
  description:
    "Who matters before commercial ops: airport and vertiport authorities, middle-mile logistics partners, regulators and advisors, and patient capital. Not a country TAM chart.",
} as const;

export const ECOSYSTEM_FILTERS = {
  categories: Array.from(new Set(ECOSYSTEM_PARTNERS.map((p) => p.category))).sort(),
  statuses: Array.from(new Set(ECOSYSTEM_PARTNERS.map((p) => p.status))).sort(),
  regions: Array.from(new Set(ECOSYSTEM_PARTNERS.map((p) => p.region))).sort(),
};

export function listEcosystemPartners(): EcosystemPartner[] {
  return ECOSYSTEM_PARTNERS;
}

export function getEcosystemPartner(id: string): EcosystemPartner | null {
  return ECOSYSTEM_PARTNERS.find((p) => p.id === id) ?? null;
}

export function searchEcosystemPartners(query: string): EcosystemPartner[] {
  const q = query.trim().toLowerCase();
  if (!q) return ECOSYSTEM_PARTNERS;
  return ECOSYSTEM_PARTNERS.filter((p) =>
    [p.name, p.category, p.region, p.status, p.whyItMatters, p.owner, p.relatedProgram]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

export function filterEcosystemPartners(
  partners: EcosystemPartner[],
  filters: { category?: string; status?: string },
): EcosystemPartner[] {
  return partners.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.status && p.status !== filters.status) return false;
    return true;
  });
}
