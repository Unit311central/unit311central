import type { SaecInstallationCity, SaecInstallationCityId } from "@/lib/saec/installations-types";

/** Demo city distribution — 400 elevators + 400 escalators across South Africa. */
export const SAEC_INSTALLATION_CITY_COUNTS: Record<
  SaecInstallationCityId,
  { elevators: number; escalators: number }
> = {
  johannesburg: { elevators: 77, escalators: 77 },
  "cape-town": { elevators: 58, escalators: 58 },
  durban: { elevators: 54, escalators: 54 },
  pretoria: { elevators: 50, escalators: 50 },
  gqeberha: { elevators: 36, escalators: 36 },
  vereeniging: { elevators: 25, escalators: 25 },
  soshanguve: { elevators: 25, escalators: 25 },
  "east-london": { elevators: 25, escalators: 25 },
  bloemfontein: { elevators: 25, escalators: 25 },
  pietermaritzburg: { elevators: 25, escalators: 25 },
};

/** WGS84 coordinates — geographic placement for the installations map. */
export const SAEC_INSTALLATION_CITIES: SaecInstallationCity[] = [
  { id: "johannesburg", label: "Johannesburg", latitude: -26.2041, longitude: 28.0473 },
  { id: "cape-town", label: "Cape Town", latitude: -33.9249, longitude: 18.4241 },
  { id: "durban", label: "Durban", latitude: -29.8587, longitude: 31.0218 },
  {
    id: "pretoria",
    label: "Pretoria",
    latitude: -25.7461,
    longitude: 28.1881,
    labelOffsetX: -28,
    labelOffsetY: -10,
  },
  { id: "gqeberha", label: "Gqeberha", latitude: -33.9608, longitude: 25.6022 },
  {
    id: "vereeniging",
    label: "Vereeniging",
    latitude: -26.6731,
    longitude: 27.9265,
    labelOffsetX: -34,
    labelOffsetY: 8,
  },
  {
    id: "soshanguve",
    label: "Soshanguve",
    latitude: -25.4729,
    longitude: 28.0992,
    labelOffsetX: 30,
    labelOffsetY: -8,
  },
  { id: "east-london", label: "East London", latitude: -33.0153, longitude: 27.9116 },
  { id: "bloemfontein", label: "Bloemfontein", latitude: -29.0852, longitude: 26.1596 },
  { id: "pietermaritzburg", label: "Pietermaritzburg", latitude: -29.6006, longitude: 30.3794 },
];

export const SAEC_FICTIONAL_SITES: Record<SaecInstallationCityId, string[]> = {
  johannesburg: [
    "Sandton City",
    "Rosebank Office Park",
    "Midrand Industrial Park",
    "Eastgate Shopping Centre",
    "Melrose Arch",
    "Johannesburg CBD Tower",
    "Sandton Medical Centre",
    "Fourways Crossing",
  ],
  "cape-town": [
    "V&A Waterfront",
    "Cape Town International Convention Centre",
    "Canal Walk Shopping Centre",
    "Bellville Civic Centre",
    "Claremont Office Campus",
    "Waterfront Hospital Wing",
  ],
  durban: [
    "Durban Shopping Mall",
    "Umhlanga Ridge Offices",
    "Gateway Theatre of Shopping",
    "Durban Harbour Logistics Hub",
    "Pavilion Shopping Centre",
  ],
  pretoria: [
    "Menlyn Maine",
    "Menlyn Park Shopping Centre",
    "Union Buildings Annex",
    "Centurion Lake Offices",
    "Hatfield Corporate Park",
  ],
  gqeberha: [
    "Greenacres Shopping Centre",
    "PE Harbour Offices",
    "Summerstrand Medical Centre",
    "Boardwalk Casino Complex",
  ],
  vereeniging: [
    "Vaal Industrial Estate",
    "Riviera on Vaal Offices",
    "Vereeniging Civic Centre",
  ],
  soshanguve: [
    "Soshanguve Retail Park",
    "Tshwane North Hospital",
    "Soshanguve Community Mall",
  ],
  "east-london": [
    "East London Industrial Park",
    "Hemingways Mall",
    "Quigney Business Centre",
  ],
  bloemfontein: [
    "Loch Logan Waterfront",
    "Bloemfontein Civic Centre",
    "Naval Hill Offices",
  ],
  pietermaritzburg: [
    "Capital Centre",
    "Libertas Hospital Wing",
    "Pietermaritzburg Station Plaza",
  ],
};

export const SAEC_FICTIONAL_CUSTOMERS: string[] = [
  "Demo Property Holdings",
  "Fictional Retail Group",
  "Illustrative Logistics SA",
  "Sample Commercial Estates",
  "Demonstration Hospital Trust",
  "Example Office Parks",
  "Placeholder Industrial Consortium",
];

export function cityLabelForId(id: SaecInstallationCityId): string {
  return SAEC_INSTALLATION_CITIES.find((city) => city.id === id)?.label ?? id;
}

export function citySlugForLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
