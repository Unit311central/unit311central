/**
 * Management workspace — editable meetings, function packs, and actions per workspace.
 */

import { DEMO_WORKSPACE_SLUG, isDemoDomainHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { isCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { readEffectiveBrowserWorkspaceSlug } from "@/lib/demo-enterprise/workspace-tenancy-surface";
import { isSaecSlug } from "@/lib/saec-surface";
import {
  SAEC_MANAGEMENT_ACTIONS,
  SAEC_MANAGEMENT_FUNCTION_PACKS,
  SAEC_MANAGEMENT_MEETINGS,
} from "@/lib/saec/saec-management-seed";

import {
  MANAGEMENT_ACTIONS,
  MANAGEMENT_FUNCTION_PACKS,
  MANAGEMENT_MEETINGS,
} from "./management-placeholder";
import type {
  ManagementActionPlaceholder,
  ManagementFunctionPackPlaceholder,
  ManagementMeetingPlaceholder,
} from "./types";

type Listener = () => void;

export type ManagementFunctionPackRecord = ManagementFunctionPackPlaceholder & {
  uploadedFileName?: string | null;
  uploadedAt?: string | null;
};

export type ManagementWorkspaceState = {
  meetings: ManagementMeetingPlaceholder[];
  functionPacks: ManagementFunctionPackRecord[];
  actions: ManagementActionPlaceholder[];
};

type WorkspaceBucket = {
  state: ManagementWorkspaceState;
  serverSnapshot: ManagementWorkspaceState;
  hydrated: boolean;
  listeners: Set<Listener>;
};

const STORAGE_VERSION = "v2";
const LEGACY_STORAGE_VERSION = "v1";
const buckets = new Map<string, WorkspaceBucket>();

function hostToWorkspaceSlug(host: string): string {
  const normalized = host.trim().toLowerCase();
  if (!normalized || normalized === "default") return "default";
  if (isDemoDomainHost(normalized)) return DEMO_WORKSPACE_SLUG;
  return parseClientPlatformSubdomainSafe(normalized) ?? normalized;
}

export function resolveManagementWorkspaceSlug(hostname?: string | null): string {
  if (hostname != null) {
    return hostToWorkspaceSlug(hostname);
  }
  if (typeof window !== "undefined") {
    const effective = readEffectiveBrowserWorkspaceSlug();
    if (effective) return effective;
    return hostToWorkspaceSlug(window.location.hostname);
  }
  return "default";
}

function storageKey(slug: string, version = STORAGE_VERSION): string {
  return `unit311-management-workspace-${version}:${slug}`;
}

function legacyStorageKey(hostname: string): string {
  return storageKey(hostname.trim().toLowerCase(), LEGACY_STORAGE_VERSION);
}

function seedState(slug?: string): ManagementWorkspaceState {
  if (isSaecSlug(slug)) {
    return {
      meetings: SAEC_MANAGEMENT_MEETINGS.map((meeting) => ({
        ...meeting,
        readiness: [...meeting.readiness],
      })),
      functionPacks: SAEC_MANAGEMENT_FUNCTION_PACKS.map((pack) => ({ ...pack })),
      actions: SAEC_MANAGEMENT_ACTIONS.map((action) => ({ ...action })),
    };
  }
  if (isCustomerWorkspaceSlug(slug)) {
    return { meetings: [], functionPacks: [], actions: [] };
  }
  return {
    meetings: MANAGEMENT_MEETINGS.map((meeting) => ({ ...meeting, readiness: [...meeting.readiness] })),
    functionPacks: MANAGEMENT_FUNCTION_PACKS.map((pack) => ({ ...pack })),
    actions: MANAGEMENT_ACTIONS.map((action) => ({ ...action })),
  };
}

function cloneState(state: ManagementWorkspaceState): ManagementWorkspaceState {
  return {
    meetings: state.meetings.map((meeting) => ({
      ...meeting,
      participants: [...meeting.participants],
      readiness: meeting.readiness.map((row) => ({ ...row })),
    })),
    functionPacks: state.functionPacks.map((pack) => ({ ...pack })),
    actions: state.actions.map((action) => ({ ...action })),
  };
}

function getBucket(slug: string): WorkspaceBucket {
  const key = resolveManagementWorkspaceSlug(slug);
  let bucket = buckets.get(key);
  if (!bucket) {
    const seeded = seedState(key);
    bucket = {
      state: cloneState(seeded),
      serverSnapshot: cloneState(seeded),
      hydrated: false,
      listeners: new Set(),
    };
    buckets.set(key, bucket);
  }
  return bucket;
}

function isEmptyManagementState(state: ManagementWorkspaceState): boolean {
  return state.meetings.length === 0 && state.functionPacks.length === 0 && state.actions.length === 0;
}

function normalizePersistedState(parsed: ManagementWorkspaceState | null): ManagementWorkspaceState | null {
  if (!parsed || !Array.isArray(parsed.meetings) || !Array.isArray(parsed.functionPacks)) {
    return null;
  }
  if (!Array.isArray(parsed.actions)) return null;
  if (isEmptyManagementState(parsed)) return null;
  return parsed;
}

function readRawPersistedState(slug: string): ManagementWorkspaceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    return JSON.parse(raw) as ManagementWorkspaceState;
  } catch {
    return null;
  }
}

