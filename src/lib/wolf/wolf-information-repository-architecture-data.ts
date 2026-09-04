import {
  createBlankArchitectureDiagram,
  type ArchitectureCatalogEntry,
  type ArchitectureDiagramDocument,
  type ArchitectureNodeBadge,
} from "@/lib/architecture-diagram-data";
import { ARCHITECTURE_TREE_SLUGS } from "@/lib/architecture-taxonomy-types";
import { WOLF_CENTRAL_HOST_ALIAS, WOLF_CENTRAL_SLUG, WOLF_DISPLAY_NAME } from "@/lib/wolf/wolf-surface";

/** Unit311 platform canvas diagrams shown in the WOLF Information Repository. */
export const WOLF_IR_UNIT311_CANVAS_SLUGS = [
  "platform-overview",
  "vercel-stack",
  "supabase-stack",
  "codebase-stack",
] as const;

export const WOLF_IR_UNIT311_CANVAS_LABELS: Record<
  (typeof WOLF_IR_UNIT311_CANVAS_SLUGS)[number],
  string
> = {
  "platform-overview": "Unit311Central platform",
  "vercel-stack": "Vercel deployment stack",
  "supabase-stack": "Supabase",
  "codebase-stack": "Application codebase",
};

export const WOLF_IR_UNIT311_TREE_TABS = [
  { slug: ARCHITECTURE_TREE_SLUGS.coreProduct, title: "Core product" },
  { slug: ARCHITECTURE_TREE_SLUGS.customProduct, title: "Custom product" },
  { slug: ARCHITECTURE_TREE_SLUGS.workspaceArchitecture, title: "Workspace architecture" },
] as const;

export const WOLF_IR_TREE_TITLES: Record<string, string> = {
  [ARCHITECTURE_TREE_SLUGS.coreProduct]: "Core Product",
  [ARCHITECTURE_TREE_SLUGS.customProduct]: "Custom Product",
  [ARCHITECTURE_TREE_SLUGS.workspaceArchitecture]: "Workspace Architecture",
};

/** Built-in WOLF architecture diagram slugs (stored in system_architecture_diagrams). */
export const WOLF_IR_BUILTIN_DIAGRAM_SLUGS = [
  "wolf-architecture",
  "wolf-pailex-infrastructure",
  "wolf-ai-models",
] as const;

export type WolfIrBuiltinDiagramSlug = (typeof WOLF_IR_BUILTIN_DIAGRAM_SLUGS)[number];

export const WOLF_IR_BUILTIN_DIAGRAM_LABELS: Record<WolfIrBuiltinDiagramSlug, string> = {
  "wolf-architecture": "WOLF ARCHITECTURE",
  "wolf-pailex-infrastructure": "PAILEX INFRASTRUCTURE",
  "wolf-ai-models": "WOLF AI MODELS",
};

export const WOLF_IR_BUILTIN_DIAGRAM_DESCRIPTIONS: Record<WolfIrBuiltinDiagramSlug, string> = {
  "wolf-architecture":
    "Living workspace diagram — wolf.unit311central.com, custom modules, PAILEX portal, and tenancy.",
  "wolf-pailex-infrastructure":
    "Live PAILEX reserve stack — drone video ingest, satellite uplink, RunPod AI inference, and WOLF workspace delivery.",
  "wolf-ai-models":
    "Placeholder for WOLF AI wildlife vision models, inference pipelines, and training data flows.",
};

export const WOLF_IR_CUSTOM_DIAGRAM_PREFIX = "wolf-custom-";

