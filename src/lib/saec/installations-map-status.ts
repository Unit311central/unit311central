import type { SaecCityAggregate } from "@/lib/saec/installations-types";

export type CityStatusSegment = {
  key: "online" | "offline" | "maintenance";
  value: number;
  color: string;
  label: string;
};

/** Non-overlapping slices for map donut markers (demo aggregates). */
export function cityStatusSegments(city: SaecCityAggregate): CityStatusSegment[] {
  const offline = city.offline;
  const maintenance = Math.max(0, city.maintenanceDue + city.overdue - offline);
  const online = Math.max(0, city.total - offline - maintenance);
  const segments: CityStatusSegment[] = [];
  if (online > 0) {
    segments.push({ key: "online", value: online, color: "#34d399", label: "Online" });
  }
  if (offline > 0) {
    segments.push({ key: "offline", value: offline, color: "#f87171", label: "Offline" });
  }
  if (maintenance > 0) {
    segments.push({
      key: "maintenance",
      value: maintenance,
      color: "#fbbf24",
      label: "Maintenance",
    });
  }
  return segments;
}

export function dominantCityStatus(city: SaecCityAggregate): CityStatusSegment["key"] {
  if (city.offline > 0) return "offline";
  if (city.maintenanceDue + city.overdue > 0) return "maintenance";
  return "online";
}

export function cityStatusStrokeColor(status: CityStatusSegment["key"]): string {
  switch (status) {
    case "offline":
      return "#fecaca";
    case "maintenance":
      return "#fde68a";
    default:
      return "#a7f3d0";
  }
}
