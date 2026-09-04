import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  ensureCoreArchitectureSeeds,
  getArchitectureDiagramBySection,
  upsertArchitectureDiagram,
} from "@/lib/architecture-diagram-service";
import type { ArchitectureCatalogEntry } from "@/lib/architecture-diagram-data";
import { buildArchitectureTaxonomy } from "@/lib/architecture-taxonomy";
import { isArchitectureTreeSlug } from "@/lib/architecture-taxonomy-types";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireWolfInformationRepositoryArchitectureSession } from "@/lib/wolf/wolf-information-repository-architecture-auth";
import {
  WOLF_IR_UNIT311_CANVAS_SLUGS,
  isWolfIrManagedDiagramSlug,
} from "@/lib/wolf/wolf-information-repository-architecture-data";
import {
  createWolfIrCustomDiagram,
  deleteWolfIrDiagram,
  ensureWolfIrBuiltinSeeds,
  ensureWolfIrUnit311Seeds,
  getWolfIrDiagramBySection,
  getWolfIrUnit311Catalog,
  getWolfIrWolfCatalog,
  listWolfIrDiagrams,
  renameWolfIrDiagram,
  updateWolfIrDiagram,
} from "@/lib/wolf/wolf-information-repository-architecture-service";

export const dynamic = "force-dynamic";

type ArchitectureScope = "unit311" | "wolf";

function parseScope(value: string | null): ArchitectureScope | null {
  if (value === "unit311" || value === "wolf") return value;
  return null;
}

