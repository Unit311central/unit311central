import {
  WOLF_MODEL_TESTING_ARCH_MODELS,
  WOLF_MODEL_TESTING_ARCH_SEED_VERSION,
  WOLF_MODEL_TESTING_ARCH_VIDEOS,
} from "@/lib/wolf/wolf-model-testing-arch-data";
import { createMission1ModelTestingArchitectureDiagram } from "@/lib/wolf/wolf-model-testing-arch-diagram";
import type { WolfModelTestingArchPayload } from "@/lib/wolf/wolf-model-testing-arch-types";

export function buildWolfModelTestingArchPayload(): WolfModelTestingArchPayload {
  const acceptedSpecies = WOLF_MODEL_TESTING_ARCH_MODELS.find(
    (record) =>
      record.modelFunction.toLowerCase().includes("species classification") &&
      record.outcome === "ACCEPTED",
  );

  return {
    seedVersion: WOLF_MODEL_TESTING_ARCH_SEED_VERSION,
    generatedAt: new Date().toISOString(),
    mission: "Mission 1 — Animal Detection & Counting",
    speciesModelSlotLabel: acceptedSpecies?.modelName ?? "[REPLACEMENT SPECIES MODEL]",
    speciesModelSlotDescription: acceptedSpecies
      ? `Current accepted species model: ${acceptedSpecies.modelName}.`
      : "No accepted species-classification model yet. Slot remains replaceable as testing progresses.",
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
