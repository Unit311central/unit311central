import type { ValueStatus, WorkbenchConfig } from "@/lib/realtime-video-pipeline/workbench-types";
import {
  BCN_REFERENCE_CAMERA_LABEL,
  BCN_REFERENCE_LIVE_STREAM_LABEL,
  BCN_VALIDATION_STATUS,
  ORYX_AIRCRAFT_NAME,
  ORYX_VIDEO_PROVENANCE_SOURCE,
  ORYX_VIDEO_PROVENANCE_URL,
} from "@/lib/realtime-video-pipeline/workbench-reference-data";

export type AssumptionEntry = {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  source: string;
  sourceUrl: string;
  sourceDate: string;
  status: ValueStatus;
  displayStatus: string;
  confidence: string;
  notes: string;
};

function assumptionDisplayStatus(status: ValueStatus): string {
  if (status === "Reference Assumption" || status === "TBD") return BCN_VALIDATION_STATUS;
  return status;
}

export function buildAssumptionsRegister(config: WorkbenchConfig): AssumptionEntry[] {
  const vp = config.videoProfile;
  const entries: AssumptionEntry[] = [
    {
      id: "aircraft-oryx",
      parameter: "Aircraft (BCN reference)",
      value: ORYX_AIRCRAFT_NAME,
      unit: "",
      source: ORYX_VIDEO_PROVENANCE_SOURCE,
      sourceUrl: ORYX_VIDEO_PROVENANCE_URL,
      sourceDate: "2026-08",
      status: "Reference Assumption",
      displayStatus: BCN_VALIDATION_STATUS,
      confidence: "Low",
      notes: "BCN manufactures Oryx — specifications to be confirmed with BCN",
    },
    {
      id: "camera-recording",
      parameter: "Oryx camera / recording profile",
      value: `${vp.recordingResolution} · ${vp.recordingFps} FPS · ${vp.recordingCodec} · ${vp.maxRecordingBitrateMbps} Mbps max`,
      unit: "",
      source: ORYX_VIDEO_PROVENANCE_SOURCE,
      sourceUrl: ORYX_VIDEO_PROVENANCE_URL,
      sourceDate: "2026-08",
      status: vp.maxRecordingBitrateStatus,
      displayStatus: assumptionDisplayStatus(vp.maxRecordingBitrateStatus),
      confidence: "Low",
      notes: `${BCN_REFERENCE_CAMERA_LABEL} — not presented as Oryx specifications`,
    },
    {
      id: "live-bitrate",
      parameter: "Oryx live stream bitrate",
      value: String(vp.liveStreamBitrateMbps),
      unit: "Mbps",
      source: ORYX_VIDEO_PROVENANCE_SOURCE,
      sourceUrl: ORYX_VIDEO_PROVENANCE_URL,
      sourceDate: "2026-08",
      status: vp.liveStreamBitrateStatus,
      displayStatus: assumptionDisplayStatus(vp.liveStreamBitrateStatus),
      confidence: "Medium",
      notes: `${BCN_REFERENCE_LIVE_STREAM_LABEL} · independent from max recording bitrate`,
    },
    {
      id: "live-stream-profile",
      parameter: "Oryx live stream profile",
      value: `${vp.liveStreamResolution} · ${vp.liveStreamFps} FPS · ${vp.liveStreamCodec}`,
      unit: "",
      source: ORYX_VIDEO_PROVENANCE_SOURCE,
      sourceUrl: ORYX_VIDEO_PROVENANCE_URL,
      sourceDate: "2026-08",
      status: vp.liveStreamBitrateStatus,
      displayStatus: assumptionDisplayStatus(vp.liveStreamBitrateStatus),
      confidence: "Medium",
      notes: BCN_REFERENCE_LIVE_STREAM_LABEL,
    },
    {
      id: "operational-flight-time",
      parameter: "Oryx practical flight duration",
      value: String(vp.operationalFlightTimeMin),
      unit: "min",
      source: ORYX_VIDEO_PROVENANCE_SOURCE,
      sourceUrl: ORYX_VIDEO_PROVENANCE_URL,
      sourceDate: "2026-08",
      status: "Reference Assumption",
      displayStatus: BCN_VALIDATION_STATUS,
      confidence: "Low",
      notes: `Nominal ${vp.nominalFlightTimeMin} min reference — to be validated with BCN`,
    },
    {
      id: "park-upload",
      parameter: "Park upload bandwidth",
      value: String(config.connectivity.uploadMbps),
      unit: "Mbps",
      source: config.connectivity.source,
      sourceUrl: config.connectivity.sourceUrl,
      sourceDate: "2026-08",
      status: config.connectivity.status,
      displayStatus: assumptionDisplayStatus(config.connectivity.status),
      confidence: "Low",
      notes: "Critical BCN field validation — upload is primary WOLF constraint",
    },
    {
      id: "park-download",
      parameter: "Park download bandwidth",
      value: String(config.connectivity.downloadMbps),
      unit: "Mbps",
      source: config.connectivity.source,
      sourceUrl: config.connectivity.sourceUrl,
      sourceDate: "2026-08",
      status: config.connectivity.status,
      displayStatus: assumptionDisplayStatus(config.connectivity.status),
      confidence: "Medium",
      notes: "Shared park connection — not all bandwidth available to WOLF",
    },
    {
      id: "gpu-hourly",
      parameter: "GPU hourly cost",
      value: config.gpuConfig.hourlyPriceUsd != null ? String(config.gpuConfig.hourlyPriceUsd) : "",
      unit: "USD/hr",
      source: config.gpuConfig.source,
      sourceUrl: "",
      sourceDate: config.gpuConfig.sourceDate,
      status: config.gpuConfig.hourlyPriceStatus,
      displayStatus: assumptionDisplayStatus(config.gpuConfig.hourlyPriceStatus),
      confidence: "Medium",
      notes: `${config.gpuConfig.model} · ${config.gpuConfig.provider}`,
    },
    {
      id: "guest-contention",
      parameter: "Concurrent guest bandwidth share",
      value: String(config.parkContention.concurrentGuestPct),
      unit: "% of capacity",
      source: "Engineering reference — guests on safari during day",
      sourceUrl: "",
      sourceDate: "2026-08",
      status: "Reference Assumption",
      displayStatus: BCN_VALIDATION_STATUS,
      confidence: "Low",
      notes: `${config.parkContention.guestCapacity} guest capacity`,
    },
  ];

  for (const profile of config.missionProfiles) {
    entries.push({
      id: `mission-${profile.slug}`,
      parameter: `${profile.name} — GPU intensity`,
      value: String(profile.gpuIntensity),
      unit: "0–1 scale",
      source: profile.description,
      sourceUrl: "",
      sourceDate: "2026-08",
      status: profile.status,
      displayStatus: assumptionDisplayStatus(profile.status),
      confidence: profile.processingIntensity === "very_high" ? "Low" : "Medium",
      notes: `Live ${profile.liveBitrateMbps} Mbps · ${profile.inferenceFrequencyHz} Hz inference`,
    });
  }

  for (const line of config.costLineItems) {
    entries.push({
      id: `cost-${line.id}`,
      parameter: line.label,
      value: line.unitCostUsd != null ? String(line.unitCostUsd) : "TBD",
      unit: `USD/${line.unit}`,
      source: line.source,
      sourceUrl: "",
      sourceDate: "2026-08",
      status: line.status,
      displayStatus: assumptionDisplayStatus(line.status),
      confidence: "Medium",
      notes: line.category === "safari" ? "Paid by Safari — excluded from WOLF cost" : "WOLF/BCN cost",
    });
  }

  return entries;
}
