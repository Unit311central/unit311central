/**
 * Green Desert client portal — navigation + section routing.
 */

export type GreenDesertClientPortalSection =
  | "dashboard"
  | "projects"
  | "documents"
  | "support"
  | "messages";

export const GREENDESERT_CLIENT_NAV: {
  id: GreenDesertClientPortalSection;
  label: string;
  hrefSuffix: string;
}[] = [
  { id: "dashboard", label: "Dashboard", hrefSuffix: "" },
  { id: "projects", label: "Projects", hrefSuffix: "/projects" },
  { id: "documents", label: "Documents", hrefSuffix: "/documents" },
  { id: "support", label: "Support", hrefSuffix: "/support" },
  { id: "messages", label: "Messages", hrefSuffix: "/messages" },
];

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
