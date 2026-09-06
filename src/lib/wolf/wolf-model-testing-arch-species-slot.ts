import { WOLF_MODEL_TESTING_ARCH_MODELS } from "@/lib/wolf/wolf-model-testing-arch-data";

export const WOLF_MISSION1_SPECIES_SLOT_MODEL_ID = "bioclip2";

export type Mission1SpeciesModelSlot = {
  label: string;
  description: string;
  status: "live" | "planned";
  modelId: string | null;
};

/** Current GT leader in the replaceable species-model stage (Mission 1 seed v2). */
export function resolveMission1SpeciesModelSlot(): Mission1SpeciesModelSlot {
  const leader =
    WOLF_MODEL_TESTING_ARCH_MODELS.find((record) => record.id === WOLF_MISSION1_SPECIES_SLOT_MODEL_ID) ??
    WOLF_MODEL_TESTING_ARCH_MODELS.find(
      (record) =>
        record.modelFunction.toLowerCase().includes("species classification") &&
        record.outcome === "TESTED",
    );

  if (!leader) {
    return {
      modelId: null,
      label: "[REPLACEMENT SPECIES MODEL]",
      description:
        "Replaceable species-classification stage. Mission 1 GT benchmark leader pending refresh.",
      status: "planned",
    };
  }

  return {
    modelId: leader.id,
    label: `${leader.modelName} (replaceable)`,
    description:
      "Current Mission 1 GT benchmark leader — 41.0% mean top-1 (BioCLIP-2). Replaceable species-model slot — candidates remain under evaluation.",
    status: "live",
  };
}
