import type {
  CreateStageInput,
  PipelineScenario,
  ScenarioWithSummary,
  UpdateStageInput,
} from "@/lib/realtime-video-pipeline/types";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  const payload = JSON.parse(text) as T & { error?: string };
  if (!response.ok) throw new Error((payload as { error?: string }).error ?? text);
  return payload;
}

export async function listScenariosApi(): Promise<PipelineScenario[]> {
  const res = await fetch("/api/internal/realtime-video-pipeline/scenarios", { cache: "no-store" });
  const data = await readJson<{ scenarios: PipelineScenario[] }>(res);
  return data.scenarios;
}

export async function getScenarioApi(id: string): Promise<ScenarioWithSummary> {
  const res = await fetch(`/api/internal/realtime-video-pipeline/scenarios/${id}`, {
    cache: "no-store",
  });
  return readJson<ScenarioWithSummary>(res);
}

export async function createStageApi(
  scenarioId: string,
  input: Partial<CreateStageInput>,
): Promise<ScenarioWithSummary> {
  const res = await fetch(`/api/internal/realtime-video-pipeline/scenarios/${scenarioId}/stages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ scenario: ScenarioWithSummary }>(res);
  return data.scenario;
}

export async function updateStageApi(
  stageId: string,
  input: UpdateStageInput,
): Promise<ScenarioWithSummary> {
  const res = await fetch(`/api/internal/realtime-video-pipeline/stages/${stageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ scenario: ScenarioWithSummary }>(res);
  return data.scenario;
}

export async function deleteStageApi(stageId: string, scenarioId: string): Promise<ScenarioWithSummary> {
  const res = await fetch(`/api/internal/realtime-video-pipeline/stages/${stageId}`, {
    method: "DELETE",
  });
  const data = await readJson<{ scenario: ScenarioWithSummary }>(res);
  return data.scenario;
}

export async function duplicateStageApi(stageId: string): Promise<ScenarioWithSummary> {
  const res = await fetch(`/api/internal/realtime-video-pipeline/stages/${stageId}/duplicate`, {
    method: "POST",
  });
  const data = await readJson<{ scenario: ScenarioWithSummary }>(res);
  return data.scenario;
}

export async function reorderStagesApi(
  scenarioId: string,
  orderedStageIds: string[],
): Promise<ScenarioWithSummary> {
  const res = await fetch(
    `/api/internal/realtime-video-pipeline/scenarios/${scenarioId}/reorder`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedStageIds }),
    },
  );
  const data = await readJson<{ scenario: ScenarioWithSummary }>(res);
  return data.scenario;
}

export async function toggleStageApi(
  stageId: string,
  enabled: boolean,
): Promise<ScenarioWithSummary> {
  return updateStageApi(stageId, { enabled });
}
