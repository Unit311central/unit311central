/** Northstar demo office coordinates for the corporate dashboard map. */
export type NorthstarOfficeMapMarker = {
  id: string;
  city: string;
  country: string;
  address: string;
  employees: number;
  lat: number;
  lng: number;
  region: "UK" | "US";
};

export const NORTHSTAR_OFFICE_MAP_MARKERS: NorthstarOfficeMapMarker[] = [
  {
    id: "nst-office-man",
    city: "Manchester",
    country: "United Kingdom",
    address: "Unit 4, Trafford Park Industrial Estate, Manchester M17 1HH",
    employees: 12,
    lat: 53.4808,
    lng: -2.2426,
    region: "UK",
  },
  {
    id: "nst-office-bri",
    city: "Bristol",
    country: "United Kingdom",
    address: "14 Temple Quay, Bristol BS1 6DZ",
    employees: 7,
    lat: 51.4545,
    lng: -2.5879,
    region: "UK",
  },
  {
    id: "nst-office-aus",
    city: "Austin",
    country: "United States",
    address: "800 Brazos Street, Suite 400, Austin TX 78701",
    employees: 6,
    lat: 30.2672,
    lng: -97.7431,
    region: "US",
  },
];

/** UK + US viewport for the transatlantic office map. */
export const NORTHSTAR_OFFICE_MAP_VIEW = {
  center: [48, -42] as [number, number],
  zoom: 3,
};

export const NORTHSTAR_OFFICE_MAP_BOUNDS: [[number, number], [number, number]] = [
  [24, -108],
  [58, 4],
];
