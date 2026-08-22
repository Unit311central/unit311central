import type { InternalNavItem } from "@/lib/internal-operations-data";

export const ENGINEERING_SOP_CHILD_VIEWS = [
  "engineering-sops-dashboard",
  "engineering-sops-library",
  "engineering-sops-tasks",
  "engineering-sops-runs",
  "engineering-sops-reviews",
  "engineering-sops-templates",
  "engineering-sops-reports",
] as const;

export type EngineeringSopChildView = (typeof ENGINEERING_SOP_CHILD_VIEWS)[number];

/** Shared Engineering → SOPs nav group (central product capability). */
export const ENGINEERING_SOPS_NAV_ITEM: InternalNavItem = {
  label: "SOPs",
  icon: "ScrollText",
  children: [
    { label: "Dashboard", view: "engineering-sops-dashboard" },
    { label: "SOP Library", view: "engineering-sops-library" },
    { label: "My Tasks", view: "engineering-sops-tasks" },
    { label: "Active Runs", view: "engineering-sops-runs" },
    { label: "Reviews & Approvals", view: "engineering-sops-reviews" },
    { label: "SOP Templates", view: "engineering-sops-templates" },
    { label: "Reports", view: "engineering-sops-reports" },
  ],
};

export function isEngineeringSopView(view: string): boolean {
  return view === "engineering-sops" || (ENGINEERING_SOP_CHILD_VIEWS as readonly string[]).includes(view);
}
