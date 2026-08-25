import type { InternalNavItem } from "@/lib/internal-operations-data";

/** SAEC-only Operations nav extension — not part of the central module catalogue. */
export const SAEC_INSTALLATIONS_NAV_ITEM: InternalNavItem = {
  label: "Installations",
  icon: "Building2",
  children: [
    { label: "Dashboard", view: "saec-installations-dashboard" },
    { label: "Elevators", view: "saec-installations-elevators" },
    { label: "Escalators", view: "saec-installations-escalators" },
  ],
};

export function augmentSaecOperationsNav(items: InternalNavItem[]): InternalNavItem[] {
  const dashboardIndex = items.findIndex((item) => item.view === "operations-dashboard");
  const insertAt = dashboardIndex >= 0 ? dashboardIndex + 1 : 0;
  const next = [...items];
  next.splice(insertAt, 0, SAEC_INSTALLATIONS_NAV_ITEM);
  return next;
}
