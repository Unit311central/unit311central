import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";
import { WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS } from "@/lib/wolf/wolf-mission2-model-testing-arch-data";

function node(
  id: string,
  label: string,
  kind: "frontend" | "service" | "database" | "integration" | "storage",
  x: number,
  y: number,
  extra: {
    description?: string;
    status?: "live" | "beta" | "planned";
    meta?: Record<string, unknown>;
  } = {},
) {
  return {
    id,
    type: "architecture" as const,
    position: { x, y },
    data: {
      label,
      nodeKind: kind,
      description: extra.description,
      status: extra.status ?? "live",
      meta: extra.meta,
    },
  };
}

function wolfOrchestrator(id: string, x: number, y: number) {
  return node(id, "WOLF AI", "service", x, y, {
    description: "Orchestration, hand-offs, interpretation, and intelligence generation between stages.",
    status: "live",
  });
}

export function createMission2ModelTestingArchitectureDiagram(): ArchitectureDiagramDocument {
  const researchModels = WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS.filter((record) =>
    record.modelFunction.toLowerCase().includes("research"),
  );

  const rowY = 0;
  const gap = 180;
  let x = 0;
  const nextX = () => {
    const current = x;
    x += gap;
    return current;
  };

  const video = node("video", "VIDEO", "storage", nextX(), rowY, {
    description: "Mission 2 controlled synthetic benchmark videos (wolf-benchmark/mission-2/elephant).",
    status: "live",
  });
  const wolf1 = wolfOrchestrator("wolf-1", nextX(), rowY);
  const ffmpeg = node("ffmpeg", "FFmpeg", "integration", nextX(), rowY, {
    description: "CPU decode — frame extraction only (not an AI model).",
    status: "live",
  });
  const wolf2 = wolfOrchestrator("wolf-2", nextX(), rowY);
  const megadetector = node("megadetector", "MegaDetector V6", "integration", nextX(), rowY, {
    description: "Animal detection — shared Mission 1 infrastructure for Mission 2 welfare pipeline.",
    status: "live",
  });
  const wolf3 = wolfOrchestrator("wolf-3", nextX(), rowY);
  const bytetrack = node("bytetrack", "ByteTrack", "integration", nextX(), rowY, {
    description: "Track animal identity and centroid trajectories for temporal welfare logic.",
    status: "live",
  });
  const wolf4 = wolfOrchestrator("wolf-4", nextX(), rowY);
  const temporal = node("temporal-logic", "WOLF temporal logic", "service", nextX(), rowY, {
    description:
      "STATIONARY_ACROSS_OBSERVATIONS — cross-flight MegaDetector centroid comparison. ACCEPTED V1 temporal welfare pillar.",
    status: "live",
  });
  const wolf5 = wolfOrchestrator("wolf-5", nextX(), rowY);
  const researchBranch = node(
    "research-branch",
    "Visible injury / abnormality research branches",
    "integration",
    nextX(),
    rowY,
    {
      description:
        "Round 1: OWLv2, Grounding DINO, YOLO-World, DINOv2, OpenCLIP, Ornimetrics, pose research. " +
        "Round 2: WOLF red-tissue heuristic, SAM2+chromatic saliency, BioCLIP-2 injury prompts. " +
        "Research-only — not operational V1. Temporal welfare remains separate ACCEPTED pillar.",
      status: researchModels.some((record) => record.outcome === "TESTED") ? "beta" : "planned",
      meta: { researchBranch: true, modelCount: researchModels.length },
    },
  );
  const visibleAbnormality = node(
    "visible-abnormality-signal",
    "Visible abnormality signal (research)",
    "service",
    nextX(),
    rowY,
    {
      description:
        "VISIBLE_ABNORMALITY_DETECTED — WOLF red-tissue heuristic + SAM2/chromatic research candidates. " +
        "Not autonomous diagnosis. Operator review required.",
      status: "beta",
    },
  );
  const wolf6 = wolfOrchestrator("wolf-6", nextX(), rowY);
  const welfare = node("welfare-intelligence", "WOLF welfare intelligence", "service", nextX(), rowY, {
    description: "Fuses temporal + visible abnormality evidence for operator review / investigation alerts.",
    status: "live",
  });
  const supabase = node("supabase", "Supabase", "database", nextX(), rowY, {
    description: "Private wolf-benchmark bucket and benchmark metadata persistence.",
    status: "live",
  });
  const vercel = node("vercel", "Unit311 Central / Vercel", "frontend", nextX(), rowY, {
    description: "WOLF Information Repository — Mission 2 MODEL TESTING ARCH UI.",
    status: "live",
  });

  const nodes = [
    video,
    wolf1,
    ffmpeg,
    wolf2,
    megadetector,
    wolf3,
    bytetrack,
    wolf4,
    temporal,
    wolf5,
    researchBranch,
    visibleAbnormality,
    wolf6,
    welfare,
    supabase,
    vercel,
  ];
  const chain = [
    ["video", "wolf-1"],
    ["wolf-1", "ffmpeg"],
    ["ffmpeg", "wolf-2"],
    ["wolf-2", "megadetector"],
    ["megadetector", "wolf-3"],
    ["wolf-3", "bytetrack"],
    ["bytetrack", "wolf-4"],
    ["wolf-4", "temporal-logic"],
    ["temporal-logic", "wolf-5"],
    ["wolf-5", "research-branch"],
    ["research-branch", "visible-abnormality-signal"],
    ["visible-abnormality-signal", "wolf-6"],
    ["wolf-6", "welfare-intelligence"],
    ["welfare-intelligence", "supabase"],
    ["supabase", "vercel"],
  ];

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.55 },
    meta: {
      generator: "wolf-mission2-model-testing-arch",
      title: "Mission 2 — Animal Injury / Welfare V1",
      mission: "mission-2-animal-injury-welfare-v1",
      seedVersion: 3,
      generatedAt: new Date().toISOString(),
      liveRefresh: true,
    },
    nodes,
    edges: chain.map(([source, target], index) => ({
      id: `e-m2-${index}`,
      source,
      target,
      animated: source.startsWith("wolf") || target.startsWith("wolf"),
    })),
  };
}
