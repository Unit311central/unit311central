/**
 * Green Desert client portal — navigation + section routing.
 */

export type GreenDesertClientPortalSection =
  | "dashboard"
  | "projects"
  | "documents"
  | "support"
  | "messages";

export type GreenDesertClientNavItem = {
  id: GreenDesertClientPortalSection;
  label: string;
  hrefSuffix: string;
};

export type GreenDesertClientNavGroup = {
  id: string;
  label: string | null;
  items: GreenDesertClientNavItem[];
};

export const GREENDESERT_CLIENT_NAV_GROUPS: readonly GreenDesertClientNavGroup[] = [
  {
    id: "home",
    label: null,
    items: [{ id: "dashboard", label: "Programme Dashboard", hrefSuffix: "" }],
  },
  {
    id: "programme",
    label: "Programme",
    items: [{ id: "projects", label: "Active Projects", hrefSuffix: "/projects" }],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "documents", label: "Documents", hrefSuffix: "/documents" },
      { id: "messages", label: "Messages", hrefSuffix: "/messages" },
      { id: "support", label: "Support", hrefSuffix: "/support" },
    ],
  },
] as const;

/** Flat nav for legacy callers. */
export const GREENDESERT_CLIENT_NAV = GREENDESERT_CLIENT_NAV_GROUPS.flatMap(
  (group) => group.items,
);

export function greenDesertClientPortalHref(companyPath: string, hrefSuffix: string) {
  const base = `/${companyPath.replace(/^\/+|\/+$/g, "")}`;
  return hrefSuffix ? `${base}${hrefSuffix}` : base;
}

export function parseGreenDesertClientPortalSection(
  section: string[] | undefined,
): GreenDesertClientPortalSection | null {
  if (!section?.length) return "dashboard";
  const key = section[0]?.toLowerCase();
  if (key === "projects") return "projects";
  if (key === "documents") return "documents";
  if (key === "support") return "support";
  if (key === "messages") return "messages";
  if (key === "dashboard") return "dashboard";
  return null;
}
