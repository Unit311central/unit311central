import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";
import { WOLF_MODEL_TESTING_ARCH_MODELS } from "@/lib/wolf/wolf-model-testing-arch-data";

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

export function createMission1ModelTestingArchitectureDiagram(): ArchitectureDiagramDocument {
  const acceptedSpecies = WOLF_MODEL_TESTING_ARCH_MODELS.find(
    (record) => record.modelFunction.toLowerCase().includes("species") && record.outcome === "ACCEPTED",
  );
  const speciesLabel = acceptedSpecies
    ? acceptedSpecies.modelName
    : "[REPLACEMENT SPECIES MODEL]";
  const speciesDescription = acceptedSpecies
    ? `Accepted species-classification candidate: ${acceptedSpecies.modelName}.`
    : "Replaceable species-classification stage. No accepted species model yet — candidates under Mission 1 evaluation.";

  const rowY = 0;
  const gap = 200;
  let x = 0;
  const nextX = () => {
    const current = x;
    x += gap;
    return current;
  };

  const video = node("video", "VIDEO", "storage", nextX(), rowY, {
    description: "Benchmark or mission video input.",
    status: "live",
  });
  const wolf1 = wolfOrchestrator("wolf-1", nextX(), rowY);
  const ffmpeg = node("ffmpeg", "FFmpeg", "integration", nextX(), rowY, {
    description: "CPU decode — frame extraction only (not an AI model).",
    status: "live",
  });
  const wolf2 = wolfOrchestrator("wolf-2", nextX(), rowY);
  const megadetector = node("megadetector", "MegaDetector", "integration", nextX(), rowY, {
    description: "Animal detection — where are the animals?",
    status: "live",
  });
  const wolf3 = wolfOrchestrator("wolf-3", nextX(), rowY);
  const speciesModel = node("species-model", speciesLabel, "integration", nextX(), rowY, {
    description: speciesDescription,
    status: acceptedSpecies ? "live" : "planned",
    meta: { speciesModelSlot: true },
  });
  const wolf4 = wolfOrchestrator("wolf-4", nextX(), rowY);
  const bytetrack = node("bytetrack", "ByteTrack", "integration", nextX(), rowY, {
    description: "Object tracking / identity association — not species classification.",
    status: "planned",
  });
  const wolf5 = wolfOrchestrator("wolf-5", nextX(), rowY);
  const counting = node("counting", "ANIMAL COUNTING INTELLIGENCE", "service", nextX(), rowY, {
    description: "WOLF-specific counting logic downstream of tracking.",
    status: "live",
  });
  const supabase = node("supabase", "Supabase", "database", nextX(), rowY, {
    description: "Persistence for benchmark metadata, runs, and results — not AI processing.",
    status: "live",
  });
  const vercel = node("vercel", "Unit311 Central / Vercel", "frontend", nextX(), rowY, {
    description: "WOLF workspace delivery and Information Repository UI.",
    status: "live",
  });
  const workspace = node("workspace", "WOLF Workspace", "frontend", nextX(), rowY, {
    description: "Operator-facing WOLF Central workspace.",
    status: "live",
  });

  const nodes = [
    video,
    wolf1,
    ffmpeg,
    wolf2,
    megadetector,
    wolf3,
    speciesModel,
    wolf4,
    bytetrack,
    wolf5,
    counting,
    supabase,
    vercel,
    workspace,
  ];

  const chain = [
    ["video", "wolf-1"],
    ["wolf-1", "ffmpeg"],
    ["ffmpeg", "wolf-2"],
    ["wolf-2", "megadetector"],
    ["megadetector", "wolf-3"],
    ["wolf-3", "species-model"],
    ["species-model", "wolf-4"],
    ["wolf-4", "bytetrack"],
    ["bytetrack", "wolf-5"],
    ["wolf-5", "counting"],
    ["counting", "supabase"],
    ["supabase", "vercel"],
    ["vercel", "workspace"],
  ];

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.55 },
    meta: {
      generator: "wolf-model-testing-arch",
      title: "Mission 1 — Animal Detection & Counting",
      mission: "mission-1-animal-detection-counting",
      seedVersion: 1,
      generatedAt: new Date().toISOString(),
      liveRefresh: true,
      speciesModelSlotNodeId: "species-model",
    },
    nodes,
    edges: chain.map(([source, target], index) => ({
      id: `e-m1-${index}`,
      source,
      target,
      animated: source.startsWith("wolf") || target.startsWith("wolf"),
    })),
  };
}
