import {
  CONTENT_STUDIO_PAGE_PRESETS,
  DEFAULT_CFO_MANAGEMENT_PAGES,
} from "./content-studio-placeholder";
import type {
  ContentStudioFunctionId,
  ContentStudioPageConfig,
  ContentStudioSavedContent,
} from "./types";

type Listener = () => void;

export type ContentStudioWorkspaceState = {
  savedContent: ContentStudioSavedContent[];
};

const STORAGE_VERSION = "v1";
const buckets = new Map<string, { state: ContentStudioWorkspaceState; hydrated: boolean; listeners: Set<Listener> }>();

function defaultSlug(): string {
  if (typeof window === "undefined") return "default";
  return window.location.hostname.trim().toLowerCase() || "default";
}

export function resolveContentStudioWorkspaceSlug(hostname?: string | null): string {
  const host = (hostname ?? defaultSlug()).trim().toLowerCase();
  return host || "default";
}

function storageKey(slug: string): string {
  return `unit311-content-studio-${STORAGE_VERSION}:${slug}`;
}

function seedState(): ContentStudioWorkspaceState {
  const now = "2026-08-14T10:00:00.000Z";
  return {
    savedContent: [
      {
        id: "content-cfo-weekly",
        templateId: "mgmt-cfo",
        templateName: "CFO Management Review",
        functionId: "management",
        name: "CFO Weekly Management Call",
        frequency: "Weekly",
        pages: DEFAULT_CFO_MANAGEMENT_PAGES.map((page) => ({ ...page })),
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

function getBucket(slug: string) {
  const key = resolveContentStudioWorkspaceSlug(slug);
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = {
      state: seedState(),
      hydrated: false,
      listeners: new Set(),
    };
    buckets.set(key, bucket);
  }
  return bucket;
}

function ensureHydrated(slug: string) {
  const bucket = getBucket(slug);
  if (bucket.hydrated || typeof window === "undefined") return;
  bucket.hydrated = true;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (raw) {
      const parsed = JSON.parse(raw) as ContentStudioWorkspaceState;
      if (parsed?.savedContent) bucket.state = parsed;
    } else {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(bucket.state));
    }
  } catch {
    /* ignore */
  }
}

function writeState(slug: string, state: ContentStudioWorkspaceState) {
  const bucket = getBucket(slug);
  ensureHydrated(slug);
  bucket.state = state;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    /* ignore */
  }
  bucket.listeners.forEach((listener) => listener());
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function getContentStudioState(slug?: string): ContentStudioWorkspaceState {
  const key = resolveContentStudioWorkspaceSlug(slug);
  ensureHydrated(key);
  return getBucket(key).state;
}

export function getContentStudioServerSnapshot(slug?: string): ContentStudioWorkspaceState {
  return getBucket(resolveContentStudioWorkspaceSlug(slug)).state;
}

export function subscribeContentStudio(slug: string, listener: Listener): () => void {
  const bucket = getBucket(slug);
  bucket.listeners.add(listener);
  return () => bucket.listeners.delete(listener);
}

export type UpsertContentStudioContentInput = {
  id?: string;
  templateId: string;
  templateName: string;
  functionId: ContentStudioFunctionId;
  name: string;
  frequency: string;
  pages: ContentStudioPageConfig[];
  status?: ContentStudioSavedContent["status"];
};

export function upsertContentStudioContent(
  slug: string,
  input: UpsertContentStudioContentInput,
): ContentStudioSavedContent {
  const current = getContentStudioState(slug);
  const existing = input.id
    ? current.savedContent.find((row) => row.id === input.id)
    : undefined;
  const now = nowIso();
  const next: ContentStudioSavedContent = {
    id: existing?.id ?? input.id ?? newId("content"),
    templateId: input.templateId,
    templateName: input.templateName,
    functionId: input.functionId,
    name: input.name.trim(),
    frequency: input.frequency.trim(),
    pages: input.pages.map((page) => ({ ...page })),
    status: input.status ?? existing?.status ?? "active",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const savedContent = existing
    ? current.savedContent.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.savedContent];
  writeState(slug, { savedContent });
  return next;
}

export function duplicateContentStudioContent(slug: string, id: string): ContentStudioSavedContent | null {
  const current = getContentStudioState(slug);
  const source = current.savedContent.find((row) => row.id === id);
  if (!source) return null;
  return upsertContentStudioContent(slug, {
    templateId: source.templateId,
    templateName: source.templateName,
    functionId: source.functionId,
    name: `${source.name} (copy)`,
    frequency: source.frequency,
    pages: source.pages.map((page) => ({ ...page, id: newId("page") })),
  });
}

export function archiveContentStudioContent(slug: string, id: string) {
  const current = getContentStudioState(slug);
  writeState(slug, {
    savedContent: current.savedContent.map((row) =>
      row.id === id ? { ...row, status: "archived", updatedAt: nowIso() } : row,
    ),
  });
}

export function deleteContentStudioContent(slug: string, id: string) {
  const current = getContentStudioState(slug);
  writeState(slug, {
    savedContent: current.savedContent.filter((row) => row.id !== id),
  });
}

export function applyContentStudioAssistantPrompt(
  pages: ContentStudioPageConfig[],
  prompt: string,
): ContentStudioPageConfig[] {
  const lower = prompt.trim().toLowerCase();
  if (!lower) return pages;

  let next = pages.map((page) => ({ ...page }));

  if (lower.includes("remove") && lower.includes("ebitda")) {
    next = next.filter((page) => !page.label.toLowerCase().includes("ebitda"));
  }

  if (
    lower.includes("sales performance") ||
    (lower.includes("add") && lower.includes("sales") && lower.includes("representative"))
  ) {
    if (!next.some((page) => page.label.toLowerCase().includes("sales performance"))) {
      next.push({ id: newId("page"), label: "Sales Performance by Representative", enabled: true });
    }
  }

  if (lower.includes("cash runway") || (lower.includes("add") && lower.includes("forecast"))) {
    if (!next.some((page) => page.label.toLowerCase().includes("forecast"))) {
      next.push({ id: newId("page"), label: "Cash Runway & Forecast", enabled: true });
    }
  }

  if (lower.includes("add page")) {
    const match = CONTENT_STUDIO_PAGE_PRESETS.find((preset) => lower.includes(preset.toLowerCase()));
    if (match && !next.some((page) => page.label === match)) {
      next.push({ id: newId("page"), label: match, enabled: true });
    }
  }

  return next;
}
