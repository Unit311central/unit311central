import "server-only";

import {
  ensureCoreArchitectureSeeds,
  getArchitectureDiagramBySection,
  listArchitectureDiagrams,
  upsertArchitectureDiagram,
} from "@/lib/architecture-diagram-service";
import {
  ARCHITECTURE_DIAGRAM_CATALOG,
  normalizeArchitectureDiagramDocument,
  type ArchitectureCatalogEntry,
  type ArchitectureDiagramDocument,
  type SystemArchitectureDiagram,
} from "@/lib/architecture-diagram-data";
import { ensureSystemArchitectureDiagramsTable } from "@/lib/internal-db-migrations";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  WOLF_IR_BUILTIN_DIAGRAM_SLUGS,
  WOLF_IR_UNIT311_CANVAS_SLUGS,
  WOLF_IR_WOLF_CATALOG,
  createWolfIrCustomDiagramSlug,
  isWolfIrBuiltinDiagramSlug,
  isWolfIrCustomDiagramSlug,
  isWolfIrManagedDiagramSlug,
  resolveWolfIrSeedDiagram,
  shouldRefreshWolfIrBuiltinDiagram,
} from "@/lib/wolf/wolf-information-repository-architecture-data";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServerClient();
}

function mapRow(row: Record<string, unknown>): SystemArchitectureDiagram {
  return {
    id: String(row.id),
    sectionSlug: String(row.section_slug),
    title: String(row.title),
    diagramJson: normalizeArchitectureDiagramDocument(row.diagram_json),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function getWolfIrUnit311Catalog(): ArchitectureCatalogEntry[] {
  return ARCHITECTURE_DIAGRAM_CATALOG.filter(
    (entry) =>
      WOLF_IR_UNIT311_CANVAS_SLUGS.includes(
        entry.sectionSlug as (typeof WOLF_IR_UNIT311_CANVAS_SLUGS)[number],
      ) || entry.renderer === "tree",
  );
}

export function getWolfIrWolfCatalog(
  existingDiagrams: Array<Pick<SystemArchitectureDiagram, "sectionSlug" | "title">>,
): ArchitectureCatalogEntry[] {
  const builtIn = [...WOLF_IR_WOLF_CATALOG];
  const custom = existingDiagrams
    .filter((diagram) => isWolfIrCustomDiagramSlug(diagram.sectionSlug))
    .map((diagram) => ({
      sectionSlug: diagram.sectionSlug,
      title: diagram.title,
      description: "Custom WOLF architecture diagram",
      navOrder: 1000,
      seedTemplate: "blank" as const,
    }));
  return [...builtIn, ...custom];
}

export async function listWolfIrDiagrams(): Promise<SystemArchitectureDiagram[]> {
  await ensureSystemArchitectureDiagramsTable().catch(() => false);
  const all = await listArchitectureDiagrams();
  return all.filter((diagram) => isWolfIrManagedDiagramSlug(diagram.sectionSlug));
}

export async function getWolfIrDiagramBySection(
  sectionSlug: string,
): Promise<SystemArchitectureDiagram | null> {
  const slug = sectionSlug.trim().toLowerCase();
  if (!isWolfIrManagedDiagramSlug(slug)) return null;

  const existing = await getArchitectureDiagramBySection(slug);
  if (existing) {
    if (shouldRefreshWolfIrBuiltinDiagram(slug, existing.diagramJson)) {
      const catalog = WOLF_IR_WOLF_CATALOG.find((entry) => entry.sectionSlug === slug);
      const diagramJson = resolveWolfIrSeedDiagram(slug);
      return upsertArchitectureDiagram({
        sectionSlug: slug,
        title: catalog?.title ?? existing.title,
        diagramJson,
      });
    }
    return existing;
  }

  if (isWolfIrBuiltinDiagramSlug(slug)) {
    const catalog = WOLF_IR_WOLF_CATALOG.find((entry) => entry.sectionSlug === slug);
    const diagramJson = resolveWolfIrSeedDiagram(slug);
    return upsertArchitectureDiagram({
      sectionSlug: slug,
      title: catalog?.title ?? slug,
      diagramJson,
    });
  }

  return null;
}

export async function ensureWolfIrBuiltinSeeds(): Promise<SystemArchitectureDiagram[]> {
  const diagrams = await Promise.all(
    WOLF_IR_BUILTIN_DIAGRAM_SLUGS.map(async (slug) => {
      const diagram = await getWolfIrDiagramBySection(slug);
      if (!diagram) {
        throw new Error(`Failed to seed WOLF architecture diagram: ${slug}`);
      }
      return diagram;
    }),
  );
  return diagrams;
}

export async function ensureWolfIrUnit311Seeds(): Promise<void> {
  await ensureCoreArchitectureSeeds();
}

export async function createWolfIrCustomDiagram(input: {
  title: string;
}): Promise<SystemArchitectureDiagram> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Diagram title is required.");
  }
  const sectionSlug = createWolfIrCustomDiagramSlug(title);
  const diagramJson = resolveWolfIrSeedDiagram(sectionSlug);
  return upsertArchitectureDiagram({
    sectionSlug,
    title,
    diagramJson,
  });
}

export async function updateWolfIrDiagram(input: {
  sectionSlug: string;
  title?: string;
  diagramJson?: ArchitectureDiagramDocument | unknown;
}): Promise<SystemArchitectureDiagram> {
  const sectionSlug = input.sectionSlug.trim().toLowerCase();
  if (!isWolfIrManagedDiagramSlug(sectionSlug)) {
    throw new Error("Diagram is not part of the WOLF Information Repository architecture set.");
  }

  const existing = await getWolfIrDiagramBySection(sectionSlug);
  if (!existing) {
    throw new Error("Diagram not found.");
  }

  return upsertArchitectureDiagram({
    sectionSlug,
    title: input.title?.trim() || existing.title,
    diagramJson: input.diagramJson ?? existing.diagramJson,
  });
}

export async function deleteWolfIrDiagram(sectionSlug: string): Promise<void> {
  const slug = sectionSlug.trim().toLowerCase();
  if (!isWolfIrCustomDiagramSlug(slug)) {
    throw new Error("Only custom WOLF architecture diagrams can be deleted.");
  }

  await ensureSystemArchitectureDiagramsTable().catch(() => false);
  const supabase = requireSupabase();
  const { error } = await supabase.from("system_architecture_diagrams").delete().eq("section_slug", slug);
  if (error) throw new Error(error.message);
}

export async function renameWolfIrDiagram(input: {
  sectionSlug: string;
  title: string;
}): Promise<SystemArchitectureDiagram> {
  const sectionSlug = input.sectionSlug.trim().toLowerCase();
  const title = input.title.trim();
  if (!title) throw new Error("Diagram title is required.");
  if (!isWolfIrManagedDiagramSlug(sectionSlug)) {
    throw new Error("Diagram is not part of the WOLF Information Repository architecture set.");
  }

  const existing = await getWolfIrDiagramBySection(sectionSlug);
  if (!existing) throw new Error("Diagram not found.");

  return upsertArchitectureDiagram({
    sectionSlug,
    title,
    diagramJson: existing.diagramJson,
  });
}
