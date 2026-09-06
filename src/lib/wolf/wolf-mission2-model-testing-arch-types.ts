import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";

export const WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID = "mission-2-model-testing-arch";

export type ModelTestingOutcome =
  | "TESTED"
  | "ACCEPTED"
  | "REJECTED"
  | "FAILED_TO_EXECUTE"
  | "PENDING"
  | "LICENCE_REVIEW"
  | "NOT_YET_TESTED";

export type ModelTestingEvidenceImage = {
  kind:
    | "source_frame"
    | "detector_output"
    | "species_classification"
    | "tracking_counting"
    | "comparison";
  label: string;
  url: string | null;
  repositoryPath?: string | null;
};

export type ModelVideoTestLink = {
  videoSlug: string;
  outcome: ModelTestingOutcome;
  testStatus: ModelTestingOutcome;
  confidenceSummary: string;
  detectionCount: string;
  uniqueAnimalCount: string;
  benchmarkRunReference: string | null;
  testedAt: string | null;
  comments: string;
  evidence: ModelTestingEvidenceImage[];
};

export type WolfModelTestingRecord = {
  id: string;
  modelName: string;
  modelFunction: string;
  version: string;
  source: string;
  checkpoint: string;
  modelLicence: string;
  checkpointLicence: string;
  commercialUseStatus: string;
  testStatus: ModelTestingOutcome;
  outcome: ModelTestingOutcome;
  confidenceSummary: string;
  videosTested: string[];
  evidence: ModelTestingEvidenceImage[];
  comments: string;
  testedAt: string | null;
  benchmarkRunReference: string | null;
  videoTests: ModelVideoTestLink[];
};

export type WolfBenchmarkVideoRecord = {
  slug: string;
  sourceDataset: string;
  sourceIdentifier: string;
  sourceUrl: string;
  videoLicence: string;
  resolution: string;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  codec: string;
  sizeBytes: number;
  droneCamera: string;
  altitude: string;
  knownSpecies: string;
  frameCount: string;
  benchmarkRole: string;
  benchmarkStatus: string;
  modelsTested: string[];
  detectionCount: string;
  uniqueAnimalCount: string;
  evidenceImages: ModelTestingEvidenceImage[];
  benchmarkRunReferences: string[];
  comments: string;
  storageObjectPath: string;
  checksumSha256: string;
};

export type WolfMission2ModelTestingArchPayload = {
  seedVersion: number;
  generatedAt: string;
  mission: string;
  operationalStackLabel: string;
  operationalStackDescription: string;
  diagram: ArchitectureDiagramDocument;
  models: WolfModelTestingRecord[];
  videos: WolfBenchmarkVideoRecord[];
};
