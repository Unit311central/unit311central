export const WILDLIFE_SPECIES = [
  "zebra",
  "eland",
  "giraffe",
  "wildebeest",
  "impala",
  "buffalo",
  "rhino",
] as const;

export type WildlifeSpecies = (typeof WILDLIFE_SPECIES)[number];

export type WildlifeSpeciesLabel =
  | "ZEBRA"
  | "ELAND"
  | "GIRAFFE"
  | "WILDEBEEST"
  | "IMPALA"
  | "BUFFALO"
  | "RHINO";

export const WILDLIFE_SPECIES_LABELS: Record<WildlifeSpecies, WildlifeSpeciesLabel> = {
  zebra: "ZEBRA",
  eland: "ELAND",
  giraffe: "GIRAFFE",
  wildebeest: "WILDEBEEST",
  impala: "IMPALA",
  buffalo: "BUFFALO",
  rhino: "RHINO",
};

/** Normalised bounding box (0–1) relative to the video viewport. */
export type NormalisedBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WildlifeDetection = {
  trackId: string;
  species: WildlifeSpecies;
  label: WildlifeSpeciesLabel;
  box: NormalisedBoundingBox;
  confidence: number;
};

export type WildlifeUniqueCounts = {
  bySpecies: Record<WildlifeSpecies, number>;
  totalUnique: number;
};

/**
 * Boundary between the video player and detection sources.
 * Replace the simulated implementation with a live CV adapter later
 * without changing the WOLF UI shell.
 */
export interface WildlifeVisionDetectionProvider {
  readonly mode: "simulated" | "live";
  readonly durationSec: number;
  getDetectionsAt(timeSec: number): WildlifeDetection[];
  getUniqueCountsAt(timeSec: number): WildlifeUniqueCounts;
}
