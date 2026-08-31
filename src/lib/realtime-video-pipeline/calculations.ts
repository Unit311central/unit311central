import type {
  PipelineMilestone,
  PipelineSection,
  PipelineStage,
  PipelineSummary,
  StageTotals,
} from "@/lib/realtime-video-pipeline/types";

function num(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return value;
}

function sumKnown(values: Array<number | null>): number | null {
  if (values.some((v) => v == null)) return null;
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

function sumMinimum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

function addNullableTotal(current: number | null, part: number | null): number | null {
  if (part == null) return null;
  if (current == null) return null;
  return current + part;
}

export function stageLatencyParts(stage: PipelineStage) {
  return {
    processingMs: num(stage.processingMs),
    transmissionMs: num(stage.transmissionMs),
    bufferMs: num(stage.bufferMs),
    queueMs: num(stage.queueMs),
    aiInferenceMs: num(stage.aiInferenceMs),
  };
}

export function computeStageTotals(stage: PipelineStage): StageTotals {
  const parts = stageLatencyParts(stage);
  const values = [
    parts.processingMs,
    parts.transmissionMs,
    parts.bufferMs,
    parts.queueMs,
    parts.aiInferenceMs,
  ];
  const totalMs = sumKnown(values);
  const minParts = [
    num(stage.processingMinMs) ?? parts.processingMs,
    parts.transmissionMs,
    parts.bufferMs,
    parts.queueMs,
    parts.aiInferenceMs,
  ].filter((v): v is number => v != null);
  const knownMinimumMs = totalMs != null ? totalMs : sumMinimum(minParts);

  return {
    ...parts,
    totalMs,
    knownMinimumMs,
    isComplete: totalMs != null,
  };
}

function cumulativeToMilestone(
  stages: PipelineStage[],
  milestone: PipelineMilestone,
): { complete: number | null; minimum: number } {
  const ordered = [...stages]
    .filter((s) => s.enabled)
    .sort((a, b) => a.stageOrder - b.stageOrder);
  let complete: number | null = 0;
  let minimum = 0;
  let found = false;

  for (const stage of ordered) {
    const totals = computeStageTotals(stage);
    if (totals.totalMs != null) {
      complete = (complete ?? 0) + totals.totalMs;
    } else {
      complete = null;
      minimum += totals.knownMinimumMs;
    }
    if (stage.milestone === milestone) {
      found = true;
      break;
    }
  }

  if (!found) return { complete: null, minimum: 0 };
  return { complete, minimum };
}

export function computePipelineSummary(stages: PipelineStage[]): PipelineSummary {
  const enabled = stages.filter((s) => s.enabled);
  const statusCounts = {
    measured: 0,
    manufacturer: 0,
    calculated: 0,
    estimated: 0,
    assumed: 0,
    tbd: 0,
  };

  for (const stage of enabled) {
    switch (stage.measurementStatus) {
      case "Measured":
        statusCounts.measured += 1;
        break;
      case "Manufacturer Specification":
        statusCounts.manufacturer += 1;
        break;
      case "Calculated":
        statusCounts.calculated += 1;
        break;
      case "Engineering Estimate":
        statusCounts.estimated += 1;
        break;
      case "Assumed":
        statusCounts.assumed += 1;
        break;
      default:
        statusCounts.tbd += 1;
    }
  }

  let totalProcessingMs: number | null = 0;
  let totalTransmissionMs: number | null = 0;
  let totalBufferMs: number | null = 0;
  let totalQueueMs: number | null = 0;
  let totalAiInferenceMs: number | null = 0;
  let knownMinimumMs = 0;

  for (const stage of enabled) {
    const t = computeStageTotals(stage);
    totalProcessingMs = addNullableTotal(totalProcessingMs, t.processingMs);
    totalTransmissionMs = addNullableTotal(totalTransmissionMs, t.transmissionMs);
    totalBufferMs = addNullableTotal(totalBufferMs, t.bufferMs);
    totalQueueMs = addNullableTotal(totalQueueMs, t.queueMs);
    totalAiInferenceMs = addNullableTotal(totalAiInferenceMs, t.aiInferenceMs);
    knownMinimumMs += t.knownMinimumMs;
  }

  const completeParts = [
    totalProcessingMs,
    totalTransmissionMs,
    totalBufferMs,
    totalQueueMs,
    totalAiInferenceMs,
  ];
  const completeLatencyMs = completeParts.every((v) => v != null)
    ? completeParts.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)!
    : null;

  const raw = cumulativeToMilestone(enabled, "raw_video_visible");
  const detection = cumulativeToMilestone(enabled, "ai_detection");
  const identification = cumulativeToMilestone(enabled, "ai_identification");
  const annotated = cumulativeToMilestone(enabled, "ai_annotated");

  const sectionMap = new Map<PipelineSection, { total: number | null; min: number }>();
  for (const stage of enabled) {
    const t = computeStageTotals(stage);
    const existing = sectionMap.get(stage.pipelineSection) ?? { total: 0, min: 0 };
    if (t.totalMs != null) {
      existing.total = existing.total == null ? t.totalMs : existing.total + t.totalMs;
    } else {
      existing.total = null;
    }
    existing.min += t.knownMinimumMs;
    sectionMap.set(stage.pipelineSection, existing);
  }

  const sectionBreakdown = [...sectionMap.entries()].map(([section, v]) => ({
    section,
    totalMs: v.total,
    knownMinimumMs: v.min,
  }));

  let minE2E: number | null = 0;
  let typE2E: number | null = 0;
  let maxE2E: number | null = 0;
  for (const stage of enabled) {
    const min = num(stage.processingMinMs) ?? num(stage.processingMs);
    const typ = num(stage.processingTypicalMs) ?? num(stage.processingMs);
    const max = num(stage.processingMaxMs) ?? num(stage.processingMs);
    const parts = stageLatencyParts(stage);
    const add = (base: number | null, extra: number | null) =>
      extra == null ? null : (base ?? 0) + extra;
    minE2E = add(
      minE2E,
      sumKnown([min, parts.transmissionMs, parts.bufferMs, parts.queueMs, parts.aiInferenceMs]),
    );
    typE2E = add(
      typE2E,
      sumKnown([typ, parts.transmissionMs, parts.bufferMs, parts.queueMs, parts.aiInferenceMs]),
    );
    maxE2E = add(
      maxE2E,
      sumKnown([max, parts.transmissionMs, parts.bufferMs, parts.queueMs, parts.aiInferenceMs]),
    );
  }

  return {
    stageCount: stages.length,
    enabledStageCount: enabled.length,
    measuredStages: statusCounts.measured,
    manufacturerStages: statusCounts.manufacturer,
    calculatedStages: statusCounts.calculated,
    estimatedStages: statusCounts.estimated,
    assumedStages: statusCounts.assumed,
    tbdStages: statusCounts.tbd,
    totalProcessingMs,
    totalTransmissionMs,
    totalBufferMs,
    totalQueueMs,
    totalAiInferenceMs,
    completeLatencyMs,
    knownMinimumMs,
    tbdStageCount: statusCounts.tbd,
    rawVideoLatencyMs: raw.complete,
    aiDetectionLatencyMs: detection.complete,
    aiIdentificationLatencyMs: identification.complete,
    aiAnnotatedLatencyMs: annotated.complete,
    minimumEndToEndMs: minE2E,
    typicalEndToEndMs: typE2E,
    maximumEndToEndMs: maxE2E,
    sectionBreakdown,
  };
}

export function formatLatencyMs(value: number | null | undefined): string {
  if (value == null) return "TBD";
  if (value < 1) return value.toFixed(3);
  return value.toFixed(value < 10 ? 2 : 1);
}
