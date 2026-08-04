/**
 * OnwardAir Potential Clients — aviation / AAM / middle-mile market snapshots.
 * OA-only overlay; does not replace Unit311 BFS census scrape for other tenants.
 */

import type {
  PotentialClientsCountryId,
  PotentialClientsCountrySnapshot,
  PotentialClientsIndustryCategory,
} from "@/lib/potential-clients-data";

const AAM_INDUSTRY_SHARES: [string, number][] = [
  ["Advanced air mobility & eVTOL", 18.5],
  ["Middle-mile & cargo logistics", 16.2],
  ["Defense & contested logistics", 14.8],
  ["Airport & vertiport operations", 12.4],
  ["Battery, propulsion & energy", 11.1],
  ["Air traffic & UTM services", 9.6],
  ["Public sector & civil aviation", 8.7],
  ["Insurance & aviation risk", 5.2],
  ["Training & simulation", 2.3],
  ["Environmental & noise compliance", 1.2],
];

function buildIndustryMixFromShares(
  totalStartups: number,
  entries: [string, number][],
): PotentialClientsIndustryCategory[] {
  return entries.map(([label, sharePercent]) => {
    const startupCount = Math.round((totalStartups * sharePercent) / 100);
    return {
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label,
      startupCount,
      sharePercent,
    };
  });
}

/**
 * Operator / buyer TAM proxies for Vertex VTOL middle-mile outreach.
 * Primary figures are planning snapshots derived from FAA, NASA AAM, and industry reports —
 * not Unit311 business-formation scrape counts.
 */
export const ONWARDAIR_POTENTIAL_CLIENTS_COUNTRIES: PotentialClientsCountrySnapshot[] = [
  {
    id: "us",
    label: "United States",
    regionNote: "Primary AAM / middle-mile market · North America",
    startups2025: 4_850,
    startups2025MultiDirector: 2_180,
    startupsFundedOver100k: 920,
    smesOver6Months: 12_400,
    smesEmployees10to200: 3_650,
    industries: buildIndustryMixFromShares(4_850, AAM_INDUSTRY_SHARES),
    source: {
      name: "FAA — Advanced Air Mobility implementation plan & NASA AAM ecosystem reports",
      url: "https://www.faa.gov/air-taxis",
    },
    methodologyNote:
      "Operator TAM proxy for US AAM, cargo UAS, and airport/vertiport buyers. Multi-director and funded counts are planning estimates from FAA/NASA AAM roadmaps and industry capital reports — not Census BFS totals.",
  },
  {
    id: "ae",
    label: "United Arab Emirates",
    regionNote: "GCC hub · Middle East AAM & cargo corridors",
    startups2025: 620,
    startups2025MultiDirector: 310,
    startupsFundedOver100k: 145,
    smesOver6Months: 1_480,
    smesEmployees10to200: 410,
    industries: buildIndustryMixFromShares(620, AAM_INDUSTRY_SHARES),
    source: {
      name: "UAE GCAA / Dubai Future Foundation — urban air mobility programmes",
      url: "https://www.gcaa.gov.ae/",
    },
    methodologyNote:
      "GCC aviation operator and logistics intermediary TAM for Vertiport + middle-mile partnerships. Secondary metrics are planning estimates aligned to regional AAM pilot programmes.",
  },
  {
    id: "uk",
    label: "United Kingdom",
    regionNote: "Europe defense & logistics · English-speaking",
    startups2025: 1_140,
    startups2025MultiDirector: 520,
    startupsFundedOver100k: 210,
    smesOver6Months: 2_860,
    smesEmployees10to200: 780,
    industries: buildIndustryMixFromShares(1_140, AAM_INDUSTRY_SHARES),
    source: {
      name: "UK CAA — Future of Flight / AAM pathway & MoD logistics modernisation",
      url: "https://www.caa.co.uk/our-work/innovation/future-of-flight/",
    },
    methodologyNote:
      "UK defense logistics, airport ops, and Future of Flight operator pool. Counts are AAM-relevant TAM proxies, not Companies House incorporations.",
  },
  {
    id: "de",
    label: "Germany",
    regionNote: "Europe industrial & defense logistics",
    startups2025: 980,
    startups2025MultiDirector: 440,
    startupsFundedOver100k: 175,
    smesOver6Months: 2_420,
    smesEmployees10to200: 690,
    industries: buildIndustryMixFromShares(980, AAM_INDUSTRY_SHARES),
    source: {
      name: "BMWK / EASA — European U-space & AAM industrial base reports",
      url: "https://www.easa.europa.eu/en/domains/urban-air-mobility-uam",
    },
    methodologyNote:
      "German industrial aviation, U-space, and defense logistics buyers. Secondary metrics are planning estimates from EASA UAM and national aerospace SME stock.",
  },
  {
    id: "fr",
    label: "France",
    regionNote: "Europe aerospace & contested logistics",
    startups2025: 870,
    startups2025MultiDirector: 390,
    startupsFundedOver100k: 160,
    smesOver6Months: 2_150,
    smesEmployees10to200: 610,
    industries: buildIndustryMixFromShares(870, AAM_INDUSTRY_SHARES),
    source: {
      name: "DGAC / EASA — European AAM and aerospace supplier ecosystem",
      url: "https://www.ecologie.gouv.fr/en/civil-aviation",
    },
    methodologyNote:
      "French aerospace OEM suppliers and defense logistics operators relevant to Vertex VTOL middle-mile. Figures are sector TAM proxies, not INSEE business creations.",
  },
];

export const DEFAULT_ONWARDAIR_POTENTIAL_CLIENTS_COUNTRY_ID: PotentialClientsCountryId = "us";

export const ONWARDAIR_POTENTIAL_CLIENTS_INTRO = {
  eyebrow: "Strategy · Operator TAM",
  title: "Potential Clients",
  description:
    "Vertex VTOL middle-mile and advanced air mobility operator markets. Country tabs size AAM, cargo logistics, and defense buyer pools across the US, Middle East, and Europe — not general business-formation scrape totals.",
} as const;

export function isOnwardAirPotentialClientsCountryId(
  value: string | null | undefined,
): value is PotentialClientsCountryId {
  return ONWARDAIR_POTENTIAL_CLIENTS_COUNTRIES.some((country) => country.id === value);
}
