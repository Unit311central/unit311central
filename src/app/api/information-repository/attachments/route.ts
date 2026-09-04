import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireInterfaceWorxWorkspaceSession } from "@/lib/interface-worx-information-repository-auth";
import { INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE } from "@/lib/information-repository-profile";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  deleteInformationRepositoryRecordAttachment,
  listInformationRepositoryRecordAttachments,
  parseUnit311DetailCategoryId,
  updateInformationRepositoryRecordAttachment,
} from "@/lib/unit311-details-service";

export const dynamic = "force-dynamic";

const PROFILE = INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE;

export async function GET(request: NextRequest) {
  const auth = await requireInterfaceWorxWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const categoryId = parseUnit311DetailCategoryId(request.nextUrl.searchParams.get("category"));
  if (!categoryId) {
    return NextResponse.json({ error: "Valid category is required." }, { status: 400 });
  }

  try {
    const scope = { workspaceId: auth.workspace.id };
    const payload = await listInformationRepositoryRecordAttachments(categoryId, scope, PROFILE);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load attachments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireInterfaceWorxWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      category?: string;
      fileId?: string;
      caption?: string;
      displayName?: string;
    };
    const categoryId = parseUnit311DetailCategoryId(body.category ?? null);
    const fileId = body.fileId?.trim();
    if (!categoryId || !fileId) {
      return NextResponse.json({ error: "Category and fileId are required." }, { status: 400 });
    }

    const scope = { workspaceId: auth.workspace.id };
    const attachment = await updateInformationRepositoryRecordAttachment(
      categoryId,
      fileId,
      {
        caption: typeof body.caption === "string" ? body.caption : undefined,
        displayName: typeof body.displayName === "string" ? body.displayName : undefined,
      },
      scope,
      PROFILE,
    );
    return NextResponse.json({ attachment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update attachment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireInterfaceWorxWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const categoryId = parseUnit311DetailCategoryId(request.nextUrl.searchParams.get("category"));
  const fileId = request.nextUrl.searchParams.get("fileId")?.trim();
  if (!categoryId || !fileId) {
    return NextResponse.json({ error: "Category and fileId are required." }, { status: 400 });
  }

  try {
    const scope = { workspaceId: auth.workspace.id };
    const result = await deleteInformationRepositoryRecordAttachment(
      categoryId,
      fileId,
      scope,
      PROFILE,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete attachment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
