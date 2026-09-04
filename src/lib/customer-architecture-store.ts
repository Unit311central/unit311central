/**
 * Workspace-owned architecture diagram records for generic customer tenants.
 */

import { readBrowserCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { GREENDESERT_ARCHITECTURE_DIAGRAMS } from "@/lib/greendesert/greendesert-architecture-diagrams-data";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";

export type CustomerArchitectureDiagram = {
  id: string;
  title: string;
  slug: string;
  description: string;
  notes: string;
};

type Listener = () => void;

const STORAGE_VERSION = "v1";
const buckets = new Map<string, CustomerArchitectureDiagram[]>();
const listeners = new Set<Listener>();

function storageKey(slug: string) {
  return `unit311-customer-architecture-${STORAGE_VERSION}:${slug}`;
}

function readPersisted(slug: string): CustomerArchitectureDiagram[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerArchitectureDiagram[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persist(slug: string, rows: CustomerArchitectureDiagram[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

function seedGreenDesertArchitectureIfNeeded(slug: string, rows: CustomerArchitectureDiagram[]) {
  if (slug !== GREENDESERT_SLUG || rows.length > 0) return rows;
  const seeded = GREENDESERT_ARCHITECTURE_DIAGRAMS.map((diagram, index) => ({
    id: `gd-arch-${index + 1}`,
    title: diagram.title,
    slug: diagram.slug,
    description: diagram.description,
    notes: diagram.notes,
  }));
  buckets.set(slug, seeded);
  persist(slug, seeded);
  return seeded;
}

function getRows(slug?: string | null): CustomerArchitectureDiagram[] {
  const key = slug?.trim() || readBrowserCustomerWorkspaceSlug() || "default";
  const cached = buckets.get(key);
  if (cached) return cached.map((row) => ({ ...row }));
  const initial = seedGreenDesertArchitectureIfNeeded(
    key,
    (readPersisted(key) ?? []).map((row) => ({ ...row })),
  );
  buckets.set(key, initial);
  return initial.map((row) => ({ ...row }));
}

function writeRows(slug: string | null | undefined, rows: CustomerArchitectureDiagram[]) {
  const key = slug?.trim() || readBrowserCustomerWorkspaceSlug() || "default";
  buckets.set(key, rows.map((row) => ({ ...row })));
  persist(key, rows);
  for (const listener of listeners) listener();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function subscribeCustomerArchitecture(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCustomerArchitectureSnapshot(slug?: string | null) {
  return getRows(slug);
}

export function upsertCustomerArchitectureDiagram(
  input: Omit<CustomerArchitectureDiagram, "id"> & { id?: string },
  slug?: string | null,
) {
  const rows = getRows(slug);
  const row: CustomerArchitectureDiagram = {
    id: input.id ?? uid("diagram"),
    title: input.title.trim(),
    slug: input.slug.trim() || input.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: input.description.trim(),
    notes: input.notes.trim(),
  };
  const next = rows.some((item) => item.id === row.id)
    ? rows.map((item) => (item.id === row.id ? row : item))
    : [row, ...rows];
  writeRows(slug, next);
  return row;
}

export function deleteCustomerArchitectureDiagram(id: string, slug?: string | null) {
  writeRows(
    slug,
    getRows(slug).filter((row) => row.id !== id),
  );
}
