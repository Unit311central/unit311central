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

export const SAEC_INSTALLATION_CITIES: SaecInstallationCity[] = [
  { id: "johannesburg", label: "Johannesburg", mapX: 520, mapY: 360 },
  { id: "cape-town", label: "Cape Town", mapX: 130, mapY: 620 },
  { id: "durban", label: "Durban", mapX: 720, mapY: 470 },
  { id: "pretoria", label: "Pretoria", mapX: 545, mapY: 320 },
  { id: "gqeberha", label: "Gqeberha", mapX: 660, mapY: 540 },
  { id: "vereeniging", label: "Vereeniging", mapX: 495, mapY: 410 },
  { id: "soshanguve", label: "Soshanguve", mapX: 560, mapY: 335 },
  { id: "east-london", label: "East London", mapX: 700, mapY: 520 },
  { id: "bloemfontein", label: "Bloemfontein", mapX: 470, mapY: 500 },
  { id: "pietermaritzburg", label: "Pietermaritzburg", mapX: 690, mapY: 440 },
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
