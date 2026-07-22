import { NextRequest, NextResponse } from "next/server";

import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  ensureDocPackForCategory,
  listDocPackDocuments,
} from "@/lib/unit311-details-doc-pack-service";
import { parseUnit311DetailCategoryId } from "@/lib/unit311-details-service";
import { findDocPackForCategory } from "@/lib/unit311-details-doc-packs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const scope = { workspaceId: auth.workspace.id };
  const categoryParam = request.nextUrl.searchParams.get("category");
  const categoryId = parseUnit311DetailCategoryId(categoryParam);
  const label = request.nextUrl.searchParams.get("label");
  const sync = request.nextUrl.searchParams.get("sync") === "1";

  if (!categoryId && !label) {
    return NextResponse.json({ error: "category or label is required." }, { status: 400 });
  }

  try {
    const pack = findDocPackForCategory({
      categoryId,
      label,
    });
    if (!pack) {
      return NextResponse.json({ pack: null, documents: [] });
    }

    const resolvedCategoryId = categoryId ?? pack.categoryIds[0]!;
    const result = sync
      ? await ensureDocPackForCategory(resolvedCategoryId, label, label, scope)
      : await listDocPackDocuments(resolvedCategoryId, label, label, scope);

    if (!result) {
      return NextResponse.json({ pack: null, documents: [] });
    }

    return NextResponse.json({
      pack: { id: result.packId, label: result.packLabel },
      documents: result.documents,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load documentation pack";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const scope = { workspaceId: auth.workspace.id };

  try {
    const body = (await request.json()) as { category?: string; label?: string };
    const categoryId = parseUnit311DetailCategoryId(body.category ?? null);
    const label = body.label?.trim() || null;
    const pack = findDocPackForCategory({ categoryId, label });
    if (!pack) {
      return NextResponse.json({ error: "No documentation pack for this section." }, { status: 404 });
    }

    const resolvedCategoryId = categoryId ?? pack.categoryIds[0]!;
    const result = await ensureDocPackForCategory(
      resolvedCategoryId,
      label ?? pack.label,
      label ?? pack.label,
      scope,
    );

    return NextResponse.json({
      ok: true,
      pack: result ? { id: result.packId, label: result.packLabel } : null,
      documentCount: result?.documents.length ?? 0,
      documents: result?.documents ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync documentation pack";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