function readPersistedState(slug: string): ManagementWorkspaceState | null {
  if (typeof window === "undefined") return null;

  const current = normalizePersistedState(readRawPersistedState(slug));
  if (current) return current;

  const legacyHost = window.location.hostname.trim().toLowerCase();
  if (legacyHost) {
    try {
      const legacyRaw = window.localStorage.getItem(legacyStorageKey(legacyHost));
      if (legacyRaw) {
        const legacy = normalizePersistedState(JSON.parse(legacyRaw) as ManagementWorkspaceState);
        if (legacy) {
          persistState(slug, legacy);
          return legacy;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

function persistState(slug: string, state: ManagementWorkspaceState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function ensureHydrated(slug: string) {
  const bucket = getBucket(slug);
  if (bucket.hydrated || typeof window === "undefined") return;
  bucket.hydrated = true;
  const persisted = readPersistedState(slug);
  if (persisted) {
    bucket.state = persisted;
    bucket.serverSnapshot = cloneState(persisted);
  } else {
    persistState(slug, bucket.state);
  }
}

function writeState(slug: string, next: ManagementWorkspaceState) {
  const bucket = getBucket(slug);
  ensureHydrated(slug);
  bucket.state = next;
  persistState(slug, next);
  bucket.listeners.forEach((listener) => listener());
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getManagementState(slug?: string): ManagementWorkspaceState {
  const key = resolveManagementWorkspaceSlug(slug);
  ensureHydrated(key);
  return getBucket(key).state;
}

export function getManagementServerSnapshot(slug?: string): ManagementWorkspaceState {
  return getBucket(resolveManagementWorkspaceSlug(slug)).serverSnapshot;
}

export function subscribeManagement(slug: string, listener: Listener): () => void {
  const bucket = getBucket(slug);
  bucket.listeners.add(listener);
  return () => bucket.listeners.delete(listener);
}

export type UpsertManagementMeetingInput = Partial<ManagementMeetingPlaceholder> & {
  name: string;
};

export function upsertManagementMeeting(
  slug: string,
  input: UpsertManagementMeetingInput,
): ManagementMeetingPlaceholder {
  const current = getManagementState(slug);
  const existing = input.id ? current.meetings.find((row) => row.id === input.id) : undefined;
  const participants =
    input.participants ??
    existing?.participants ??
    [];
  const readiness = input.readiness ?? existing?.readiness ?? [];
  const packsReady = input.packsReady ?? existing?.packsReady ?? 0;
  const packsTotal = input.packsTotal ?? existing?.packsTotal ?? packsReady;
  const next: ManagementMeetingPlaceholder = {
    id: existing?.id ?? input.id ?? newId("mgmt-meeting"),
    name: input.name.trim(),
    schedule: (input.schedule ?? existing?.schedule ?? "").trim(),
    participants,
    functionPackLabel: (input.functionPackLabel ?? existing?.functionPackLabel ?? "").trim(),
    readiness,
    packsReady,
    packsTotal,
  };
  const meetings = existing
    ? current.meetings.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.meetings];
  writeState(slug, { ...current, meetings });
  return next;
}

export function deleteManagementMeeting(slug: string, id: string) {
  const current = getManagementState(slug);
  writeState(slug, {
    ...current,
    meetings: current.meetings.filter((row) => row.id !== id),
  });
}

export type UpsertManagementFunctionPackInput = Partial<ManagementFunctionPackRecord> & {
  title: string;
  ownerRole: string;
};

export function upsertManagementFunctionPack(
  slug: string,
  input: UpsertManagementFunctionPackInput,
): ManagementFunctionPackRecord {
  const current = getManagementState(slug);
  const existing = input.id ? current.functionPacks.find((row) => row.id === input.id) : undefined;
  const next: ManagementFunctionPackRecord = {
    id: existing?.id ?? input.id ?? newId("mgmt-pack"),
    title: input.title.trim(),
    ownerRole: input.ownerRole.trim(),
    reportingPeriod: (input.reportingPeriod ?? existing?.reportingPeriod ?? "").trim(),
    status: input.status ?? existing?.status ?? "draft",
    lastGenerated: input.lastGenerated ?? existing?.lastGenerated ?? null,
    uploadedFileName: input.uploadedFileName ?? existing?.uploadedFileName ?? null,
    uploadedAt: input.uploadedAt ?? existing?.uploadedAt ?? null,
  };
  const functionPacks = existing
    ? current.functionPacks.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.functionPacks];
  writeState(slug, { ...current, functionPacks });
  return next;
}

export function uploadManagementFunctionPack(
  slug: string,
  packId: string,
  fileName: string,
): ManagementFunctionPackRecord | null {
  const current = getManagementState(slug);
  const existing = current.functionPacks.find((row) => row.id === packId);
  if (!existing) return null;
  const next = upsertManagementFunctionPack(slug, {
    ...existing,
    uploadedFileName: fileName.trim(),
    uploadedAt: nowIso(),
    lastGenerated: todayIso(),
    status: "current",
  });
  return next;
}

export function deleteManagementFunctionPack(slug: string, id: string) {
  const current = getManagementState(slug);
  writeState(slug, {
    ...current,
    functionPacks: current.functionPacks.filter((row) => row.id !== id),
  });
}

export type UpsertManagementActionInput = Partial<ManagementActionPlaceholder> & {
  title: string;
};

export function upsertManagementAction(
  slug: string,
  input: UpsertManagementActionInput,
): ManagementActionPlaceholder {
  const current = getManagementState(slug);
  const existing = input.id ? current.actions.find((row) => row.id === input.id) : undefined;
  const next: ManagementActionPlaceholder = {
    id: existing?.id ?? input.id ?? newId("mgmt-action"),
    title: input.title.trim(),
    owner: (input.owner ?? existing?.owner ?? "").trim(),
    dueDate: (input.dueDate ?? existing?.dueDate ?? todayIso()).slice(0, 10),
    status: input.status ?? existing?.status ?? "open",
    meeting: (input.meeting ?? existing?.meeting ?? "").trim(),
    kind: input.kind ?? existing?.kind ?? "action",
  };
  const actions = existing
    ? current.actions.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.actions];
  writeState(slug, { ...current, actions });
  return next;
}

export function deleteManagementAction(slug: string, id: string) {
  const current = getManagementState(slug);
  writeState(slug, {
    ...current,
    actions: current.actions.filter((row) => row.id !== id),
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function computeManagementSummary(state: ManagementWorkspaceState) {
  const openActions = state.actions.filter((row) => row.status === "open").length;
  const overdueActions = state.actions.filter((row) => row.status === "overdue").length;
  const decisionsLogged = state.actions.filter((row) => row.kind === "decision").length;
  const latestPack = state.functionPacks
    .filter((pack) => pack.lastGenerated)
    .sort((a, b) => String(b.lastGenerated).localeCompare(String(a.lastGenerated)))[0];
  const lastMeeting = state.meetings[1] ?? state.meetings[0];
  return {
    openActions,
    overdueActions,
    decisionsLogged,
    latestPack: latestPack
      ? `${latestPack.title} · ${latestPack.lastGenerated}`
      : "No packs uploaded yet",
    lastMeeting: lastMeeting
      ? `${lastMeeting.name} · ${lastMeeting.schedule}`
      : "No meetings scheduled",
  };
}
