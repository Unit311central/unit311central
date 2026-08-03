/**
 * OnwardAir Competitor Intelligence — Business Central module.
 *
 * Populated from public sources (company sites, press releases, industry reporting).
 * Fields are left blank rather than invented where a confident public figure is not
 * available. `dataNotes` flags fields that are industry-estimated rather than
 * company-disclosed.
 */

const CURRENT_YEAR = 2026;

export type CompetitorCertificationStatus =
  | "Certified / In Production"
  | "In Certification"
  | "Certification Target"
  | "Wound Down / IP Acquired"
  | "Unknown";

export type CompetitorProfile = {
  id: string;
  companyName: string;
  headquarters: string;
  country: string;
  founded: number | null;
  yearsOperating: number | null;
  aircraftName: string;
  aircraftType: string;
  passengerCapacity: string;
  range: string;
  cruiseSpeed: string;
  fundingRaised: string;
  estimatedRevenue: string;
  employees: string;
  certificationStatus: string;
  certificationCategory: CompetitorCertificationStatus;
  website: string;
  description: string;
  dataNotes?: string;
};

function yearsOperating(founded: number | null): number | null {
  return founded ? CURRENT_YEAR - founded : null;
}

export const COMPETITOR_PROFILES: CompetitorProfile[] = [
  {
    id: "joby-aviation",
    companyName: "Joby Aviation",
    headquarters: "Santa Cruz, California, USA",
    country: "United States",
    founded: 2009,
    yearsOperating: yearsOperating(2009),
    aircraftName: "S4",
    aircraftType: "Tilt-rotor eVTOL",
    passengerCapacity: "4 passengers + 1 pilot",
    range: "~150 miles",
    cruiseSpeed: "~200 mph",
    fundingRaised: "Public company (NYSE: JOBY)",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "FAA Type Inspection Authorization (TIA) / Stage 4 (as of 2026 reporting)",
    certificationCategory: "In Certification",
    website: "https://www.jobyaviation.com",
    description:
      "Developer of the S4 tilt-rotor eVTOL air taxi, pursuing FAA type certification for commercial air taxi service.",
    dataNotes: "Range and speed are company/industry reported figures.",
  },
  {
    id: "archer-aviation",
    companyName: "Archer Aviation",
    headquarters: "San Jose, California, USA",
    country: "United States",
    founded: 2018,
    yearsOperating: yearsOperating(2018),
    aircraftName: "Midnight",
    aircraftType: "Tilt-rotor eVTOL",
    passengerCapacity: "4 passengers + 1 pilot",
    range: "~100 miles",
    cruiseSpeed: "~150 mph",
    fundingRaised: "Public company (NYSE: ACHR)",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "100% of FAA Means of Compliance (MoC) accepted (2025/2026)",
    certificationCategory: "In Certification",
    website: "https://www.archer.com",
    description:
      "Developer of the Midnight eVTOL aircraft for urban air mobility, targeting FAA type certification.",
    dataNotes: "Range and speed are industry-reported estimates.",
  },
  {
    id: "beta-technologies",
    companyName: "Beta Technologies",
    headquarters: "South Burlington, Vermont, USA",
    country: "United States",
    founded: null,
    yearsOperating: null,
    aircraftName: "Alia / A250 / CX300",
    aircraftType: "Lift + cruise eVTOL / CTOL",
    passengerCapacity: "5 passengers + 1 pilot / cargo configuration",
    range: "~250 miles (Alia, company reported)",
    cruiseSpeed: "",
    fundingRaised: "",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "Pursuing dual CTOL/VTOL certification track",
    certificationCategory: "In Certification",
    website: "https://www.beta.team",
    description:
      "Developer of the Alia family of electric aircraft, pursuing both conventional (CX300) and vertical (A250) takeoff and landing certification paths.",
    dataNotes: "Founding year, funding, revenue, and employee counts not confidently sourced — left blank.",
  },
  {
    id: "vertical-aerospace",
    companyName: "Vertical Aerospace",
    headquarters: "Bristol, United Kingdom",
    country: "United Kingdom",
    founded: 2016,
    yearsOperating: yearsOperating(2016),
    aircraftName: "VX4",
    aircraftType: "Tilt-rotor eVTOL",
    passengerCapacity: "4 passengers + 1 pilot",
    range: "~100 miles",
    cruiseSpeed: "~200 mph",
    fundingRaised: "Public company (NYSE: EVTL)",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "EASA SC-VTOL basis / certification target ~2028",
    certificationCategory: "Certification Target",
    website: "https://vertical-aerospace.com",
    description:
      "UK-based developer of the VX4 eVTOL aircraft, certifying under EASA's Special Condition for VTOL aircraft.",
    dataNotes: "Range and speed are industry-reported estimates.",
  },
  {
    id: "eve-air-mobility",
    companyName: "Eve Air Mobility",
    headquarters: "São José dos Campos, Brazil",
    country: "Brazil",
    founded: null,
    yearsOperating: null,
    aircraftName: "Eve eVTOL",
    aircraftType: "Lift + cruise eVTOL",
    passengerCapacity: "4 passengers + 1 pilot",
    range: "~60 miles",
    cruiseSpeed: "~150 mph",
    fundingRaised: "Public company (NYSE: EVEX)",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "Type certification target mid-to-late 2020s",
    certificationCategory: "Certification Target",
    website: "https://eveairmobility.com",
    description:
      "Embraer-backed eVTOL developer building a lift+cruise air taxi and urban air traffic management services.",
    dataNotes: "Founding year, range, and speed are industry-reported figures.",
  },
  {
    id: "wisk-aero",
    companyName: "Wisk Aero",
    headquarters: "Mountain View, California, USA",
    country: "United States",
    founded: null,
    yearsOperating: null,
    aircraftName: "Generation 6",
    aircraftType: "Autonomous lift + cruise eVTOL",
    passengerCapacity: "~4 passengers (autonomous, no pilot)",
    range: "",
    cruiseSpeed: "",
    fundingRaised: "Wholly owned subsidiary of Boeing",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "FAA G-1 certification basis issued for Generation 6",
    certificationCategory: "In Certification",
    website: "https://wisk.aero",
    description:
      "Boeing-owned developer of autonomous, self-flying air taxis; Generation 6 is its latest certification-track aircraft.",
    dataNotes: "Range, speed, funding total, revenue, and employee counts not confidently sourced — left blank.",
  },
  {
    id: "ehang",
    companyName: "EHang",
    headquarters: "Guangzhou, China",
    country: "China",
    founded: null,
    yearsOperating: null,
    aircraftName: "EH216-S",
    aircraftType: "Multicopter eVTOL (autonomous)",
    passengerCapacity: "2 passengers (autonomous, no pilot)",
    range: "",
    cruiseSpeed: "",
    fundingRaised: "Public company (NASDAQ: EH)",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "CAAC Type Certificate, Production Certificate, and Standard Airworthiness Certificate",
    certificationCategory: "Certified / In Production",
    website: "https://www.ehang.com",
    description:
      "Chinese autonomous aerial vehicle maker; the EH216-S holds full CAAC certification for passenger-carrying operations.",
    dataNotes: "Founding year, range, speed, revenue, and employee counts not confidently sourced — left blank.",
  },
  {
    id: "volocopter",
    companyName: "Volocopter",
    headquarters: "Bruchsal, Germany",
    country: "Germany",
    founded: null,
    yearsOperating: null,
    aircraftName: "VoloCity",
    aircraftType: "Multicopter eVTOL",
    passengerCapacity: "2 passengers (1 pilot + 1 passenger)",
    range: "",
    cruiseSpeed: "",
    fundingRaised: "",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "Pursuing EASA certification",
    certificationCategory: "In Certification",
    website: "https://www.volocopter.com",
    description:
      "German eVTOL pioneer developing the VoloCity air taxi. Public reporting has noted restructuring and funding challenges; specific funding totals are not confidently sourced here.",
    dataNotes:
      "Company has faced publicly reported restructuring/insolvency proceedings and funding challenges — figures not invented; founding year, range, speed, funding, revenue, and employees left blank.",
  },
  {
    id: "skydrive",
    companyName: "SkyDrive",
    headquarters: "Toyota City, Japan",
    country: "Japan",
    founded: null,
    yearsOperating: null,
    aircraftName: "SD-05",
    aircraftType: "Multicopter eVTOL",
    passengerCapacity: "2 passengers (1 pilot + 1 passenger)",
    range: "",
    cruiseSpeed: "",
    fundingRaised: "",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "Pursuing JCAB (Japan Civil Aviation Bureau) type certification",
    certificationCategory: "In Certification",
    website: "https://skydrive2020.com",
    description:
      "Japanese eVTOL developer building the SD-05 air taxi, targeting JCAB certification for domestic commercial service.",
    dataNotes: "Founding year, range, speed, funding, revenue, and employee counts not confidently sourced — left blank.",
  },
  {
    id: "autoflight",
    companyName: "AutoFlight",
    headquarters: "Shanghai, China / Augsburg, Germany",
    country: "China / Germany",
    founded: null,
    yearsOperating: null,
    aircraftName: "Prosperity",
    aircraftType: "Lift + cruise eVTOL",
    passengerCapacity: "~5 passengers",
    range: "",
    cruiseSpeed: "",
    fundingRaised: "",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "CAAC type certification in progress; CarryAll cargo variant TC reported",
    certificationCategory: "In Certification",
    website: "https://www.autoflight.com",
    description:
      "China/Germany dual-headquartered eVTOL developer building the Prosperity passenger aircraft and CarryAll cargo eVTOL.",
    dataNotes: "Founding year, range, speed, funding, revenue, and employee counts not confidently sourced — left blank.",
  },
  {
    id: "horizon-aircraft",
    companyName: "Horizon Aircraft",
    headquarters: "Canada",
    country: "Canada",
    founded: null,
    yearsOperating: null,
    aircraftName: "Cavorite X7",
    aircraftType: "Hybrid fixed-wing VTOL",
    passengerCapacity: "",
    range: "",
    cruiseSpeed: "",
    fundingRaised: "",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "",
    certificationCategory: "Unknown",
    website: "https://www.horizonaircraft.com",
    description:
      "Canadian developer of the Cavorite X7 hybrid fixed-wing VTOL aircraft, designed to fly efficiently in fixed-wing mode after vertical takeoff.",
    dataNotes: "Detailed specs, funding, revenue, and employee counts not confidently sourced — left blank.",
  },
  {
    id: "overair",
    companyName: "Overair",
    headquarters: "Santa Ana, California, USA",
    country: "United States",
    founded: null,
    yearsOperating: null,
    aircraftName: "Butterfly",
    aircraftType: "Tilting ducted-fan eVTOL",
    passengerCapacity: "",
    range: "",
    cruiseSpeed: "",
    fundingRaised: "",
    estimatedRevenue: "",
    employees: "",
    certificationStatus: "Status uncertain — Archer Aviation acquired Overair IP (public 2025 filings)",
    certificationCategory: "Wound Down / IP Acquired",
    website: "",
    description:
      "Developer of the Butterfly eVTOL with a tilting ducted-fan design. Archer Aviation publicly disclosed acquisition of Overair's IP in 2025 filings; operating status may be wound down.",
    dataNotes: "Specs, funding, revenue, and employee counts not confidently sourced — left blank.",
  },
];

