import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";

function node(
  id: string,
  label: string,
  kind: "frontend" | "service" | "database" | "integration" | "storage" | "group",
  x: number,
  y: number,
  extra: {
    description?: string;
    status?: "live" | "beta" | "planned";
    parentId?: string;
    width?: number;
    height?: number;
  } = {},
) {
  const { parentId, width, height, ...data } = extra;
  const style: Record<string, string | number> = {};
  if (width != null) style.width = width;
  if (height != null) style.minHeight = height;
  return {
    id,
    type: kind === "group" ? ("group" as const) : ("architecture" as const),
    position: { x, y },
    parentId,
    extent: parentId ? ("parent" as const) : undefined,
    width,
    height,
    style: Object.keys(style).length ? style : undefined,
    data: {
      label,
      nodeKind: kind === "group" ? "group" : kind,
      description: data.description,
      status: data.status ?? "live",
    },
  };
}

function wolf(id: string, x: number, y: number) {
  return node(id, "WOLF AI", "service", x, y, {
    description: "Orchestration, welfare interpretation, and evidence generation.",
    status: "live",
  });
}

export function createMission2ModelTestingArchitectureDiagram(): ArchitectureDiagramDocument {
  const gap = 180;
  let x = 0;
  const next = () => {
    const current = x;
    x += gap;
    return current;
  };

  const operationalY = 0;
  const researchY = 260;
  const temporalY = 520;

  const video = node("m2-video", "VIDEO", "storage", next(), operationalY, {
    description: "Mission 2 controlled synthetic benchmark videos.",
  });
  const wolf1 = wolf("m2-wolf-1", next(), operationalY);
  const ffmpeg = node("m2-ffmpeg", "FFmpeg", "integration", next(), operationalY, {
    description: "CPU decode — frame extraction only.",
  });
  const wolf2 = wolf("m2-wolf-2", next(), operationalY);
  const megadetector = node("m2-megadetector", "MegaDetector V6", "integration", next(), operationalY, {
    description: "Accepted animal detector — shared Mission 1 infrastructure.",
  });
  const wolf3 = wolf("m2-wolf-3", next(), operationalY);
  const bytetrack = node("m2-bytetrack", "ByteTrack", "integration", next(), operationalY, {
    description: "Animal tracking foundation for temporal welfare logic.",
  });
  const wolf4 = wolf("m2-wolf-4", next(), operationalY);
  const injurySignal = node("m2-injury", "Visible Injury / Welfare Signal", "service", next(), operationalY, {
    description: "Operator-facing visible injury warning path (research-assisted in V1 testing).",
    status: "beta",
  });
  const stationarySignal = node("m2-stationary", "Cross-Flight Stationary-Animal Logic", "service", next(), operationalY, {
    description: "No-movement-between-flights welfare warning from MegaDetector + ByteTrack + WOLF AI.",
    status: "live",
  });
  const evidence = node("m2-evidence", "Evidence / Intelligence", "service", next(), operationalY, {
    description: "Benchmark evidence, run summaries, and operator review artefacts.",
  });
  const supabase = node("m2-supabase", "Supabase", "database", next(), operationalY, {
    description: "Benchmark videos, runs, and evidence persistence.",
  });
  const central = node("m2-central", "Unit311 Central / Vercel", "frontend", next(), operationalY, {
    description: "Living Mission 2 architecture and model-testing tables.",
  });
  const operator = node("m2-operator", "Operator Review", "frontend", next(), operationalY, {
    description: "Human welfare decision and possible targeted investigation flight.",
  });

  const researchGroup = node("m2-research-group", "MODEL TESTING / RESEARCH BRANCHES", "group", 40, researchY, {
    description: "Parallel research branches — not all part of Mission 2 V1 operations.",
    width: 980,
    height: 180,
  });
  const crop = node("m2-crop", "WOLF AI animal crop", "service", 60, 40, {
    parentId: "m2-research-group",
    description: "MegaDetector-derived animal crops for research model tests.",
  });
  const ornimetrics = node("m2-ornimetrics", "Ornimetrics Edge", "integration", 260, 40, {
    parentId: "m2-research-group",
    description: "Visual welfare/anomaly screening research branch.",
    status: "beta",
  });
  const openclip = node("m2-openclip", "OpenCLIP anomaly", "integration", 500, 40, {
    parentId: "m2-research-group",
    description: "Embedding/anomaly comparison research branch.",
    status: "beta",
  });
  const superanimal = node("m2-superanimal", "DeepLabCut / SuperAnimal-Quadruped", "integration", 60, 110, {
    parentId: "m2-research-group",
    description: "Pose/keypoint research branch.",
    status: "beta",
  });
  const mmpose = node("m2-mmpose", "AP-10K HRNet-W32 / MMPose", "integration", 430, 110, {
    parentId: "m2-research-group",
    description: "Independent pose comparison research branch.",
    status: "beta",
  });

  const day1 = node("m2-day1", "Day 1 observation", "storage", 40, temporalY, {
    description: "First-flight observation stored with animal position/track.",
  });
  const day1Detect = node("m2-day1-md-bt", "MegaDetector + ByteTrack", "integration", 240, temporalY);
  const day1Store = node("m2-day1-store", "WOLF AI stores animal position/track", "service", 460, temporalY);
  const day2 = node("m2-day2", "Day 2 observation", "storage", 700, temporalY);
  const day2Detect = node("m2-day2-md-bt", "MegaDetector + ByteTrack", "integration", 900, temporalY);
  const compare = node("m2-compare", "WOLF AI compares position", "service", 1120, temporalY);
  const warning = node("m2-warning", "Stationary warning", "service", 1320, temporalY, { status: "live" });
  const temporalOperator = node("m2-temporal-operator", "Operator", "frontend", 1520, temporalY);

  const nodes = [
    video,
    wolf1,
    ffmpeg,
    wolf2,
    megadetector,
    wolf3,
    bytetrack,
    wolf4,
    injurySignal,
    stationarySignal,
    evidence,
    supabase,
    central,
    operator,
    researchGroup,
    crop,
    ornimetrics,
    openclip,
    superanimal,
    mmpose,
    day1,
    day1Detect,
    day1Store,
    day2,
    day2Detect,
    compare,
    warning,
    temporalOperator,
  ];

  const edges = [
    ["m2-video", "m2-wolf-1"],
    ["m2-wolf-1", "m2-ffmpeg"],
    ["m2-ffmpeg", "m2-wolf-2"],
    ["m2-wolf-2", "m2-megadetector"],
    ["m2-megadetector", "m2-wolf-3"],
    ["m2-wolf-3", "m2-bytetrack"],
    ["m2-bytetrack", "m2-wolf-4"],
    ["m2-wolf-4", "m2-injury"],
    ["m2-wolf-4", "m2-stationary"],
    ["m2-injury", "m2-evidence"],
    ["m2-stationary", "m2-evidence"],
    ["m2-evidence", "m2-supabase"],
    ["m2-supabase", "m2-central"],
    ["m2-central", "m2-operator"],
    ["m2-megadetector", "m2-crop"],
    ["m2-crop", "m2-ornimetrics"],
    ["m2-crop", "m2-openclip"],
    ["m2-crop", "m2-superanimal"],
    ["m2-crop", "m2-mmpose"],
    ["m2-day1", "m2-day1-md-bt"],
    ["m2-day1-md-bt", "m2-day1-store"],
    ["m2-day2", "m2-day2-md-bt"],
    ["m2-day2-md-bt", "m2-compare"],
    ["m2-day1-store", "m2-compare"],
    ["m2-compare", "m2-warning"],
    ["m2-warning", "m2-temporal-operator"],
  ].map(([source, target], index) => ({
    id: `e-m2-${index}`,
    source,
    target,
    animated: source.includes("wolf") || target.includes("wolf"),
  }));

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.45 },
    meta: {
      generator: "wolf-mission2-model-testing-arch",
      title: "Mission 2 — Animal Injury / Welfare",
      mission: "mission-2-animal-injury-welfare",
      seedVersion: 1,
      generatedAt: new Date().toISOString(),
      liveRefresh: true,
    },
    nodes,
    edges,
  };
}
