import type {
  ArchitectureDiagramDocument,
  ArchitectureDiagramNode,
  ArchitectureNodeData,
  ArchitectureNodeKind,
  SystemArchitectureDiagram,
} from "@/lib/architecture-diagram-data";

export const GREENDESERT_IR_ARCHITECTURE_SLUGS = [
  "gd-algae-cultivation-overview",
  "gd-iot-monitoring-control",
  "gd-water-efficiency-loop",
  "gd-jeddah-client-integration",
] as const;

export type GreenDesertIrArchitectureSlug = (typeof GREENDESERT_IR_ARCHITECTURE_SLUGS)[number];

export const GREENDESERT_IR_ARCHITECTURE_LABELS: Record<GreenDesertIrArchitectureSlug, string> = {
  "gd-algae-cultivation-overview": "Algae cultivation platform",
  "gd-iot-monitoring-control": "IoT monitoring & control",
  "gd-water-efficiency-loop": "Water efficiency closed loop",
  "gd-jeddah-client-integration": "Jeddah Technologies integration",
};

function diagramNode(
  id: string,
  label: string,
  kind: ArchitectureNodeKind,
  x: number,
  y: number,
  extra: Partial<ArchitectureNodeData> & { parentId?: string; style?: Record<string, string | number> } = {},
): ArchitectureDiagramNode {
  const { parentId, style, ...data } = extra;
  return {
    id,
    type: kind === "group" ? "group" : "architecture",
    position: { x, y },
    parentId,
    extent: parentId ? "parent" : undefined,
    style,
    data: {
      label,
      nodeKind: kind,
      status: "live",
      ...data,
    },
  };
}

function createAlgaeCultivationDiagram(): ArchitectureDiagramDocument {
  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.78 },
    meta: { generator: "greendesert-information-repository", title: "Algae cultivation platform" },
    nodes: [
      diagramNode("group-site", "Jeddah pilot site", "group", 40, 40, {
        style: { width: 420, height: 300 },
      }),
      diagramNode("pbr", "Photobioreactors", "frontend", 60, 60, {
        parentId: "group-site",
        description: "IoT-controlled cultivation tanks · growth optimisation",
        icon: "layout-dashboard",
        badges: [{ label: "Pilot", tone: "emerald" }],
      }),
      diagramNode("harvest", "Harvest & drying", "service", 60, 170, {
        parentId: "group-site",
        description: "Nutrient-dense algae powder production line",
        icon: "server",
      }),
      diagramNode("group-ops", "Operations centre", "group", 520, 40, {
        style: { width: 420, height: 300 },
      }),
      diagramNode("scada", "SCADA / HMI", "service", 540, 60, {
        parentId: "group-ops",
        description: "Live telemetry · alarms · batch recipes",
        icon: "server",
      }),
      diagramNode("ml", "ML growth models", "integration", 540, 170, {
        parentId: "group-ops",
        description: "Yield prediction · nutrient dosing recommendations",
        icon: "zap",
        badges: [{ label: "ML", tone: "violet" }],
      }),
      diagramNode("portal", "Jeddah Technologies portal", "frontend", 980, 120, {
        description: "Client dashboard · project files · support",
        icon: "globe",
        badges: [{ label: "Client", tone: "sky" }],
      }),
    ],
    edges: [
      { id: "e1", source: "harvest", target: "scada", label: "batch data", animated: true },
      { id: "e2", source: "ml", target: "pbr", label: "setpoints", animated: true },
      { id: "e3", source: "scada", target: "portal", label: "telemetry export" },
    ],
  };
}

function createIotMonitoringDiagram(): ArchitectureDiagramDocument {
  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.8 },
    meta: { generator: "greendesert-information-repository", title: "IoT monitoring & control" },
    nodes: [
      diagramNode("sensors", "Field sensors", "integration", 60, 100, {
        description: "pH · temperature · light · flow",
        icon: "zap",
      }),
      diagramNode("edge", "Edge gateway", "service", 360, 100, {
        description: "MQTT ingest · local buffering",
        icon: "server",
      }),
      diagramNode("timeseries", "Timeseries store", "database", 660, 60, {
        description: "Supabase · operational metrics",
        icon: "database",
      }),
      diagramNode("dashboard", "Ops dashboard", "frontend", 660, 200, {
        description: "greendesert.unit311central.com",
        icon: "layout-dashboard",
      }),
    ],
    edges: [
      { id: "e1", source: "sensors", target: "edge", animated: true },
      { id: "e2", source: "edge", target: "timeseries" },
      { id: "e3", source: "timeseries", target: "dashboard" },
    ],
  };
}