export type CompetitorSortKey =
  | "companyName"
  | "headquarters"
  | "aircraftName"
  | "passengerCapacity"
  | "range"
  | "cruiseSpeed"
  | "certificationCategory";

export const COMPETITOR_FILTERS = {
  countries: Array.from(
    new Set(COMPETITOR_PROFILES.map((c) => c.country).filter(Boolean)),
  ).sort(),
  aircraftTypes: Array.from(
    new Set(COMPETITOR_PROFILES.map((c) => c.aircraftType).filter(Boolean)),
  ).sort(),
  certificationCategories: Array.from(
    new Set(COMPETITOR_PROFILES.map((c) => c.certificationCategory)),
  ).sort(),
};

export function listCompetitors(): CompetitorProfile[] {
  return COMPETITOR_PROFILES;
}

export function getCompetitor(id: string): CompetitorProfile | null {
  return COMPETITOR_PROFILES.find((c) => c.id === id) ?? null;
}

export function searchCompetitors(query: string): CompetitorProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMPETITOR_PROFILES;
  return COMPETITOR_PROFILES.filter((c) =>
    [c.companyName, c.headquarters, c.country, c.aircraftName, c.aircraftType, c.description]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

export function filterCompetitors(
  competitors: CompetitorProfile[],
  filters: { country?: string; aircraftType?: string; certificationCategory?: string },
): CompetitorProfile[] {
  return competitors.filter((c) => {
    if (filters.country && c.country !== filters.country) return false;
    if (filters.aircraftType && c.aircraftType !== filters.aircraftType) return false;
    if (
      filters.certificationCategory &&
      c.certificationCategory !== filters.certificationCategory
    ) {
      return false;
    }
    return true;
  });
}

export function sortCompetitors(
  competitors: CompetitorProfile[],
  key: CompetitorSortKey,
  direction: "asc" | "desc" = "asc",
): CompetitorProfile[] {
  const sorted = [...competitors].sort((a, b) => {
    const aVal = String(a[key] ?? "");
    const bVal = String(b[key] ?? "");
    return aVal.localeCompare(bVal);
  });
  return direction === "asc" ? sorted : sorted.reverse();
}
