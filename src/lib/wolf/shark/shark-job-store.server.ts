import "server-only";

import type { SharkJobRecord, SharkJobStatus } from "@/lib/wolf/shark/types";

type GlobalSharkStore = {
  jobs: Map<string, SharkJobRecord>;
};

const globalKey = "__wolf_shark_job_store__";

function store(): Map<string, SharkJobRecord> {
  const g = globalThis as unknown as Record<string, GlobalSharkStore>;
  if (!g[globalKey]) {
    g[globalKey] = { jobs: new Map() };
  }
  return g[globalKey].jobs;
}

export function putSharkJob(record: SharkJobRecord): void {
  store().set(record.id, record);
}

export function getSharkJob(id: string): SharkJobRecord | undefined {
  return store().get(id);
}

export function patchSharkJob(
  id: string,
  patch: Partial<Pick<SharkJobRecord, "status" | "progress" | "error" | "result">>,
): SharkJobRecord | undefined {
  const current = store().get(id);
  if (!current) return undefined;
  const next: SharkJobRecord = { ...current, ...patch, updatedAt: new Date().toISOString() };
  store().set(id, next);
  return next;
}

export function listSharkJobs(limit = 20): SharkJobRecord[] {
  return [...store().values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function initialJob(
  id: string,
  video: string,
  status: SharkJobStatus = "QUEUED",
): SharkJobRecord {
  const now = new Date().toISOString();
  return {
    id,
    video,
    status,
    progress: status === "QUEUED" ? 0 : 0.1,
    createdAt: now,
    updatedAt: now,
    error: null,
    result: null,
  };
}