function createWaterEfficiencyDiagram(): ArchitectureDiagramDocument {
  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.82 },
    meta: { generator: "greendesert-information-repository", title: "Water efficiency closed loop" },
    nodes: [
      diagramNode("intake", "Make-up water intake", "integration", 80, 120, {
        description: "10× less water than comparable protein sources",
        icon: "globe",
      }),
      diagramNode("recycle", "Recirculation loop", "service", 380, 120, {
        description: "Closed-loop recovery · quality sensors",
        icon: "server",
        badges: [{ label: "KSA", tone: "amber" }],
      }),
      diagramNode("treatment", "Treatment skid", "service", 680, 80, {
        description: "Filtration · UV · nutrient prep",
        icon: "server",
      }),
      diagramNode("tanks", "Cultivation tanks", "frontend", 680, 220, {
        description: "Algae growth vessels",
        icon: "layout-dashboard",
      }),
    ],
    edges: [
      { id: "e1", source: "intake", target: "recycle" },
      { id: "e2", source: "recycle", target: "treatment", animated: true },
      { id: "e3", source: "treatment", target: "tanks" },
      { id: "e4", source: "tanks", target: "recycle", label: "return flow", animated: true },
    ],
  };
}

function createJeddahIntegrationDiagram(): ArchitectureDiagramDocument {
  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.8 },
    meta: { generator: "greendesert-information-repository", title: "Jeddah Technologies integration" },
    nodes: [
      diagramNode("gd-core", "Green Desert workspace", "frontend", 80, 120, {
        description: "HR · Engineering · Operations",
        icon: "layout-dashboard",
        badges: [{ label: "Internal", tone: "emerald" }],
      }),
      diagramNode("api", "Secure API boundary", "service", 400, 120, {
        description: "OAuth · signed webhooks · audit log",
        icon: "server",
      }),
      diagramNode("client", "Jeddah Technologies portal", "frontend", 720, 80, {
        description: "Projects · documents · messages",
        icon: "globe",
        badges: [{ label: "External", tone: "sky" }],
      }),
      diagramNode("board", "Board portal", "frontend", 720, 220, {
        description: "Governance · risk · investor updates",
        icon: "globe",
        badges: [{ label: "Board", tone: "violet" }],
      }),
    ],
    edges: [
      { id: "e1", source: "gd-core", target: "api", animated: true },
      { id: "e2", source: "api", target: "client" },
      { id: "e3", source: "api", target: "board" },
    ],
  };
}

export function resolveGreenDesertIrSeedDiagram(slug: string): ArchitectureDiagramDocument {
  switch (slug) {
    case "gd-algae-cultivation-overview":
      return createAlgaeCultivationDiagram();
    case "gd-iot-monitoring-control":
      return createIotMonitoringDiagram();
    case "gd-water-efficiency-loop":
      return createWaterEfficiencyDiagram();
    case "gd-jeddah-client-integration":
      return createJeddahIntegrationDiagram();
    default:
      return createAlgaeCultivationDiagram();
  }
}

export function createGreenDesertIrDiagramRecord(slug: GreenDesertIrArchitectureSlug): SystemArchitectureDiagram {
  const now = new Date().toISOString();
  return {
    id: `gd-ir-${slug}`,
    sectionSlug: slug,
    title: GREENDESERT_IR_ARCHITECTURE_LABELS[slug],
    diagramJson: resolveGreenDesertIrSeedDiagram(slug),
    createdAt: now,
    updatedAt: now,
  };
}

export function createGreenDesertIrSeedDiagrams(): SystemArchitectureDiagram[] {
  return GREENDESERT_IR_ARCHITECTURE_SLUGS.map((slug) => createGreenDesertIrDiagramRecord(slug));
}
