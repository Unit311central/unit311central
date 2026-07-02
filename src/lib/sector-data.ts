import {
  MINING_COUNTRIES,
  MINING_OPERATORS_BY_COUNTRY,
  type MiningCountry,
} from "@/lib/mining-sector-data";
import { SECTOR_PROFILES_DATA } from "@/lib/sector-profiles-data";

export type SectorCountry = MiningCountry;

export type SectorSubSector =
  | "mining-quarries"
  | "solar-farms"
  | "construction-infrastructure"
  | "utilities"
  | "rail"
  | "industrial-plants"
  | "warehouses"
  | "agriculture";

export type SectorOrganization = {
  rank: number;
  name: string;
  website: string;
  droneUse: string;
  detail: string;
  latitude: number;
  longitude: number;
};

export type SectorCountryProfile = {
  country: SectorCountry;
  subSector: SectorSubSector;
  siteCount: number;
  siteLabel: string;
  siteBreakdown: string;
  mapCenter: [number, number];
  mapZoom: number;
  organizations: SectorOrganization[];
  servicesOffered: string[];
};

export const SECTOR_COUNTRIES = MINING_COUNTRIES.map((country) => ({
  id: country.id,
  label: country.label,
  mapCenter: country.mapCenter,
  mapZoom: country.mapZoom,
}));

export const SECTOR_SUB_SECTORS: readonly {
  id: SectorSubSector;
  label: string;
  description: string;
}[] = [
  {
    id: "mining-quarries",
    label: "Mining & Quarries",
    description: "Open-pit mines, underground operations, and major aggregate sites.",
  },
  {
    id: "solar-farms",
    label: "Solar Farms",
    description: "Utility-scale PV parks and hybrid renewable sites.",
  },
  {
    id: "construction-infrastructure",
    label: "Construction & Infrastructure",
    description: "Major civils, highways, bridges, and public works.",
  },
  {
    id: "utilities",
    label: "Utilities",
    description: "Transmission corridors, substations, and grid assets.",
  },
  {
    id: "rail",
    label: "Rail",
    description: "Corridors, depots, earthworks, and station upgrades.",
  },
  {
    id: "industrial-plants",
    label: "Industrial Plants",
    description: "Refineries, chemical parks, and heavy process facilities.",
  },
  {
    id: "warehouses",
    label: "Warehouses",
    description: "Large logistics hubs, fulfilment centres, and DC roofs.",
  },
  {
    id: "agriculture",
    label: "Agriculture",
    description: "Large estates, irrigated farms, and agri-industrial holdings.",
  },
] as const;

const MINING_WEBSITES: Record<string, string> = {
  "es-matsa": "matsaresources.com",
  "es-las-cruces": "first-quantum.com",
  "es-atalaya": "atalayamining.com",
  "es-asturiana": "glencore.com",
  "es-berkeley": "berkeleyenergia.com",
  "es-orvana": "orvana.com",
  "es-los-santos": "almonty.com",
  "es-saloro": "priorityzinc.com",
  "es-sotkamo": "sotkamosilver.com",
  "es-el-astillero": "orvana.com",
  "uk-glencore": "glencore.com",
  "uk-anglo": "angloamerican.com",
  "uk-rio-tinto": "riotinto.com",
  "uk-bhp": "bhp.com",
  "uk-antofagasta": "antofagasta.co.uk",
  "uk-fresnillo": "fresnilloplc.com",
  "uk-hochschild": "hochschildmining.com",
  "uk-cornish-lithium": "cornishlithium.com",
  "uk-imerys": "imerys.com",
  "uk-boulby": "icl-group.com",
  "pt-lundin": "lundinmining.com",
  "pt-almina": "almina.pt",
  "pt-panasqueira": "minasdapansaqueira.pt",
  "pt-lousal": "sovmin.pt",
  "pt-secil": "secil.pt",
  "pt-mota": "grupomota.pt",
  "pt-iberian": "iberianresources.com",
  "pt-rio-tinto": "aethelmining.com",
  "pt-savin": "savinresources.com",
  "pt-avocet": "avocetmining.com",
  "ke-base": "baseresources.com.au",
  "ke-magadi": "tatachemicals.com",
  "ke-karebe": "karebegold.com",
  "ke-fluorspar": "kenyafluorspar.com",
  "ke-mayfox": "mayfoxmining.com",
  "ke-cortec": "cortecmining.com",
  "ke-arm": "nationalcement.co.ke",
  "ke-red-rock": "redrockresources.com",
  "ke-pacific": "pacificwildcat.com",
  "ke-acacia": "shantagold.com",
};

const MINING_SERVICES = [
  "Stockpile volume and inventory surveys",
  "Pit wall, slope, and tailings dam monitoring",
  "Haul-road mapping and grade analysis",
  "Blast planning orthomosaics and DSMs",
  "Environmental compliance and reclamation mapping",
  "Confined-space inspection (shafts, galleries, silos)",
  "Progress monitoring for mine expansion projects",
  "Thermal inspection of processing plant assets",
];

function buildMiningProfile(country: SectorCountry): SectorCountryProfile {
  const meta = MINING_COUNTRIES.find((entry) => entry.id === country)!;
  const operators = MINING_OPERATORS_BY_COUNTRY[country];

  return {
    country,
    subSector: "mining-quarries",
    siteCount: meta.sizeableMineSites,
    siteLabel: "mines & quarries",
    siteBreakdown: meta.siteBreakdown,
    mapCenter: meta.mapCenter,
    mapZoom: meta.mapZoom,
    servicesOffered: MINING_SERVICES,
    organizations: operators.map((operator) => ({
      rank: operator.rank,
      name: operator.companyName,
      website: MINING_WEBSITES[operator.id] ?? "",
      droneUse: operator.droneProviders.join(" · "),
      detail: `${operator.primaryCommodity} · ${operator.siteLabel}`,
      latitude: operator.latitude,
      longitude: operator.longitude,
    })),
  };
}

export function getSectorProfile(
  country: SectorCountry,
  subSector: SectorSubSector,
): SectorCountryProfile {
  if (subSector === "mining-quarries") {
    return buildMiningProfile(country);
  }

  return SECTOR_PROFILES_DATA[country][subSector];
}

export function getSectorSubSectorMeta(subSector: SectorSubSector) {
  return SECTOR_SUB_SECTORS.find((entry) => entry.id === subSector) ?? SECTOR_SUB_SECTORS[0];
}

export function getSectorCountryLabel(country: SectorCountry) {
  return SECTOR_COUNTRIES.find((entry) => entry.id === country)?.label ?? country;
}

export function formatSectorWebsiteHref(website: string) {
  const trimmed = website.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
