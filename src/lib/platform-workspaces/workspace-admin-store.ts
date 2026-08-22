import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { WorkspaceAdminRecord } from "@/lib/platform-workspaces/types";

const STORE_DIR = path.join(process.cwd(), ".data", "platform-workspaces");
const STORE_FILE =
  process.env.WORKSPACE_ADMIN_STORE_FILE?.trim() ||
  path.join(STORE_DIR, "admin-records.json");

type StoreShape = {
  records: WorkspaceAdminRecord[];
};

function emptyStore(): StoreShape {
  return { records: [] };
}

async function ensureStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    if (!Array.isArray(parsed.records)) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function createWorkspaceId(): string {
  return randomUUID();
}

export async function readAdminRecords(): Promise<WorkspaceAdminRecord[]> {
  const store = await ensureStore();
  return [...store.records];
}

export async function writeAdminRecords(records: WorkspaceAdminRecord[]): Promise<void> {
  await writeStore({ records });
}

export async function upsertAdminRecord(record: WorkspaceAdminRecord): Promise<WorkspaceAdminRecord> {
  const store = await ensureStore();
  const index = store.records.findIndex((item) => item.workspaceId === record.workspaceId);
  if (index >= 0) store.records[index] = record;
  else store.records.push(record);
  await writeStore(store);
  return record;
}

export async function findAdminRecordBySlug(slug: string): Promise<WorkspaceAdminRecord | null> {
  const normalized = slug.trim().toLowerCase();
  const store = await ensureStore();
  return store.records.find((item) => item.slug === normalized) ?? null;
}

export async function findAdminRecordById(
  workspaceId: string,
): Promise<WorkspaceAdminRecord | null> {
  const store = await ensureStore();
  return store.records.find((item) => item.workspaceId === workspaceId) ?? null;
}

export async function deleteAdminRecord(workspaceId: string): Promise<boolean> {
  const store = await ensureStore();
  const next = store.records.filter((item) => item.workspaceId !== workspaceId);
  if (next.length === store.records.length) return false;
  await writeStore({ records: next });
  return true;
}

/** In-memory store for tests. */
export function createInMemoryAdminStore(initial: WorkspaceAdminRecord[] = []) {
  let records = [...initial];
  return {
    read: async () => [...records],
    write: async (next: WorkspaceAdminRecord[]) => {
      records = [...next];
    },
    upsert: async (record: WorkspaceAdminRecord) => {
      const index = records.findIndex((item) => item.workspaceId === record.workspaceId);
      if (index >= 0) records[index] = record;
      else records.push(record);
      return record;
    },
    findBySlug: async (slug: string) =>
      records.find((item) => item.slug === slug.trim().toLowerCase()) ?? null,
    findById: async (workspaceId: string) =>
      records.find((item) => item.workspaceId === workspaceId) ?? null,
    delete: async (workspaceId: string) => {
      const before = records.length;
      records = records.filter((item) => item.workspaceId !== workspaceId);
      return records.length < before;
    },
  };
}
