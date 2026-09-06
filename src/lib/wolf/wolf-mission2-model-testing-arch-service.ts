import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";
import {
  WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS,
  WOLF_MISSION2_MODEL_TESTING_ARCH_SEED_VERSION,
  WOLF_MISSION2_MODEL_TESTING_ARCH_VIDEOS,
} from "@/lib/wolf/wolf-mission2-model-testing-arch-data";
import { createMission2ModelTestingArchitectureDiagram } from "@/lib/wolf/wolf-mission2-model-testing-arch-diagram";
import type { WolfMission2ModelTestingArchPayload } from "@/lib/wolf/wolf-mission2-model-testing-arch-types";

export function buildWolfMission2ModelTestingArchPayload(): WolfMission2ModelTestingArchPayload {
  const operational = WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS.filter((record) =>
    ["megadetector-v6", "bytetrack", "wolf-temporal-logic"].includes(record.id),
  );
  const acceptedOperational = operational.filter((record) => record.outcome === "ACCEPTED");

  return {
    seedVersion: WOLF_MISSION2_MODEL_TESTING_ARCH_SEED_VERSION,
    generatedAt:
      WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS[0]?.testedAt ?? new Date().toISOString(),
    mission: "Mission 2 — Animal Injury / Welfare V1",
    operationalStackLabel:
      acceptedOperational.length >= 2
        ? "MegaDetector V6 → ByteTrack → WOLF AI temporal logic"
        : "Mission 2 operational stack pending full benchmark acceptance",
    operationalStackDescription:
      "Mission 2 V1 focuses on visible injury screening (research branches) and cross-flight stationary-animal warnings. Species identification is not required.",
    diagram: createMission2ModelTestingArchitectureDiagram(),
    models: WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS,
    videos: WOLF_MISSION2_MODEL_TESTING_ARCH_VIDEOS,
  };
}

export function findMission2ModelTestingRecord(modelId: string) {
  return WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS.find((record) => record.id === modelId) ?? null;
}

export function findMission2BenchmarkVideoRecord(slug: string) {
  return WOLF_MISSION2_MODEL_TESTING_ARCH_VIDEOS.find((record) => record.slug === slug) ?? null;
}
