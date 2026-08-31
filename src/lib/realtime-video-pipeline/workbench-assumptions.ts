import type { WorkbenchConfig } from "@/lib/realtime-video-pipeline/workbench-types";
import type { ValueStatus } from "@/lib/realtime-video-pipeline/workbench-types";

export type AssumptionEntry = {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  source: string;
  sourceUrl: string;
  sourceDate: string;
  status: ValueStatus;
  confidence: string;
  notes: string;
};

export function buildAssumptionsRegister(config: WorkbenchConfig): AssumptionEntry[] {
  const entries: AssumptionEntry[] = [
    {
      id: "live-bitrate",
      parameter: "Live stream bitrate",
      value: String(config.videoProfile.liveStreamBitrateMbps),
      unit: "Mbps",
      source: config.videoProfile.source,
      sourceUrl: config.videoProfile.sourceUrl,
      sourceDate: "2026-08",
      status: config.videoProfile.liveStreamBitrateStatus,
      confidence: "Medium",
      notes: "Independent from max camera recording bitrate",
    },
    {
      id: "max-recording-bitrate",
      parameter: "Max camera recording bitrate",
      value: String(config.videoProfile.maxRecordingBitrateMbps),
      unit: "Mbps",
      source: config.videoProfile.source,
      sourceUrl: config.videoProfile.sourceUrl,
      sourceDate: "2026-08",
      status: config.videoProfile.maxRecordingBitrateStatus,
      confidence: "High",
      notes: "Manufacturer specification reference class",
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
      confidence: line.category === "safari" ? "Medium" : "Medium",
      notes: line.category === "safari" ? "Paid by Safari — excluded from WOLF cost" : "WOLF/BCN cost",
    });
  }

  return entries;
}