export const WOLF_IR_WOLF_CATALOG: readonly ArchitectureCatalogEntry[] = [
  {
    sectionSlug: "wolf-architecture",
    title: WOLF_IR_BUILTIN_DIAGRAM_LABELS["wolf-architecture"],
    description: WOLF_IR_BUILTIN_DIAGRAM_DESCRIPTIONS["wolf-architecture"],
    navOrder: 10,
    liveRefresh: true,
    seedTemplate: "blank",
  },
  {
    sectionSlug: "wolf-pailex-infrastructure",
    title: WOLF_IR_BUILTIN_DIAGRAM_LABELS["wolf-pailex-infrastructure"],
    description: WOLF_IR_BUILTIN_DIAGRAM_DESCRIPTIONS["wolf-pailex-infrastructure"],
    navOrder: 20,
    liveRefresh: true,
    seedTemplate: "blank",
  },
  {
    sectionSlug: "wolf-ai-models",
    title: WOLF_IR_BUILTIN_DIAGRAM_LABELS["wolf-ai-models"],
    description: WOLF_IR_BUILTIN_DIAGRAM_DESCRIPTIONS["wolf-ai-models"],
    navOrder: 30,
    seedTemplate: "blank",
  },
];

export function isWolfIrBuiltinDiagramSlug(
  slug: string | null | undefined,
): slug is WolfIrBuiltinDiagramSlug {
  return (
    slug === "wolf-architecture" ||
    slug === "wolf-pailex-infrastructure" ||
    slug === "wolf-ai-models"
  );
}

export function isWolfIrCustomDiagramSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "")
    .trim()
    .toLowerCase()
    .startsWith(WOLF_IR_CUSTOM_DIAGRAM_PREFIX);
}

export function isWolfIrManagedDiagramSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  return isWolfIrBuiltinDiagramSlug(normalized) || isWolfIrCustomDiagramSlug(normalized);
}

export function slugifyWolfIrDiagramTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "diagram";
}

