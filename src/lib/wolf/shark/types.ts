export type SharkJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type SharkModelSummary = {
  model: string;
  status: string;
  unique_tracks: number;
  detections: number;
  avg_confidence: number;
  error?: string | null;
};

export type SharkTestResultPayload = {
  run_id: string;
  video_name: string;
  expected_visible_sharks: number;
  frames_analysed: number;
  processing_seconds: number;
  wolf_unique_tracks: number;
  model_summaries: SharkModelSummary[];
  wolf_tracks: Array<{
    track_id: string;
    wolf_track_id: string;
    first_seen_seconds: number;
    last_seen_seconds: number;
    frame_count: number;
    models: string[];
    avg_confidence: number;
  }>;
};

export type SharkJobRecord = {
  id: string;
  video: string;
  status: SharkJobStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  error: string | null;
  result: SharkTestResultPayload | null;
};
