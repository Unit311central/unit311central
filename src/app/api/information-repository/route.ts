import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireInterfaceWorxWorkspaceSession } from "@/lib/interface-worx-information-repository-auth";
import { INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE } from "@/lib/information-repository-profile";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getUnit311DetailsOverview,
  loadUnit311DetailContent,
  parseUnit311DetailCategoryId,
  saveUnit311DetailContent,
  saveUnit311DetailTasks,
} from "@/lib/unit311-details-service";
import type { Unit311DetailTask } from "@/lib/unit311-details-data";

export const dynamic = "force-dynamic";

const PROFILE = INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE;

export async function GET(request: NextRequest) {
  const auth = await requireInterfaceWorxWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const scope = { workspaceId: auth.workspace.id };

  try {
    const categoryId = parseUnit311DetailCategoryId(request.nextUrl.searchParams.get("category"));

    if (categoryId) {
      const detail = await loadUnit311DetailContent(categoryId, scope, PROFILE);
      return NextResponse.json(detail);
    }

    const overview = await getUnit311DetailsOverview(scope, PROFILE);
    return NextResponse.json(overview);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Information Repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireInterfaceWorxWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const scope = { workspaceId: auth.workspace.id };

  try {
    const body = (await request.json()) as {
      category?: string;
      content?: string;
      tasks?: Unit311DetailTask[];
    };
    const categoryId = body.category?.trim() ?? null;

    if (!categoryId) {
      return NextResponse.json({ error: "Valid category is required." }, { status: 400 });
    }

    if (Array.isArray(body.tasks)) {
      const saved = await saveUnit311DetailTasks(categoryId, body.tasks, scope, PROFILE);
      return NextResponse.json(saved);
    }

    if (typeof body.content !== "string") {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    const saved = await saveUnit311DetailContent(categoryId, body.content, scope, PROFILE);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save Information Repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
