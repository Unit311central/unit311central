/**
 * WOLF Central navigation — isolated from the 22-module central catalogue layout.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";

const WOLF_GREEN = "#1a4d3a";
const WOLF_RUST = "#8b4513";

export function buildWolfCentralNavSections(): readonly InternalNavSection[] {
  return [
    {
      kind: "pin",
      label: null,
      items: [
        { label: "WOLF Estate", icon: "Globe2", view: "wolf-estate" },
      ],
    },
    {
      kind: "workspace",
      label: "Safari Parks",
      icon: "Map",
      color: WOLF_GREEN,
      items: [{ label: "Registry", icon: "MapPinned", view: "wolf-safari-parks" }],
    },
    {
      kind: "workspace",
      label: "Drone Operations",
      icon: "Plane",
      color: "#2d4a3e",
      items: [{ label: "Summary", icon: "Radar", view: "wolf-drone-operations" }],
    },
    {
      kind: "workspace",
      label: "Animals",
      icon: "Binoculars",
      color: WOLF_GREEN,
      items: [{ label: "Summary", icon: "ScanSearch", view: "wolf-animals" }],
    },
    {
      kind: "workspace",
      label: "Containment",
      icon: "Shield",
      color: WOLF_RUST,
      items: [{ label: "Summary", icon: "ShieldCheck", view: "wolf-containment" }],
    },
    {
      kind: "workspace",
      label: "Environment",
      icon: "CloudSun",
      color: "#3d5c4a",
      items: [{ label: "Summary", icon: "ThermometerSun", view: "wolf-environment" }],
    },
    {
      kind: "workspace",
      label: "Fleet",
      icon: "Boxes",
      color: "#1e3a2f",
      items: [{ label: "Summary", icon: "Package", view: "wolf-fleet" }],
    },
    {
      kind: "workspace",
      label: "Inventory",
      icon: "Warehouse",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Support",
      icon: "LifeBuoy",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Training",
      icon: "GraduationCap",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Projects",
      icon: "FolderKanban",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Leads",
      icon: "UserPlus",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Meetings",
      icon: "CalendarDays",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Directory",
      icon: "Users",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Information",
      icon: "FileText",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Content Studio",
      icon: "Palette",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Finance",
      icon: "Wallet",
      color: "#2a2a2a",
      items: [{ label: "Coming soon", icon: "Clock", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Settings",
      icon: "Settings",
      color: "#1a1a1a",
      items: [
        { label: "General", icon: "Settings", view: "settings" },
        { label: "Appearance", icon: "Palette", view: "appearance" },
        { label: "Users", icon: "Users", view: "users" },
      ],
    },
  ];
}
