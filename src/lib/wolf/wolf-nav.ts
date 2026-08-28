/**
 * WOLF Central navigation — isolated from the 22-module central catalogue layout.
 *
 * Operational sidebar only: routes that exist today, grouped by function.
 * Future catalogue entries (inventory, leads, projects, etc.) stay out of the
 * main nav until they ship — see module-catalogue / wolf-central-provisioning.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";

const WOLF_GREEN = "#1a4d3a";
const WOLF_RUST = "#8b4513";
const WOLF_DRONE = "#2d4a3e";
const WOLF_ENV = "#3d5c4a";
const WOLF_FLEET = "#1e3a2f";
const WOLF_ADMIN = "#1a1a1a";

export function buildWolfCentralNavSections(): readonly InternalNavSection[] {
  return [
    {
      kind: "pin",
      label: null,
      items: [{ label: "Estate overview", icon: "Globe2", view: "wolf-estate" }],
    },
    {
      kind: "workspace",
      label: "Safari Parks",
      icon: "Map",
      color: WOLF_GREEN,
      items: [{ label: "Parks & Reserves", icon: "MapPinned", view: "wolf-safari-parks" }],
    },
    {
      kind: "workspace",
      label: "Animals",
      icon: "Binoculars",
      color: WOLF_GREEN,
      items: [{ label: "Monitoring", icon: "ScanSearch", view: "wolf-animals" }],
    },
    {
      kind: "workspace",
      label: "Drone Operations",
      icon: "Plane",
      color: WOLF_DRONE,
      items: [{ label: "Operations dashboard", icon: "Radar", view: "wolf-drone-operations" }],
    },
    {
      kind: "workspace",
      label: "Containment",
      icon: "Shield",
      color: WOLF_RUST,
      items: [{ label: "Overview", icon: "ShieldCheck", view: "wolf-containment" }],
    },
    {
      kind: "workspace",
      label: "Environment",
      icon: "CloudSun",
      color: WOLF_ENV,
      items: [{ label: "Overview", icon: "ThermometerSun", view: "wolf-environment" }],
    },
    {
      kind: "workspace",
      label: "Fleet & Assets",
      icon: "Boxes",
      color: WOLF_FLEET,
      items: [{ label: "Fleet overview", icon: "Package", view: "wolf-fleet" }],
    },
    {
      kind: "workspace",
      label: "Administration",
      icon: "Settings",
      color: WOLF_ADMIN,
      items: [
        { label: "General", icon: "Settings", view: "settings" },
        { label: "Appearance", icon: "Palette", view: "appearance" },
        { label: "Users", icon: "Users", view: "users" },
      ],
    },
  ];
}
