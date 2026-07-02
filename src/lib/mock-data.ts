export type ActivityType = "success" | "warning" | "danger" | "info";

export const IMAGES = {
  siteIntelligence: "/images/site-intelligence.jpg",
  topography: "/images/topography.png",
  meshBg: "/images/mesh-bg.png",
} as const;

export const project = {
  name: "Westport Logistics Hub",
  client: "TerraBuild Infrastructure",
  industry: "Industrial Logistics Development",
  location: "Western Australia",
  siteArea: "240ha",
  completion: 67,
  daysAhead: 4,
  earthworksCompleted: "1.82M",
  issues: 12,
  lastSurvey: "4 Days Ago",
  updated: "4 Days Ago",
  captured: "4 Days Ago",
  targetCompletion: "March 2026",
  projectValue: "$180M",
  coordinates: "−32.045°S · 115.742°E",
};

export const NAV_ITEMS = [
  { label: "Dashboard", icon: "LayoutDashboard", active: true },
  { label: "Analytics", icon: "BarChart3" },
  { label: "Site Maps", icon: "Map" },
  { label: "Reports", icon: "FileText" },
  { label: "Documents", icon: "Files" },
  { label: "Alerts", icon: "Bell" },
  { label: "Settings", icon: "Settings" },
] as const;

export const PAGE_TABS = [
  { id: "overview", label: "Overview", active: true },
  { id: "progress", label: "Progress" },
  { id: "earthworks", label: "Earthworks" },
  { id: "schedule", label: "Schedule" },
  { id: "risk", label: "Risk" },
  { id: "reports", label: "Reports" },
  { id: "maps", label: "Maps" },
  { id: "aerial-intelligence", label: "Aerial intelligence" },
] as const;

export type PageTabId = (typeof PAGE_TABS)[number]["id"];

export const PROJECT_BRIEF = {
  title: "PROJECT BRIEF",
  intro:
    "Westport Logistics Hub is a 240-hectare industrial logistics precinct comprising:",
  items: [
    "8 warehouse facilities",
    "Utilities corridor",
    "Drainage infrastructure",
    "Internal road network",
  ],
  targetCompletion: "March 2026",
  projectValue: "$180M",
};

export const KPI_METRICS = [
  { value: "67%", label: "Project Completion", accent: "blue" as const },
  { value: "+4", label: "Days Ahead", accent: "emerald" as const },
  { value: "1.82M m³", label: "Earthworks Completed", accent: "cyan" as const },
  { value: "12", label: "Open Issues", accent: "amber" as const },
];

export const AI_SUMMARY = {
  title: "AI PROJECT SUMMARY",
  meshImage: IMAGES.meshBg,
  paragraphs: [
    "Earthworks continue ahead of schedule with 1.82 million cubic metres completed.",
    "Warehouse Zones A and B remain ahead of planned progress.",
    "Drainage works in the southern corridor remain the primary schedule risk.",
    "Overall project completion increased from 61% to 67% since the previous survey.",
  ],
};

export const PROGRESS_PLANNED = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 90, 100];
export const PROGRESS_ACTUAL = [8, 20, 25, 35, 45, 50, 55, 60, 65, 75, 76, 77];

export const PROGRESS_VS_PLAN_DATA = PROGRESS_PLANNED.map((planned, index) => ({
  period: `M${index + 1}`,
  planned,
  actual: PROGRESS_ACTUAL[index],
}));

export const SCHEDULE_PERFORMANCE_DATA = [
  { milestone: "Earthworks", planned: 88, actual: 94 },
  { milestone: "Drainage", planned: 72, actual: 61 },
  { milestone: "Roads", planned: 65, actual: 68 },
  { milestone: "Utilities", planned: 58, actual: 55 },
  { milestone: "Warehouses", planned: 45, actual: 49 },
];

export const COMPLETION_TREND_DATA = [
  { month: "Jan", completion: 18 },
  { month: "Feb", completion: 28 },
  { month: "Mar", completion: 36 },
  { month: "Apr", completion: 44 },
  { month: "May", completion: 55 },
  { month: "Jun", completion: 67 },
];

export const SITE_MARKERS = [
  { id: 1, label: "North Warehouse", x: "22%", y: "24%" },
  { id: 2, label: "South Warehouse", x: "58%", y: "62%" },
  { id: 3, label: "Utilities Corridor", x: "44%", y: "44%" },
  { id: 4, label: "Truck Yard", x: "74%", y: "28%" },
] as const;

export const ZONE_PROGRESS = [
  { zone: "North Warehouse", progress: 82, variance: +6 },
  { zone: "South Warehouse", progress: 49, variance: -9 },
  { zone: "Utilities Corridor", progress: 61, variance: -4 },
  { zone: "Truck Yard", progress: 78, variance: +3 },
];

export const EARTHWORKS_VOLUME_DATA = [
  { month: "Jan", volume: 520 },
  { month: "Feb", volume: 700 },
  { month: "Mar", volume: 620 },
  { month: "Apr", volume: 810 },
  { month: "May", volume: 860 },
  { month: "Jun", volume: 940 },
];

export const REPORTS = [
  { title: "June Progress Report", generatedAgo: "2 days ago" },
  { title: "Earthworks Analysis", generatedAgo: "4 days ago" },
  { title: "Executive Summary", generatedAgo: "5 days ago" },
  { title: "Monthly Progress Pack", generatedAgo: "8 days ago" },
];

export const UPCOMING_ACTIVITIES = [
  { title: "Drone Survey", date: "20 Jun 2026", time: "06:00 AWST" },
  { title: "Progress Meeting", date: "21 Jun 2026", time: "10:30 AWST" },
  { title: "Earthworks Audit", date: "24 Jun 2026", time: "08:00 AWST" },
  { title: "Monthly Report", date: "30 Jun 2026", time: "17:00 AWST" },
];

export const PLATFORM_STATS = {
  classification: "TerraBuild Confidential",
  apiVersion: "v3.2.1",
  latency: "42ms",
  uptime: "99.97%",
};
