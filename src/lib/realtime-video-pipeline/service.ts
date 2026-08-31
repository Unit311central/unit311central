import { REFERENCE_SCENARIO_SLUG } from "@/lib/realtime-video-pipeline/constants";
import {
  REFERENCE_PIPELINE_STAGES,
  REFERENCE_SCENARIO_CONFIG,
  REFERENCE_SCENARIO_DESCRIPTION,
  REFERENCE_SCENARIO_NAME,
  type ReferenceStageSeed,
} from "@/lib/realtime-video-pipeline/reference-scenario-seed";
import type {
  CreateStageInput,
  PipelineScenario,
  PipelineStage,
  ScenarioConfig,
  ScenarioWithSummary,
  StageDetails,
  SyncConfig,
  UpdateStageInput,
} from "@/lib/realtime-video-pipeline/types";
import { computePipelineSummary } from "@/lib/realtime-video-pipeline/calculations";
import {
  applyStageTerminologyPatch,
} from "@/lib/realtime-video-pipeline/stage-terminology-sync";
import type { WorkbenchConfig } from "@/lib/realtime-video-pipeline/workbench-types";
import { buildWorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-engine";
import {
  BCN_FLIGHT_SCENARIO_DESCRIPTION,
  BCN_FLIGHT_SCENARIO_NAME,
  BCN_FLIGHT_SCENARIO_SLUG,
  ORYX_AIRCRAFT_NAME,
  createBcnWorkbenchConfig,
  resolveWorkbenchConfig,
} from "@/lib/realtime-video-pipeline/workbench-reference-data";
import { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { findWorkspaceBySlug, INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

type ScenarioRow = {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  description: string;
  is_default: boolean;
  scenario_kind?: string;
  parent_scenario_id?: string | null;
  pipeline_scenario_id?: string | null;
  config: ScenarioConfig;
  sync_config: SyncConfig;
  workbench_config?: WorkbenchConfig;
  created_at: string;
  updated_at: string;
};

type StageRow = {
  id: string;
  workspace_id: string;
  scenario_id: string;
  stage_order: number;
  enabled: boolean;
  pipeline_section: string;
  component: string;
  what_happens: string;
  detailed_description: string;
  processing_ms: number | null;
  transmission_ms: number | null;
  buffer_ms: number | null;
  queue_ms: number | null;
  ai_inference_ms: number | null;
  processing_min_ms: number | null;
  processing_typical_ms: number | null;
  processing_max_ms: number | null;
  measurement_status: string;
  source: string;
  source_url: string | null;
  source_type: string;
  confidence: string;
  parallel: boolean;
  branch_group: string | null;
  path_kind: string | null;
  milestone: string | null;
  details: StageDetails;
  created_at: string;
  updated_at: string;
};

function requireDb() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured.");
  }
  return createSupabaseServiceRoleClient();
}

function mapScenario(row: ScenarioRow): PipelineScenario {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
    scenarioKind: (row.scenario_kind as PipelineScenario["scenarioKind"]) ?? "pipeline",
    parentScenarioId: row.parent_scenario_id ?? null,
    pipelineScenarioId: row.pipeline_scenario_id ?? null,
    config: row.config ?? {},
    syncConfig: row.sync_config ?? {},
    workbenchConfig: row.workbench_config ?? ({} as WorkbenchConfig),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStage(row: StageRow, stageNumber: number): PipelineStage {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    scenarioId: row.scenario_id,
    stageOrder: row.stage_order,
    stageNumber,
    enabled: row.enabled,
    pipelineSection: row.pipeline_section as PipelineStage["pipelineSection"],
    component: row.component,
    whatHappens: row.what_happens,
    detailedDescription: row.detailed_description,
    processingMs: row.processing_ms != null ? Number(row.processing_ms) : null,
    transmissionMs: row.transmission_ms != null ? Number(row.transmission_ms) : null,
    bufferMs: row.buffer_ms != null ? Number(row.buffer_ms) : null,
    queueMs: row.queue_ms != null ? Number(row.queue_ms) : null,
    aiInferenceMs: row.ai_inference_ms != null ? Number(row.ai_inference_ms) : null,
    processingMinMs: row.processing_min_ms != null ? Number(row.processing_min_ms) : null,
    processingTypicalMs: row.processing_typical_ms != null ? Number(row.processing_typical_ms) : null,
    processingMaxMs: row.processing_max_ms != null ? Number(row.processing_max_ms) : null,
    measurementStatus: row.measurement_status as PipelineStage["measurementStatus"],
    source: row.source,
    sourceUrl: row.source_url,
    sourceType: row.source_type as PipelineStage["sourceType"],
    confidence: row.confidence as PipelineStage["confidence"],
    parallel: row.parallel,
    branchGroup: row.branch_group,
    pathKind: row.path_kind as PipelineStage["pathKind"],
    milestone: row.milestone as PipelineStage["milestone"],
    details: row.details ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveUnit311WorkspaceId(): Promise<string> {
  const workspace = await findWorkspaceBySlug(INTERNAL_WORKSPACE_SLUG);
  if (!workspace?.id) throw new Error("Unit311 internal workspace not found.");
  return workspace.id;
}

function seedToInsert(
  workspaceId: string,
  scenarioId: string,
  seed: ReferenceStageSeed,
  stageOrder: number,
) {
  return {
    workspace_id: workspaceId,
    scenario_id: scenarioId,
    stage_order: stageOrder,
    enabled: true,
    pipeline_section: seed.pipelineSection,
    component: seed.component,
    what_happens: seed.whatHappens,
    detailed_description: seed.detailedDescription,
    processing_ms: seed.processingMs ?? null,
    transmission_ms: seed.transmissionMs ?? null,
    buffer_ms: null,
    queue_ms: null,
    ai_inference_ms: null,
    measurement_status: seed.measurementStatus ?? "TBD",
    source: seed.source ?? "",
    source_type: seed.sourceType ?? "",
    confidence: seed.confidence ?? "Unknown",
    parallel: seed.parallel ?? false,
    branch_group: seed.branchGroup ?? null,
    path_kind: seed.pathKind ?? null,
    milestone: seed.milestone ?? null,
    details: seed.details ?? {},
  };
}

async function syncReferenceStageTerminology(scenarioId: string): Promise<void> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();
  const { data: stages, error } = await supabase
    .from("realtime_video_pipeline_stages")
    .select("*")
    .eq("scenario_id", scenarioId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);

  for (const row of (stages ?? []) as StageRow[]) {
    const mapped = mapStage(row, row.stage_order);
    const patched = applyStageTerminologyPatch(mapped);
    if (!patched) continue;
    const changed =
      patched.component !== mapped.component ||
      patched.whatHappens !== mapped.whatHappens ||
      patched.detailedDescription !== mapped.detailedDescription ||
      JSON.stringify(patched.details) !== JSON.stringify(mapped.details);
    if (!changed) continue;

    await supabase
      .from("realtime_video_pipeline_stages")
      .update({
        component: patched.component,
        what_happens: patched.whatHappens,
        detailed_description: patched.detailedDescription,
        details: patched.details,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  }
}

export async function ensureReferenceScenario(): Promise<PipelineScenario> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();

  const { data: existing } = await supabase
    .from("realtime_video_scenarios")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("slug", REFERENCE_SCENARIO_SLUG)
    .maybeSingle();

  if (existing) {
    await syncReferenceStageTerminology((existing as ScenarioRow).id);
    return mapScenario(existing as ScenarioRow);
  }

  const { data: created, error } = await supabase
    .from("realtime_video_scenarios")
    .insert({
      workspace_id: workspaceId,
      slug: REFERENCE_SCENARIO_SLUG,
      name: REFERENCE_SCENARIO_NAME,
      description: REFERENCE_SCENARIO_DESCRIPTION,
      is_default: true,
      scenario_kind: "pipeline",
      config: REFERENCE_SCENARIO_CONFIG,
      sync_config: {},
    })
    .select("*")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create reference scenario.");

  const scenarioId = (created as ScenarioRow).id;
  const stageRows = REFERENCE_PIPELINE_STAGES.map((seed, index) =>
    seedToInsert(workspaceId, scenarioId, seed, index + 1),
  );

  const { error: stageError } = await supabase.from("realtime_video_pipeline_stages").insert(stageRows);
  if (stageError) throw new Error(stageError.message);

  return mapScenario(created as ScenarioRow);
}

export async function listScenarios(): Promise<PipelineScenario[]> {
  await ensureReferenceScenario();
  await ensureBcnFlightScenario();
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();
  const { data, error } = await supabase
    .from("realtime_video_scenarios")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ScenarioRow[]).map(mapScenario);
}

export async function getScenarioWithStages(scenarioId: string): Promise<ScenarioWithSummary> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();

  const { data: scenario, error } = await supabase
    .from("realtime_video_scenarios")
    .select("*")
    .eq("id", scenarioId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!scenario) throw new Error("Scenario not found.");

  const { data: stages, error: stageError } = await supabase
    .from("realtime_video_pipeline_stages")
    .select("*")
    .eq("scenario_id", scenarioId)
    .order("stage_order", { ascending: true });
  if (stageError) throw new Error(stageError.message);

  const mapped = ((stages ?? []) as StageRow[]).map((row, index) => mapStage(row, index + 1));
  return {
    ...mapScenario(scenario as ScenarioRow),
    stages: mapped,
    summary: computePipelineSummary(mapped),
  };
}

export async function createScenario(input: {
  name: string;
  description?: string;
  config?: ScenarioConfig;
}): Promise<PipelineScenario> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();
  const slug = input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const { data, error } = await supabase
    .from("realtime_video_scenarios")
    .insert({
      workspace_id: workspaceId,
      slug: slug || `scenario-${Date.now()}`,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      is_default: false,
      config: input.config ?? {},
      sync_config: {},
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create scenario.");
  return mapScenario(data as ScenarioRow);
}

export async function updateScenario(
  scenarioId: string,
  updates: Partial<{
    name: string;
    description: string;
    config: ScenarioConfig;
    syncConfig: SyncConfig;
  }>,
): Promise<PipelineScenario> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name != null) payload.name = updates.name.trim();
  if (updates.description != null) payload.description = updates.description;
  if (updates.config != null) payload.config = updates.config;
  if (updates.syncConfig != null) payload.sync_config = updates.syncConfig;

  const { data, error } = await supabase
    .from("realtime_video_scenarios")
    .update(payload)
    .eq("id", scenarioId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Scenario not found.");
  return mapScenario(data as ScenarioRow);
}

export async function deleteScenario(scenarioId: string): Promise<void> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();
  const { data: row } = await supabase
    .from("realtime_video_scenarios")
    .select("is_default")
    .eq("id", scenarioId)
    .maybeSingle();
  if (row?.is_default) throw new Error("Cannot delete the default reference scenario.");

  const { error } = await supabase
    .from("realtime_video_scenarios")
    .delete()
    .eq("id", scenarioId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

function stageToRow(
  workspaceId: string,
  scenarioId: string,
  input: CreateStageInput | UpdateStageInput,
  stageOrder: number,
) {
  return {
    workspace_id: workspaceId,
    scenario_id: scenarioId,
    stage_order: stageOrder,
    enabled: input.enabled ?? true,
    pipeline_section: input.pipelineSection,
    component: input.component,
    what_happens: input.whatHappens ?? "",
    detailed_description: input.detailedDescription ?? "",
    processing_ms: input.processingMs ?? null,
    transmission_ms: input.transmissionMs ?? null,
    buffer_ms: input.bufferMs ?? null,
    queue_ms: input.queueMs ?? null,
    ai_inference_ms: input.aiInferenceMs ?? null,
    processing_min_ms: input.processingMinMs ?? null,
    processing_typical_ms: input.processingTypicalMs ?? null,
    processing_max_ms: input.processingMaxMs ?? null,
    measurement_status: input.measurementStatus ?? "TBD",
    source: input.source ?? "",
    source_url: input.sourceUrl ?? null,
    source_type: input.sourceType ?? "",
    confidence: input.confidence ?? "Unknown",
    parallel: input.parallel ?? false,
    branch_group: input.branchGroup ?? null,
    path_kind: input.pathKind ?? null,
    milestone: input.milestone ?? null,
    details: input.details ?? {},
    updated_at: new Date().toISOString(),
  };
}

export async function createStage(
  scenarioId: string,
  input: CreateStageInput,
): Promise<PipelineStage> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();

  const { data: maxRow } = await supabase
    .from("realtime_video_pipeline_stages")
    .select("stage_order")
    .eq("scenario_id", scenarioId)
    .order("stage_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const stageOrder = input.stageOrder ?? ((maxRow?.stage_order as number | undefined) ?? 0) + 1;

  const { data, error } = await supabase
    .from("realtime_video_pipeline_stages")
    .insert(stageToRow(workspaceId, scenarioId, input, stageOrder))
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create stage.");
  return mapStage(data as StageRow, stageOrder);
}

export async function updateStage(stageId: string, input: UpdateStageInput): Promise<PipelineStage> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();

  const { data: existing, error: loadError } = await supabase
    .from("realtime_video_pipeline_stages")
    .select("*")
    .eq("id", stageId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (loadError) throw new Error(loadError.message);
  if (!existing) throw new Error("Stage not found.");

  const merged = { ...mapStage(existing as StageRow, existing.stage_order), ...input };
  const payload = stageToRow(workspaceId, merged.scenarioId, merged, merged.stageOrder);

  const { data, error } = await supabase
    .from("realtime_video_pipeline_stages")
    .update(payload)
    .eq("id", stageId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update stage.");

  const { count } = await supabase
    .from("realtime_video_pipeline_stages")
    .select("id", { count: "exact", head: true })
    .eq("scenario_id", merged.scenarioId)
    .lte("stage_order", merged.stageOrder);
  return mapStage(data as StageRow, count ?? merged.stageOrder);
}

export async function deleteStage(stageId: string): Promise<void> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();

  const { data: stage } = await supabase
    .from("realtime_video_pipeline_stages")
    .select("scenario_id, stage_order")
    .eq("id", stageId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!stage) throw new Error("Stage not found.");

  const { error } = await supabase.from("realtime_video_pipeline_stages").delete().eq("id", stageId);
  if (error) throw new Error(error.message);

  const { data: remaining } = await supabase
    .from("realtime_video_pipeline_stages")
    .select("id, stage_order")
    .eq("scenario_id", stage.scenario_id)
    .order("stage_order", { ascending: true });

  for (let i = 0; i < (remaining ?? []).length; i++) {
    const row = remaining![i]!;
    if (row.stage_order !== i + 1) {
      await supabase
        .from("realtime_video_pipeline_stages")
        .update({ stage_order: i + 1 })
        .eq("id", row.id);
    }
  }
}

export async function duplicateStage(stageId: string): Promise<PipelineStage> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();
  const { data: existing, error } = await supabase
    .from("realtime_video_pipeline_stages")
    .select("*")
    .eq("id", stageId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!existing) throw new Error("Stage not found.");

  const row = existing as StageRow;
  return createStage(row.scenario_id, {
    ...mapStage(row, row.stage_order),
    component: `${row.component} (copy)`,
    stageOrder: row.stage_order + 1,
  });
}

export async function reorderStages(scenarioId: string, orderedStageIds: string[]): Promise<void> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();

  for (let i = 0; i < orderedStageIds.length; i++) {
    const { error } = await supabase
      .from("realtime_video_pipeline_stages")
      .update({ stage_order: i + 1, updated_at: new Date().toISOString() })
      .eq("id", orderedStageIds[i])
      .eq("scenario_id", scenarioId)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
  }
}

