import {
  WOLF_MODEL_TESTING_ARCH_MODELS,
  WOLF_MODEL_TESTING_ARCH_SEED_VERSION,
  WOLF_MODEL_TESTING_ARCH_VIDEOS,
} from "@/lib/wolf/wolf-model-testing-arch-data";
import { resolveMission1SpeciesModelSlot } from "@/lib/wolf/wolf-model-testing-arch-species-slot";
import { createMission1ModelTestingArchitectureDiagram } from "@/lib/wolf/wolf-model-testing-arch-diagram";
import type { WolfModelTestingArchPayload } from "@/lib/wolf/wolf-model-testing-arch-types";

export function buildWolfModelTestingArchPayload(): WolfModelTestingArchPayload {
  const speciesSlot = resolveMission1SpeciesModelSlot();

  return {
    seedVersion: WOLF_MODEL_TESTING_ARCH_SEED_VERSION,
    generatedAt: new Date().toISOString(),
    mission: "Mission 1 — Animal Detection & Counting",
    speciesModelSlotLabel: speciesSlot.label,
    speciesModelSlotDescription: speciesSlot.description,
    diagram: createMission1ModelTestingArchitectureDiagram(),
    models: WOLF_MODEL_TESTING_ARCH_MODELS,
    videos: WOLF_MODEL_TESTING_ARCH_VIDEOS,
  };
}

export function findModelTestingRecord(modelId: string) {
  return WOLF_MODEL_TESTING_ARCH_MODELS.find((record) => record.id === modelId) ?? null;
}

export function findBenchmarkVideoRecord(slug: string) {
  return WOLF_MODEL_TESTING_ARCH_VIDEOS.find((record) => record.slug === slug) ?? null;
}
