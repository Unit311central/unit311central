/**
 * PAILEX customer workspace navigation — reserve operations IA.
 * All routes are implemented; no placeholders or catalogue leakage.
 */

import type { InternalNavSection } from "@/lib/internal-operations-data";

const WOLF_GREEN = "#1a4d3a";
const WOLF_RUST = "#8b4513";
const WOLF_DRONE = "#2d4a3e";
const WOLF_ENV = "#3d5c4a";
const WOLF_FLEET = "#1e3a2f";
const WOLF_ADMIN = "#1a1a1a";

/** Expected top-level section labels (title case — sidebar renders uppercase). */
export const PAILEX_NAV_SECTION_LABELS = [
  "Animals",
  "Containment",
  "Environment",
  "Fleet",
  "Drone Operations",
  "Support",
  "Training",
  "Projects",
  "Documents",
  "Settings",
] as const;

export function buildPailexNavSections(): readonly InternalNavSection[] {
  return [
    {
      kind: "pin",
      label: null,
      color: WOLF_GREEN,
      items: [{ label: "Dashboard", icon: "LayoutDashboard", view: "pailex-dashboard" }],
    },
    {
      kind: "workspace",
      label: "Animals",
      icon: "Binoculars",
      color: WOLF_GREEN,
      items: [
        { label: "Registry", icon: "ClipboardList", view: "pailex-animals-registry" },
        { label: "Monitoring", icon: "ScanSearch", view: "pailex-animals-monitoring" },
        { label: "Census", icon: "List", view: "pailex-animals-census" },
        { label: "Health", icon: "HeartHandshake", view: "pailex-animals-health" },
      ],
    },
    {
      kind: "workspace",
      label: "Containment",
      icon: "ShieldCheck",
      color: WOLF_RUST,
      items: [
        { label: "Perimeter", icon: "ShieldCheck", view: "pailex-containment-perimeter" },
        { label: "Patrols", icon: "Footprints", view: "pailex-containment-patrols" },
        { label: "Incidents", icon: "AlertTriangle", view: "pailex-containment-incidents" },
        { label: "Alerts", icon: "Bell", view: "pailex-containment-alerts" },
      ],
    },
    {
      kind: "workspace",
      label: "Environment",
      icon: "CloudSun",
      color: WOLF_ENV,
      items: [
        { label: "Weather", icon: "Cloud", view: "pailex-environment-weather" },
        { label: "Fire", icon: "Flame", view: "pailex-environment-fire" },
        { label: "Flood", icon: "Waves", view: "pailex-environment-flood" },
        { label: "Monitoring", icon: "ThermometerSun", view: "pailex-environment-monitoring" },
      ],
    },
    {
      kind: "workspace",
      label: "Fleet",
      icon: "Truck",
      color: WOLF_FLEET,
      items: [
        { label: "Vehicles", icon: "Truck", view: "pailex-fleet-vehicles" },
        { label: "Drones", icon: "Plane", view: "pailex-fleet-drones" },
        { label: "Equipment", icon: "Wrench", view: "pailex-fleet-equipment" },
      ],
    },
    {
      kind: "workspace",
      label: "Drone Operations",
      icon: "Radar",
      color: WOLF_DRONE,
      items: [
        { label: "Operations", icon: "Activity", view: "pailex-drone-operations" },
        { label: "Missions", icon: "Map", view: "pailex-drone-missions" },
        { label: "Flight Logs", icon: "ScrollText", view: "pailex-drone-flight-logs" },
      ],
    },
    {
      kind: "workspace",
      label: "Support",
      icon: "LifeBuoy",
      color: WOLF_ADMIN,
      items: [
        { label: "Requests", icon: "MessageSquare", view: "pailex-support-requests" },
        { label: "Maintenance", icon: "Wrench", view: "pailex-support-maintenance" },
      ],
    },
    {
      kind: "workspace",
      label: "Training",
      icon: "GraduationCap",
      color: WOLF_GREEN,
      items: [
        { label: "Training", icon: "BookOpen", view: "pailex-training" },
        { label: "Certifications", icon: "Award", view: "pailex-training-certifications" },
        { label: "Competency", icon: "Users", view: "pailex-training-competency" },
      ],
    },
    {
      kind: "workspace",
      label: "Projects",
      icon: "FolderKanban",
      color: WOLF_DRONE,
      items: [
        { label: "Active Projects", icon: "FolderOpen", view: "pailex-projects-active" },
        { label: "Tasks", icon: "CheckSquare", view: "pailex-projects-tasks" },
      ],
    },
    {
      kind: "workspace",
      label: "Documents",
      icon: "FileText",
      color: WOLF_ENV,
      items: [
        { label: "Documents", icon: "Files", view: "pailex-documents" },
        { label: "Procedures", icon: "BookMarked", view: "pailex-documents-procedures" },
        { label: "Reports", icon: "BarChart3", view: "pailex-documents-reports" },
      ],
    },
    {
      kind: "workspace",
      label: "Settings",
      icon: "Settings",
      color: WOLF_ADMIN,
      items: [
        { label: "Settings", icon: "Settings", view: "settings" },
        { label: "Users", icon: "Users", view: "users" },
      ],
    },
  ];
}
