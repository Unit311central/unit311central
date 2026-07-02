export type CrmConnection = {
  id: string;
  name: string;
  role: string;
  specialties: string;
  background: string;
  countryExperience: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};

type DbConnection = {
  id: string;
  name: string;
  role: string;
  specialties: string | null;
  background: string | null;
  country_experience: string | null;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

const GENERIC_GEOCODE_FALLBACK: [number, number] = [20, 0];

const CITY_COORDINATES: Record<string, [number, number]> = {
  "porto|portugal": [41.1579, -8.6291],
  "oxford|uk": [51.752, -1.2577],
  "oxford|united kingdom": [51.752, -1.2577],
  "buenos aires|argentina": [-34.6037, -58.3816],
  "austin|usa": [30.2672, -97.7431],
  "austin|united states": [30.2672, -97.7431],
  "houston|usa": [29.7604, -95.3698],
  "houston|united states": [29.7604, -95.3698],
  "jakarta|indonesia": [-6.2088, 106.8456],
  "nairobi|kenya": [-1.2921, 36.8219],
  "kampala|uganda": [0.3476, 32.5825],
  "damascus|syria": [33.5138, 36.2765],
  "seattle|usa": [47.6062, -122.3321],
  "seattle|united states": [47.6062, -122.3321],
  "melbourne|australia": [-37.8136, 144.9631],
  "london|uk": [51.5074, -0.1278],
  "london|united kingdom": [51.5074, -0.1278],
  "edinburgh|uk": [55.9533, -3.1883],
  "edinburgh|scotland": [55.9533, -3.1883],
  "harare|zimbabwe": [-17.8252, 31.0522],
  "lyon|france": [45.764, 4.8357],
  "montreal|canada": [45.5017, -73.5673],
  "glasgow|scotland": [55.8642, -4.2518],
  "glasgow|uk": [55.8642, -4.2518],
  "santiago|chile": [-33.4489, -70.6693],
};

function locationKey(city: string, country: string) {
  return `${city.trim().toLowerCase()}|${country.trim().toLowerCase()}`;
}

export function geocodeConnection(city: string, country: string): [number, number] {
  const key = locationKey(city, country);
  const coords = CITY_COORDINATES[key];
  if (coords) return coords;

  const cityOnly = Object.entries(CITY_COORDINATES).find(([entryKey]) =>
    entryKey.startsWith(`${city.trim().toLowerCase()}|`),
  );
  if (cityOnly) return cityOnly[1];

  return GENERIC_GEOCODE_FALLBACK;
}

export function resolveConnectionCoordinates(
  city: string,
  country: string,
  storedLat: number | null,
  storedLng: number | null,
): [number, number] {
  const [geoLat, geoLng] = geocodeConnection(city, country);
  const lat = storedLat ?? geoLat;
  const lng = storedLng ?? geoLng;

  if (
    lat === GENERIC_GEOCODE_FALLBACK[0] &&
    lng === GENERIC_GEOCODE_FALLBACK[1] &&
    (geoLat !== GENERIC_GEOCODE_FALLBACK[0] || geoLng !== GENERIC_GEOCODE_FALLBACK[1])
  ) {
    return [geoLat, geoLng];
  }

  return [lat, lng];
}

export function mapCrmConnection(row: DbConnection): CrmConnection {
  const city = row.city?.trim() || "Unknown";
  const country = row.country?.trim() || "Unknown";
  const [latitude, longitude] = resolveConnectionCoordinates(
    city,
    country,
    row.latitude,
    row.longitude,
  );

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    specialties: row.specialties ?? "",
    background: row.background ?? "",
    countryExperience: row.country_experience ?? "",
    city,
    country,
    latitude,
    longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createBlankConnectionInput(): Omit<
  CrmConnection,
  "id" | "createdAt" | "updatedAt"
> {
  const [latitude, longitude] = geocodeConnection("London", "UK");
  return {
    name: "",
    role: "Advisor",
    specialties: "",
    background: "",
    countryExperience: "",
    city: "London",
    country: "UK",
    latitude,
    longitude,
  };
}

export const CRM_CONNECTION_ROLE_OPTIONS = [
  "CTO",
  "CRO",
  "COO",
  "CSO",
  "Advisor",
] as const;

export type CrmConnectionRole = (typeof CRM_CONNECTION_ROLE_OPTIONS)[number];