export async function ensureBcnFlightScenario(): Promise<PipelineScenario> {
  const pipeline = await ensureReferenceScenario();
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();

  const { data: existing } = await supabase
    .from("realtime_video_scenarios")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("slug", BCN_FLIGHT_SCENARIO_SLUG)
    .maybeSingle();

  if (existing) {
    const row = existing as ScenarioRow;
    const wb = row.workbench_config as WorkbenchConfig | undefined;
    const needsSeed = !wb || Object.keys(wb).length === 0 || !wb.flightSchedule?.length;
    const needsOryxProfile = wb?.videoProfile?.droneModel !== ORYX_AIRCRAFT_NAME;
    if (needsSeed || needsOryxProfile) {
      const nextConfig = needsSeed
        ? createBcnWorkbenchConfig()
        : resolveWorkbenchConfig({
            ...wb,
            videoProfile: createBcnWorkbenchConfig().videoProfile,
          });
      const { error: updateError } = await supabase
        .from("realtime_video_scenarios")
        .update({
          workbench_config: nextConfig,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (updateError) throw new Error(updateError.message);
      const { data: refreshed } = await supabase
        .from("realtime_video_scenarios")
        .select("*")
        .eq("id", row.id)
        .single();
      if (refreshed) return mapScenario(refreshed as ScenarioRow);
    }
    return mapScenario(row);
  }

  const { data: created, error } = await supabase
    .from("realtime_video_scenarios")
    .insert({
      workspace_id: workspaceId,
      slug: BCN_FLIGHT_SCENARIO_SLUG,
      name: BCN_FLIGHT_SCENARIO_NAME,
      description: BCN_FLIGHT_SCENARIO_DESCRIPTION,
      is_default: false,
      scenario_kind: "flight",
      pipeline_scenario_id: pipeline.id,
      config: {},
      sync_config: {},
      workbench_config: createBcnWorkbenchConfig(),
    })
    .select("*")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create BCN flight scenario.");
  return mapScenario(created as ScenarioRow);
}

export async function getWorkbenchModelForScenario(flightScenarioId: string) {
  await ensureReferenceScenario();
  await ensureBcnFlightScenario();
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();

  const { data: flightRow, error } = await supabase
    .from("realtime_video_scenarios")
    .select("*")
    .eq("id", flightScenarioId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!flightRow) throw new Error("Scenario not found.");

  const flightScenario = mapScenario(flightRow as ScenarioRow);
  const pipelineId =
    flightScenario.pipelineScenarioId ??
    (flightScenario.scenarioKind === "pipeline" ? flightScenario.id : null);

  let pipeline: ScenarioWithSummary | null = null;
  if (pipelineId) {
    pipeline = await getScenarioWithStages(pipelineId);
  }

  const model = buildWorkbenchModel({
    flightScenario,
    pipeline: pipeline
      ? { stages: pipeline.stages, summary: pipeline.summary }
      : null,
  });
  model.pipelineScenario = pipeline;
  return model;
}

export async function updateWorkbenchConfig(
  scenarioId: string,
  workbenchConfig: WorkbenchConfig,
): Promise<PipelineScenario> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();
  const { data, error } = await supabase
    .from("realtime_video_scenarios")
    .update({
      workbench_config: workbenchConfig,
      updated_at: new Date().toISOString(),
    })
    .eq("id", scenarioId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Scenario not found.");
  return mapScenario(data as ScenarioRow);
}

export async function duplicateScenarioVersion(
  scenarioId: string,
  newName: string,
): Promise<PipelineScenario> {
  const supabase = requireDb();
  const workspaceId = await resolveUnit311WorkspaceId();
  const { data: source, error } = await supabase
    .from("realtime_video_scenarios")
    .select("*")
    .eq("id", scenarioId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!source) throw new Error("Scenario not found.");

  const row = source as ScenarioRow;
  const slug = newName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80);

  const { data: created, error: insertError } = await supabase
    .from("realtime_video_scenarios")
    .insert({
      workspace_id: workspaceId,
      slug: slug || `copy-${Date.now()}`,
      name: newName.trim(),
      description: row.description,
      is_default: false,
      scenario_kind: row.scenario_kind ?? "flight",
      parent_scenario_id: scenarioId,
      pipeline_scenario_id: row.pipeline_scenario_id,
      config: row.config ?? {},
      sync_config: row.sync_config ?? {},
      workbench_config: row.workbench_config ?? {},
    })
    .select("*")
    .single();
  if (insertError || !created) throw new Error(insertError?.message ?? "Duplicate failed.");
  return mapScenario(created as ScenarioRow);
}
