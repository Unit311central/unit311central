import type { EngSop, EngSopRun, EngSopSection, EngSopStatus } from "@/lib/engineering-sop-data";
import type { EngineeringSopRunDetail } from "@/lib/engineering-sop/types";

export function mapRunDetailToEngSopRun(run: EngineeringSopRunDetail): EngSopRun {
  return {
    runId: run.id,
    id: run.id,
    sopId: run.sopId,
    sopVersion: run.sopVersion,
    startedBy: run.startedBy,
    startedAt: run.startedAt,
    status: run.status,
    stepStates: run.stepStates,
    signOff: run.signOff,
    completedAt: run.completedAt,
    pausedAt: run.pausedAt,
    lastActivityAt: run.lastActivityAt,
  };
}

async function parseJson<T>(response: Response): Promise<T & { error?: string }> {
  return (await response.json()) as T & { error?: string };
}

export async function fetchEngineeringSops(filters?: {
  search?: string;
  status?: EngSopStatus | "All";
}): Promise<EngSop[]> {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set("search", filters.search.trim());
  if (filters?.status && filters.status !== "All") params.set("status", filters.status);
  const qs = params.toString();
  const response = await fetch(`/api/engineering/sops${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  const data = await parseJson<{ sops?: EngSop[] }>(response);
  if (!response.ok) throw new Error(data.error ?? "Failed to load SOPs.");
  return data.sops ?? [];
}

export async function fetchEngineeringSopRuns(activeOnly = false) {
  const response = await fetch(`/api/engineering/sops/runs?active=${activeOnly ? "true" : "false"}`, {
    cache: "no-store",
  });
  const data = await parseJson<{ runs?: Array<{ id: string; sopId: string; status: string; completedAt?: string | null }> }>(
    response,
  );
  if (!response.ok) throw new Error(data.error ?? "Failed to load runs.");
  return data.runs ?? [];
}

export async function createEngineeringSopApi(input: {
  number: string;
  title: string;
  owner: string;
  approver: string;
  reviewDate: string;
  summary?: string;
  sections?: EngSopSection[];
}): Promise<EngSop> {
  const response = await fetch("/api/engineering/sops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ sop?: EngSop }>(response);
  if (!response.ok || !data.sop) throw new Error(data.error ?? "Failed to create SOP.");
  return data.sop;
}

export async function updateEngineeringSopApi(
  id: string,
  patch: Partial<{
    title: string;
    owner: string;
    approver: string;
    reviewDate: string;
    summary: string;
    sections: EngSopSection[];
    status: EngSopStatus;
  }>,
): Promise<EngSop> {
  const response = await fetch(`/api/engineering/sops/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await parseJson<{ sop?: EngSop }>(response);
  if (!response.ok || !data.sop) throw new Error(data.error ?? "Failed to update SOP.");
  return data.sop;
}

export async function engineeringSopActionApi(
  id: string,
  action: "submit" | "approve" | "reject" | "retire" | "version",
  body?: Record<string, unknown>,
): Promise<EngSop> {
  const response = await fetch(`/api/engineering/sops/${id}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await parseJson<{ sop?: EngSop }>(response);
  if (!response.ok || !data.sop) throw new Error(data.error ?? `Failed to ${action} SOP.`);
  return data.sop;
}

export async function deleteEngineeringSopApi(id: string): Promise<void> {
  const response = await fetch(`/api/engineering/sops/${id}`, { method: "DELETE" });
  const data = await parseJson<{ error?: string }>(response);
  if (!response.ok) throw new Error(data.error ?? "Failed to delete SOP.");
}

export async function startEngineeringSopRunApi(sopId: string): Promise<EngSopRun> {
  const response = await fetch(`/api/engineering/sops/${sopId}/run`, { method: "POST", cache: "no-store" });
  const data = await parseJson<{ run?: EngineeringSopRunDetail }>(response);
  if (!response.ok || !data.run) throw new Error(data.error ?? "Failed to start SOP run.");
  return mapRunDetailToEngSopRun(data.run);
}

export async function completeEngineeringSopRunStepApi(
  runId: string,
  stepId: string,
  input: { outcome: "pass" | "fail" | "na"; notes?: string; evidenceRefs?: string[] },
): Promise<EngSopRun> {
  const response = await fetch(`/api/engineering/sops/runs/${runId}/steps/${stepId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ run?: EngineeringSopRunDetail }>(response);
  if (!response.ok || !data.run) throw new Error(data.error ?? "Failed to complete step.");
  return mapRunDetailToEngSopRun(data.run);
}

export async function completeEngineeringSopRunApi(runId: string): Promise<EngSopRun> {
  const response = await fetch(`/api/engineering/sops/runs/${runId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "complete" }),
  });
  const data = await parseJson<{ run?: EngineeringSopRunDetail }>(response);
  if (!response.ok || !data.run) throw new Error(data.error ?? "Failed to complete run.");
  return mapRunDetailToEngSopRun(data.run);
}
