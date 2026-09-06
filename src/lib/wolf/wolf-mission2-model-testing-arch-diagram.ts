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
    description: "Cross-flight MegaDetector centroid comparison for stationary-animal warnings.",
    status: "live",
  });
  const wolf5 = wolfOrchestrator("wolf-5", nextX(), rowY);
  const researchBranch = node(
    "research-branch",
    "Visible injury research branches",
    "integration",
    nextX(),
    rowY,
    {
      description:
        "Ornimetrics Edge, OpenCLIP anomaly, SuperAnimal-Quadruped, AP-10K/MMPose — research-only until validated on synthetic tests.",
      status: researchModels.some((record) => record.outcome === "TESTED") ? "beta" : "planned",
      meta: { researchBranch: true, modelCount: researchModels.length },
    },
  );
  const supabase = node("supabase", "Supabase", "database", nextX(), rowY, {
    description: "Private wolf-benchmark bucket and benchmark metadata persistence.",
    status: "live",
  });
  const vercel = node("vercel", "Unit311 Central / Vercel", "frontend", nextX(), rowY, {
    description: "WOLF Information Repository — Mission 2 MODEL TESTING ARCH UI.",
    status: "live",
  });

  const nodes = [video, wolf1, ffmpeg, wolf2, megadetector, wolf3, bytetrack, wolf4, temporal, wolf5, researchBranch, supabase, vercel];
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
    ["research-branch", "supabase"],
    ["supabase", "vercel"],
  ];

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.55 },
    meta: {
      generator: "wolf-mission2-model-testing-arch",
      title: "Mission 2 — Animal Injury / Welfare V1",
      mission: "mission-2-animal-injury-welfare-v1",
      seedVersion: 1,
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