export function createWolfIrCustomDiagramSlug(title: string): string {
  const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${WOLF_IR_CUSTOM_DIAGRAM_PREFIX}${slugifyWolfIrDiagramTitle(title)}-${suffix}`;
}

function architectureNode(
  id: string,
  label: string,
  kind: "frontend" | "service" | "database" | "integration" | "storage" | "group",
  x: number,
  y: number,
  extra: {
    description?: string;
    parentId?: string;
    icon?: string;
    status?: "live" | "beta" | "planned";
    style?: Record<string, string | number>;
    badges?: ArchitectureNodeBadge[];
    width?: number;
    height?: number;
  } = {},
) {
  const { parentId, style, width, height, ...data } = extra;
  const nodeStyle: Record<string, string | number> = { ...style };
  if (width != null) nodeStyle.width = width;
  if (height != null) nodeStyle.minHeight = height;
  return {
    id,
    type: kind === "group" ? ("group" as const) : ("architecture" as const),
    position: { x, y },
    parentId,
    extent: parentId ? ("parent" as const) : undefined,
    width,
    height,
    style: Object.keys(nodeStyle).length ? nodeStyle : undefined,
    data: {
      label,
      nodeKind: kind,
      ...data,
    },
  };
}

/** Default child node width inside PAILEX groups — roomy for labels + descriptions. */
const PAILEX_NODE_WIDTH = 360;
const PAILEX_NODE_ROW_GAP = 156;

function pailexChildNode(
  id: string,
  label: string,
  kind: "frontend" | "service" | "database" | "integration" | "storage",
  parentId: string,
  row: number,
  extra: Omit<Parameters<typeof architectureNode>[5], "parentId" | "width"> = {},
) {
  return architectureNode(id, label, kind, 36, 48 + row * PAILEX_NODE_ROW_GAP, {
    parentId,
    width: PAILEX_NODE_WIDTH,
    ...extra,
  });
}

/** PAILEX seed version — bump to refresh existing diagrams in production. */
export const WOLF_PAILEX_INFRASTRUCTURE_SEED_VERSION = 2;

/** Living PAILEX infrastructure diagram — drone → satellite → RunPod AI → WOLF workspace. */
export function createPailexInfrastructureDiagram(): ArchitectureDiagramDocument {
  const fieldGroupHeight = 48 + 4 * PAILEX_NODE_ROW_GAP + 120;
  const connectivityGroupHeight = 48 + 2 * PAILEX_NODE_ROW_GAP + 120;
  const cloudGroupHeight = 48 + 3 * PAILEX_NODE_ROW_GAP + 120;
  const groupWidth = PAILEX_NODE_WIDTH + 72;

  return {
    version: 1,
    viewport: { x: 20, y: 10, zoom: 0.52 },
    meta: {
      generator: "wolf-information-repository",
      title: WOLF_IR_BUILTIN_DIAGRAM_LABELS["wolf-pailex-infrastructure"],
      seedVersion: WOLF_PAILEX_INFRASTRUCTURE_SEED_VERSION,
      generatedAt: new Date().toISOString(),
      liveRefresh: true,
    },
    nodes: [
      architectureNode("group-field", "Field operations (BCN)", "group", 20, 20, {
        style: { width: groupWidth, height: fieldGroupHeight },
      }),
      pailexChildNode("drone", "Drone", "frontend", "group-field", 0, {
        description:
          "Camera sensor · image processing · video encoder H.264/H.265 ~20Mbps · radio transmitter",
        icon: "zap",
        status: "live",
        badges: [{ label: "UAV", tone: "sky" }],
      }),
      pailexChildNode("bcn-radio", "BCN Radio Trans Base station", "service", "group-field", 1, {
        description: "Receives compressed + thermal streams · relays control actions to drone",
        icon: "server",
        status: "live",
      }),
      pailexChildNode("bcn-switch", "BCN Switch / router", "service", "group-field", 2, {
        description: "Ethernet backhaul between base station and field laptops",
        icon: "link",
        status: "live",
      }),
      pailexChildNode("bcn-laptops", "BCN Laptops (Wi‑Fi)", "frontend", "group-field", 3, {
        description: "Mission Planner · QGroundControl · local live video monitoring",
        icon: "layout-dashboard",
        status: "live",
      }),

      architectureNode("group-connectivity", "Satellite uplink", "group", 520, 120, {
        style: { width: groupWidth, height: connectivityGroupHeight },
      }),
      pailexChildNode("sat-connection", "New sat Connection", "integration", "group-connectivity", 0, {
        description: "Satellite backhaul hub · routes video to cloud AI and client laptops",
        icon: "globe",
        status: "live",
        badges: [{ label: "Satellite", tone: "amber" }],
      }),
      pailexChildNode("wifi-router", "Wi‑Fi router", "service", "group-connectivity", 1, {
        description: "To internet / satellite · local Pailex client access",
        icon: "link",
        status: "live",
      }),

      architectureNode("pailex-laptops", "Pailex Laptops", "frontend", 1020, 220, {
        width: PAILEX_NODE_WIDTH,
        description: "React.js · WOLF workspace client · live video + AI results",
        icon: "layout-dashboard",
        status: "live",
        badges: [{ label: "Client", tone: "emerald" }],
      }),

      architectureNode("group-cloud", "Application cloud", "group", 1420, 20, {
        style: { width: groupWidth, height: cloudGroupHeight },
      }),
      pailexChildNode("vercel", "VERCEL", "frontend", "group-cloud", 0, {
        description: "WOLF Workspace · Next.js · wolf.unit311central.com",
        icon: "globe",
        status: "live",
        badges: [{ label: "Edge", tone: "emerald" }],
      }),
      pailexChildNode("supabase", "SUPABASE", "database", "group-cloud", 1, {
        description: "Postgres SQL · reserve telemetry · AI metadata persistence",
        icon: "database",
        status: "live",
      }),
      pailexChildNode("github-web", "GitHub Repo", "storage", "group-cloud", 2, {
        description: "Unit311 · TypeScript monorepo · deploys to Vercel",
        icon: "folder-open",
        status: "live",
      }),

      architectureNode("group-ai", "AI inference (RunPod)", "group", 1420, cloudGroupHeight + 60, {
        style: { width: groupWidth, height: cloudGroupHeight },
      }),
      pailexChildNode("runpod", "RUNPOD", "service", "group-ai", 0, {
        description:
          "WOLF AI Python + GPU · FFmpeg CPU decode (video frames) · GPU model inference",
        icon: "server",
        status: "live",
        badges: [{ label: "GPU", tone: "violet" }],
      }),
      pailexChildNode("runpod-models", "Detection models", "integration", "group-ai", 1, {
        description: "Fence · Animal · Injury · Fire · Flood · Poaching",
        icon: "bot",
        status: "live",
      }),
      pailexChildNode("github-ai", "GitHub Repo", "storage", "group-ai", 2, {
        description: "WOLF AI · Python inference pipelines · model weights",
        icon: "folder-open",
        status: "live",
      }),
    ],
    edges: [
      { id: "e-drone-compressed", source: "drone", target: "bcn-radio", label: "Compressed video", animated: true },
      { id: "e-drone-thermal", source: "drone", target: "bcn-radio", label: "Thermal video" },
      { id: "e-drone-control", source: "bcn-radio", target: "drone", label: "Control actions" },
      { id: "e-radio-switch", source: "bcn-radio", target: "bcn-switch", animated: true },
      { id: "e-switch-laptops", source: "bcn-switch", target: "bcn-laptops", label: "Live video" },
      { id: "e-radio-sat", source: "bcn-radio", target: "sat-connection", animated: true },
      { id: "e-sat-wifi", source: "sat-connection", target: "wifi-router" },
      { id: "e-sat-pailex", source: "sat-connection", target: "pailex-laptops", label: "Live video", animated: true },
      { id: "e-sat-runpod-live", source: "sat-connection", target: "runpod", label: "Live / telemetry video", animated: true },
      { id: "e-sat-runpod-thermal", source: "sat-connection", target: "runpod", label: "Thermal video" },
      { id: "e-runpod-models", source: "runpod", target: "runpod-models" },
      { id: "e-runpod-vercel", source: "runpod", target: "vercel", label: "AI results / metadata", animated: true },
      { id: "e-vercel-supabase", source: "vercel", target: "supabase", animated: true },
      { id: "e-github-vercel", source: "github-web", target: "vercel", label: "deploy" },
      { id: "e-github-runpod", source: "github-ai", target: "runpod", label: "deploy" },
      { id: "e-vercel-pailex", source: "vercel", target: "pailex-laptops", label: "WOLF app", animated: true },
      { id: "e-pailex-vercel", source: "pailex-laptops", target: "vercel" },
    ],
  };
}

/** Living WOLF workspace architecture seed — editable after first save. */
export function createWolfArchitectureDiagram(): ArchitectureDiagramDocument {
  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.86 },
    meta: {
      generator: "wolf-information-repository",
      title: WOLF_IR_BUILTIN_DIAGRAM_LABELS["wolf-architecture"],
      workspaceSlug: WOLF_CENTRAL_SLUG,
      generatedAt: new Date().toISOString(),
      liveRefresh: true,
    },
    nodes: [
      architectureNode("host", `${WOLF_CENTRAL_HOST_ALIAS}.unit311central.com`, "frontend", 80, 40, {
        description: `${WOLF_DISPLAY_NAME} Central public host · slug ${WOLF_CENTRAL_SLUG}`,
        icon: "globe",
        status: "live",
      }),
      architectureNode("middleware", "Vercel middleware", "service", 400, 40, {
        description: "Portal routing · /pailex · /ws/wolf gateway",
        icon: "link",
        status: "live",
      }),
      architectureNode("next-app", "Next.js workspace shell", "frontend", 720, 40, {
        description: "Shared monorepo deployment · WOLF-only surface gates",
        icon: "layout-dashboard",
        status: "live",
      }),
      architectureNode("workspace-row", WOLF_CENTRAL_SLUG, "database", 400, 180, {
        description: "WOLF Central tenancy · custom module enablement",
        icon: "building-2",
        status: "live",
      }),
      architectureNode("supabase", "Supabase tenancy", "database", 720, 180, {
        description: "workspaces.id · workspace_id filters · Information Repository",
        icon: "database",
        status: "live",
      }),
      architectureNode("group-modules", "WOLF specialist modules", "group", 80, 300, {
        style: { width: 520, height: 300 },
      }),
      architectureNode("animals", "Safari parks & animals", "service", 40, 50, {
        parentId: "group-modules",
        description: "wolf-animals · containment · environment",
        icon: "users",
        status: "live",
      }),
      architectureNode("fleet", "Fleet & drone operations", "service", 40, 130, {
        parentId: "group-modules",
        description: "wolf-fleet · wolf-drone-operations · estate metrics",
        icon: "server",
        status: "live",
      }),
      architectureNode("business-central", "Business Central", "service", 40, 210, {
        parentId: "group-modules",
        description: "Information Repository · architecture diagrams · attachments",
        icon: "folder-open",
        status: "live",
      }),
      architectureNode("pailex", "PAILEX portal", "frontend", 640, 320, {
        description: "wolf.unit311central.com/pailex · reserve client access",
        icon: "users",
        status: "live",
      }),
      architectureNode("ai-vision", "WOLF AI wildlife vision", "integration", 280, 320, {
        description: "wolf-tools:wolf-ai-wildlife-vision · model inference",
        icon: "bot",
        status: "beta",
      }),
    ],
    edges: [
      { id: "e-host-mw", source: "host", target: "middleware", animated: true },
      { id: "e-mw-app", source: "middleware", target: "next-app", animated: true },
      { id: "e-app-ws", source: "next-app", target: "workspace-row", label: "workspace_id" },
      { id: "e-ws-db", source: "workspace-row", target: "supabase", animated: true },
      { id: "e-ws-pailex", source: "workspace-row", target: "pailex", label: "portals" },
      { id: "e-ws-ai", source: "workspace-row", target: "ai-vision", label: "AI tools" },
      { id: "e-ws-modules", source: "workspace-row", target: "group-modules" },
    ],
  };
}

export function createWolfPlaceholderDiagram(
  slug: WolfIrBuiltinDiagramSlug,
): ArchitectureDiagramDocument {
  const title = WOLF_IR_BUILTIN_DIAGRAM_LABELS[slug];
  const description = WOLF_IR_BUILTIN_DIAGRAM_DESCRIPTIONS[slug];
  const blank = createBlankArchitectureDiagram(title);
  const start = blank.nodes[0];
  if (!start) return blank;
  return {
    ...blank,
    meta: {
      ...blank.meta,
      generator: "wolf-information-repository-placeholder",
      placeholder: true,
      sectionSlug: slug,
    },
    nodes: [
      {
        ...start,
        data: {
          ...start.data,
          label: title,
          description,
          status: "planned",
        },
      },
    ],
  };
}

export function resolveWolfIrSeedDiagram(sectionSlug: string): ArchitectureDiagramDocument {
  if (sectionSlug === "wolf-architecture") {
    return createWolfArchitectureDiagram();
  }
  if (sectionSlug === "wolf-pailex-infrastructure") {
    return createPailexInfrastructureDiagram();
  }
  if (isWolfIrBuiltinDiagramSlug(sectionSlug)) {
    return createWolfPlaceholderDiagram(sectionSlug);
  }
  return createBlankArchitectureDiagram(sectionSlug);
}

export function shouldRefreshWolfIrBuiltinDiagram(
  sectionSlug: string,
  diagramJson: ArchitectureDiagramDocument | undefined,
): boolean {
  if (sectionSlug === "wolf-pailex-infrastructure") {
    const seedVersion = Number(diagramJson?.meta?.seedVersion ?? 0);
    if (seedVersion < WOLF_PAILEX_INFRASTRUCTURE_SEED_VERSION) return true;
    if (diagramJson?.meta?.placeholder === true) return true;
    if (diagramJson?.meta?.generator === "wolf-information-repository-placeholder") return true;
  }
  return false;
}
