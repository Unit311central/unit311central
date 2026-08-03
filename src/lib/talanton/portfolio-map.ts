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
  /** 0–100 within the projected Africa/world map frame */
  xPct: number;
  yPct: number;
};

/** City → approximate position on an Africa-centred equirectangular frame. */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Accra: { lat: 5.6, lng: -0.19 },
  Nairobi: { lat: -1.29, lng: 36.82 },
  Bujumbura: { lat: -3.38, lng: 29.36 },
  Bukavu: { lat: -2.49, lng: 28.84 },
  Kampala: { lat: 0.35, lng: 32.58 },
  "Addis Ababa": { lat: 9.03, lng: 38.74 },
  Eldoret: { lat: 0.51, lng: 35.27 },
  Rubavu: { lat: -1.68, lng: 29.26 },
  Masaka: { lat: -0.34, lng: 31.73 },
  "Dar es Salaam": { lat: -6.79, lng: 39.28 },
};

/** Map Africa roughly into the visible frame (lng −20…55, lat −35…38). */
function project(lat: number, lng: number): { xPct: number; yPct: number } {
  const xPct = ((lng - -20) / (55 - -20)) * 100;
  const yPct = ((38 - lat) / (38 - -35)) * 100;
  return {
    xPct: Math.min(96, Math.max(4, xPct)),
    yPct: Math.min(94, Math.max(6, yPct)),
  };
}

function purposeFor(company: PortfolioCompany): string {
  const first = company.overview.split(/[.!?]/)[0]?.trim();
  if (first && first.length > 12) return `${first}.`;
  return `${company.name} advances ${company.sector.toLowerCase()} outcomes across ${company.country}.`;
}

function jitter(index: number): { dx: number; dy: number } {
  // Slight offset so stacked Nairobi markers remain clickable.
  const ring = index % 7;
  const angle = (ring / 7) * Math.PI * 2;
  return { dx: Math.cos(angle) * 1.8, dy: Math.sin(angle) * 1.6 };
}

export function buildPortfolioMapMarkers(): PortfolioMapMarker[] {
  const cityCounts = new Map<string, number>();

  return TALANTON_PORTFOLIO_COMPANIES.map((company) => {
    const key = company.city;
    const n = cityCounts.get(key) ?? 0;
    cityCounts.set(key, n + 1);
    const coords = CITY_COORDS[company.city] ?? { lat: 0, lng: 25 };
    const { xPct, yPct } = project(coords.lat, coords.lng);
    const { dx, dy } = jitter(n);

    return {
      id: company.id,
      company: company.name,
      city: company.city,
      country: company.country,
      sector: company.sector,
      staff: company.employeeCount,
      revenueLabel: formatUsd(company.annualRevenueUsd),
      companyPurpose: purposeFor(company),
      xPct: Math.min(96, Math.max(4, xPct + dx)),
      yPct: Math.min(94, Math.max(6, yPct + dy)),
    };
  });
}
