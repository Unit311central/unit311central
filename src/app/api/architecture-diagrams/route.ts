import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  createArchitectureDiagramForSection,
  ensureCoreArchitectureSeeds,
  getArchitectureCatalog,
  getArchitectureDiagramBySection,
  listArchitectureDiagrams,
  upsertArchitectureDiagram,
} from "@/lib/architecture-diagram-service";
import type { ArchitectureCatalogEntry } from "@/lib/architecture-diagram-data";
import { buildArchitectureTaxonomy } from "@/lib/architecture-taxonomy";
import { isArchitectureTreeSlug } from "@/lib/architecture-taxonomy-types";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { isCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

async function requireSession() {
  if (await isDemoApiRequest()) {
    return { session: { sub: "demo", username: "demo@unit311central.com", displayName: "Demo", userType: "internal" as const, exp: 0 } };
  }
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  return { session };
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const auth = await requireSession();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const sectionSlug = request.nextUrl.searchParams.get("section")?.trim().toLowerCase();
    const includeCatalog = request.nextUrl.searchParams.get("catalog") === "1";

    let customerWorkspace = false;
    if (!await isDemoApiRequest()) {
      try {
        const workspace = await requireCurrentWorkspace();
        customerWorkspace = isCustomerWorkspaceSlug(workspace.slug);
      } catch {
        customerWorkspace = false;
      }
    }

    // Living hierarchy (tree) views are derived server-side from existing sources —
    // no diagram document, no seeds, no DB read/write.
    if (sectionSlug && isArchitectureTreeSlug(sectionSlug)) {
      const workspace = request.nextUrl.searchParams.get("workspace");
      const taxonomy = buildArchitectureTaxonomy(sectionSlug, { workspace });
      return NextResponse.json({
        taxonomy,
        renderer: "tree",
        ...(includeCatalog ? { catalog: getArchitectureCatalog() } : {}),
      });
    }

    if (customerWorkspace) {
      if (!sectionSlug) {
        return NextResponse.json({
          diagrams: [],
          ...(includeCatalog ? { catalog: getArchitectureCatalog() } : {}),
        });
      }
      return NextResponse.json({
        diagram: null,
        ...(includeCatalog ? { catalog: getArchitectureCatalog() } : {}),
      });
    }

    // Ensure table + core seeds exist before serving the knowledge centre.
    await ensureCoreArchitectureSeeds();

    if (!sectionSlug) {
      const diagrams = await listArchitectureDiagrams();
      return NextResponse.json({
        diagrams,
        ...(includeCatalog ? { catalog: getArchitectureCatalog() } : {}),
      });
    }

    const diagram = await getArchitectureDiagramBySection(sectionSlug);
    return NextResponse.json({
      diagram,
      ...(includeCatalog ? { catalog: getArchitectureCatalog() } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load architecture diagram.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const auth = await requireSession();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      sectionSlug?: string;
      title?: string;
      useStorageTemplate?: boolean;
      usePlatformOverviewTemplate?: boolean;
      seedTemplate?: ArchitectureCatalogEntry["seedTemplate"];
      diagramJson?: unknown;
    };

    const sectionSlug = body.sectionSlug?.trim().toLowerCase();
    if (!sectionSlug) {
      return NextResponse.json({ error: "sectionSlug is required." }, { status: 400 });
    }

    if (body.diagramJson) {
      const diagram = await upsertArchitectureDiagram({
        sectionSlug,
        title: body.title?.trim() || `${sectionSlug} Architecture`,
        diagramJson: body.diagramJson,
      });
      return NextResponse.json({ diagram });
    }

    const diagram = await createArchitectureDiagramForSection({
      sectionSlug,
      title: body.title,
      useStorageTemplate: body.useStorageTemplate,
      usePlatformOverviewTemplate: body.usePlatformOverviewTemplate,
      seedTemplate: body.seedTemplate,
    });
    return NextResponse.json({ diagram });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create architecture diagram.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const auth = await requireSession();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      sectionSlug?: string;
      title?: string;
      diagramJson?: unknown;
    };

    const sectionSlug = body.sectionSlug?.trim().toLowerCase();
    if (!sectionSlug || body.diagramJson === undefined) {
      return NextResponse.json(
        { error: "sectionSlug and diagramJson are required." },
        { status: 400 },
      );
    }

    const diagram = await upsertArchitectureDiagram({
      sectionSlug,
      title: body.title?.trim() || `${sectionSlug} Architecture`,
      diagramJson: body.diagramJson,
    });
    return NextResponse.json({ diagram });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update architecture diagram.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
