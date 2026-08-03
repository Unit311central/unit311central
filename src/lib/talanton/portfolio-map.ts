/**
 * Portfolio company map markers for the Talanton Executive Home.
 * Coordinates are approximate city centres for demo visualisation.
 */

import {
  formatUsd,
  TALANTON_PORTFOLIO_COMPANIES,
  type PortfolioCompany,
} from "@/lib/talanton/portfolio-data";

export type PortfolioMapMarker = {
  id: string;
  company: string;
  city: string;
  country: string;
  sector: string;
  staff: number;
  revenueLabel: string;
  companyPurpose: string;
  lat: number;
  lng: number;
};

/** City → approximate position (WGS84). */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Accra: { lat: 5.6037, lng: -0.187 },
  Nairobi: { lat: -1.2921, lng: 36.8219 },
  Bujumbura: { lat: -3.3614, lng: 29.3599 },
  Bukavu: { lat: -2.4908, lng: 28.8428 },
  Kampala: { lat: 0.3476, lng: 32.5825 },
  "Addis Ababa": { lat: 9.032, lng: 38.7469 },
  Eldoret: { lat: 0.5143, lng: 35.2698 },
  Rubavu: { lat: -1.6847, lng: 29.2564 },
  Masaka: { lat: -0.3411, lng: 31.7341 },
  "Dar es Salaam": { lat: -6.7924, lng: 39.2083 },
};

/** Default Africa frame for fitBounds / maxBounds (continent + light margin). */
export const AFRICA_MAP_BOUNDS: [[number, number], [number, number]] = [
  [-36.5, -20],
  [38.5, 54],
];

/**
 * Initial viewport tuned for wide dashboard cards.
 * Full-continent fitBounds on a ~21:10 frame zooms out to a world view;
 * this frame keeps Africa filling the width.
 */
export const AFRICA_INITIAL_VIEW = {
  center: [1.2, 18.5] as [number, number],
  zoom: 5,
};

function purposeFor(company: PortfolioCompany): string {
  const first = company.overview.split(/[.!?]/)[0]?.trim();
  if (first && first.length > 12) return `${first}.`;
  return `${company.name} advances ${company.sector.toLowerCase()} outcomes across ${company.country}.`;
}

/** Slight geographic offset so stacked city markers remain clickable. */
function jitter(index: number): { dLat: number; dLng: number } {
  if (index === 0) return { dLat: 0, dLng: 0 };
  const ring = ((index - 1) % 8) + 1;
  const angle = (ring / 8) * Math.PI * 2;
  const radius = 0.12 + Math.floor((index - 1) / 8) * 0.08;
  return { dLat: Math.sin(angle) * radius, dLng: Math.cos(angle) * radius };
}

export function buildPortfolioMapMarkers(): PortfolioMapMarker[] {
  const cityCounts = new Map<string, number>();

  return TALANTON_PORTFOLIO_COMPANIES.map((company) => {
    const key = company.city;
    const n = cityCounts.get(key) ?? 0;
    cityCounts.set(key, n + 1);
    const coords = CITY_COORDS[company.city] ?? { lat: 0, lng: 25 };
    const { dLat, dLng } = jitter(n);

    return {
      id: company.id,
      company: company.name,
      city: company.city,
      country: company.country,
      sector: company.sector,
      staff: company.employeeCount,
      revenueLabel: formatUsd(company.annualRevenueUsd),
      companyPurpose: purposeFor(company),
      lat: coords.lat + dLat,
      lng: coords.lng + dLng,
    };
  });
}
