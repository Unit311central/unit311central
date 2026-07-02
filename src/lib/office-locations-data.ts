export type OfficeLocation = {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  staffCount: number;
  timezone: string;
};

export const OFFICE_LOCATIONS: OfficeLocation[] = [
  {
    id: "barcelona",
    name: "Barcelona HQ",
    city: "Barcelona",
    country: "Spain",
    address: "Parc Tecnològic del Vallès, Cerdanyola del Vallès",
    staffCount: 14,
    timezone: "CET",
  },
  {
    id: "porto",
    name: "Porto Operations",
    city: "Porto",
    country: "Portugal",
    address: "Douro Logistics Corridor, Matosinhos",
    staffCount: 9,
    timezone: "WET",
  },
  {
    id: "oxford",
    name: "Oxford Studio",
    city: "Oxford",
    country: "United Kingdom",
    address: "Oxford Science Park, Littlemore",
    staffCount: 7,
    timezone: "GMT",
  },
];
