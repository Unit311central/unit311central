export const STABLE_FACILITY_TABS = [
  { id: "overview", label: "Overview" },
  { id: "horses", label: "Horses" },
  { id: "cameras", label: "Cameras" },
  { id: "health", label: "Health" },
  { id: "care", label: "Daily Care" },
  { id: "staff", label: "Staff" },
  { id: "facilities", label: "Facilities" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
] as const;

export type StableFacilityTab = (typeof STABLE_FACILITY_TABS)[number]["id"];

export function parseStableFacilityTab(value: string | null): StableFacilityTab {
  const match = STABLE_FACILITY_TABS.find((tab) => tab.id === value);
  return match?.id ?? "overview";
}