export async function GET(request: NextRequest) {
  const auth = await requireWolfInformationRepositoryArchitectureSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const sectionSlug = request.nextUrl.searchParams.get("section")?.trim().toLowerCase();
    const includeCatalog = request.nextUrl.searchParams.get("catalog") === "1";
    const scope = parseScope(request.nextUrl.searchParams.get("scope"));

    if (scope === "unit311") {
      if (sectionSlug && isArchitectureTreeSlug(sectionSlug)) {
        const workspace = request.nextUrl.searchParams.get("workspace");
        const taxonomy = buildArchitectureTaxonomy(sectionSlug, { workspace });
        return NextResponse.json({
          taxonomy,
          renderer: "tree",
          ...(includeCatalog ? { catalog: getWolfIrUnit311Catalog() } : {}),
        });
      }

      await ensureWolfIrUnit311Seeds();

      if (!sectionSlug) {
        const diagrams = await Promise.all(
          WOLF_IR_UNIT311_CANVAS_SLUGS.map((slug) => getArchitectureDiagramBySection(slug)),
        );
        return NextResponse.json({
          diagrams: diagrams.filter((diagram) => diagram != null),
          ...(includeCatalog ? { catalog: getWolfIrUnit311Catalog() } : {}),
        });
      }

      if (
        WOLF_IR_UNIT311_CANVAS_SLUGS.includes(
          sectionSlug as (typeof WOLF_IR_UNIT311_CANVAS_SLUGS)[number],
        )
      ) {
        const diagram = await getArchitectureDiagramBySection(sectionSlug);
        return NextResponse.json({
          diagram,
          ...(includeCatalog ? { catalog: getWolfIrUnit311Catalog() } : {}),
        });
      }

      return NextResponse.json(
        { error: "Unknown Unit311 architecture diagram." },
        { status: 404 },
      );
    }

    if (scope === "wolf") {
      await ensureWolfIrBuiltinSeeds();
      const wolfDiagrams = await listWolfIrDiagrams();

      if (!sectionSlug) {
        return NextResponse.json({
          diagrams: wolfDiagrams,
          ...(includeCatalog ? { catalog: getWolfIrWolfCatalog(wolfDiagrams) } : {}),
        });
      }

      if (!isWolfIrManagedDiagramSlug(sectionSlug)) {
        return NextResponse.json({ error: "Unknown WOLF architecture diagram." }, { status: 404 });
      }

      const diagram = await getWolfIrDiagramBySection(sectionSlug);
      return NextResponse.json({
        diagram,
        ...(includeCatalog ? { catalog: getWolfIrWolfCatalog(wolfDiagrams) } : {}),
      });
    }

    await ensureCoreArchitectureSeeds();
    await ensureWolfIrBuiltinSeeds();

    const [unit311Diagrams, wolfDiagrams] = await Promise.all([
      Promise.all(WOLF_IR_UNIT311_CANVAS_SLUGS.map((slug) => getArchitectureDiagramBySection(slug))),
      listWolfIrDiagrams(),
    ]);

    return NextResponse.json({
      unit311: {
        diagrams: unit311Diagrams.filter((diagram) => diagram != null),
        catalog: getWolfIrUnit311Catalog(),
      },
      wolf: {
        diagrams: wolfDiagrams,
        catalog: getWolfIrWolfCatalog(wolfDiagrams),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load architecture diagrams.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireWolfInformationRepositoryArchitectureSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      scope?: ArchitectureScope;
      title?: string;
      sectionSlug?: string;
      diagramJson?: unknown;
      seedTemplate?: ArchitectureCatalogEntry["seedTemplate"];
    };

    const scope = parseScope(body.scope ?? null);
    if (scope !== "wolf") {
      return NextResponse.json(
        { error: "Only WOLF-scope diagrams can be created from this endpoint." },
        { status: 400 },
      );
    }

    if (body.sectionSlug && body.diagramJson !== undefined) {
      const diagram = await updateWolfIrDiagram({
        sectionSlug: body.sectionSlug,
        title: body.title,
        diagramJson: body.diagramJson,
      });
      return NextResponse.json({ diagram });
    }

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }

    const diagram = await createWolfIrCustomDiagram({ title });
    return NextResponse.json({ diagram });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create architecture diagram.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireWolfInformationRepositoryArchitectureSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      scope?: ArchitectureScope;
      sectionSlug?: string;
      title?: string;
      diagramJson?: unknown;
      renameOnly?: boolean;
    };

    const scope = parseScope(body.scope ?? null);
    const sectionSlug = body.sectionSlug?.trim().toLowerCase();
    if (!sectionSlug) {
      return NextResponse.json({ error: "sectionSlug is required." }, { status: 400 });
    }

    if (scope === "unit311") {
      if (
        !WOLF_IR_UNIT311_CANVAS_SLUGS.includes(
          sectionSlug as (typeof WOLF_IR_UNIT311_CANVAS_SLUGS)[number],
        )
      ) {
        return NextResponse.json({ error: "Unknown Unit311 architecture diagram." }, { status: 404 });
      }
      if (body.diagramJson === undefined) {
        return NextResponse.json({ error: "diagramJson is required." }, { status: 400 });
      }
      await ensureWolfIrUnit311Seeds();
      const diagram = await upsertArchitectureDiagram({
        sectionSlug,
        title: body.title?.trim() || `${sectionSlug} Architecture`,
        diagramJson: body.diagramJson,
      });
      return NextResponse.json({ diagram });
    }

    if (body.renameOnly) {
      const title = body.title?.trim();
      if (!title) {
        return NextResponse.json({ error: "title is required for rename." }, { status: 400 });
      }
      const diagram = await renameWolfIrDiagram({ sectionSlug, title });
      return NextResponse.json({ diagram });
    }

    if (body.diagramJson === undefined) {
      return NextResponse.json({ error: "diagramJson is required." }, { status: 400 });
    }

    const diagram = await updateWolfIrDiagram({
      sectionSlug,
      title: body.title,
      diagramJson: body.diagramJson,
    });
    return NextResponse.json({ diagram });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update architecture diagram.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireWolfInformationRepositoryArchitectureSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const sectionSlug =
      request.nextUrl.searchParams.get("section")?.trim().toLowerCase() ??
      ((await request.json().catch(() => ({}))) as { sectionSlug?: string }).sectionSlug
        ?.trim()
        .toLowerCase();

    if (!sectionSlug) {
      return NextResponse.json({ error: "sectionSlug is required." }, { status: 400 });
    }

    await deleteWolfIrDiagram(sectionSlug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete architecture diagram.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
