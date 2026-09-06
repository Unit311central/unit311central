import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";

export const WOLF_MISSION2_MODEL_TESTING_ARCH_CATEGORY_ID = "mission-2-model-testing-arch";

export type Mission2TestingOutcome =
  | "TESTED"
  | "ACCEPTED"
  | "REJECTED"
  | "PENDING"
  | "FAILED"
  | "LICENCE_REVIEW"
  | "RESEARCH ONLY"
  | "NOT_YET_TESTED";

export type Mission2EvidenceImage = {
  kind:
    | "source_frame"
    | "detector_output"
    | "tracking_output"
    | "pose_output"
    | "anomaly_screening"
    | "temporal_comparison"
    | "comparison";
  label: string;
  url: string | null;
  repositoryPath?: string | null;
};

export type Mission2VideoTestLink = {
  videoSlug: string;
  outcome: Mission2TestingOutcome;
  testStatus: Mission2TestingOutcome;
  resultSummary: string;
  benchmarkRunReference: string | null;
  testedAt: string | null;
  comments: string;
  evidence: Mission2EvidenceImage[];
};

export type WolfMission2ModelTestingRecord = {
  id: string;
  modelName: string;
  category: string;
  purpose: string;
  version: string;
  checkpoint: string;
  modelLicence: string;
  commercialLicenceStatus: string;
  testStatus: Mission2TestingOutcome;
  outcome: Mission2TestingOutcome;
  result: string;
  runtime: string;
  v1Relevance: string;
  videosTested: string[];
  evidence: Mission2EvidenceImage[];
  comments: string;
  testedAt: string | null;
  benchmarkRunReference: string | null;
  videoTests: Mission2VideoTestLink[];
};

export type WolfMission2BenchmarkVideoRecord = {
  slug: string;
  filename: string;
  day: string;
  condition: string;
  redMarker: boolean;
  posture: string;
  duplicateRelationship: string;
  resolution: string;
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  frameCount: string;
  codec: string;
  sizeBytes: number;
  checksumSha256: string;
  testPurpose: string;
  modelsTested: string[];
  evidence: Mission2EvidenceImage[];
  benchmarkRunReferences: string[];
  notes: string;
  storageObjectPath: string;
};

export type WolfMission2ModelTestingArchPayload = {
  seedVersion: number;
  generatedAt: string;
  mission: string;
  syntheticDataWarning: string;
  diagram: ArchitectureDiagramDocument;
  models: WolfMission2ModelTestingRecord[];
  videos: WolfMission2BenchmarkVideoRecord[];
  v1Recommendation: string;
};
