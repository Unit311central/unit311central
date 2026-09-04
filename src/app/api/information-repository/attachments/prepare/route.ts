import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireInterfaceWorxWorkspaceSession } from "@/lib/interface-worx-information-repository-auth";
import { INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE } from "@/lib/information-repository-profile";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  parseUnit311DetailCategoryId,
  prepareInformationRepositoryRecordAttachmentUpload,
} from "@/lib/unit311-details-service";

export const dynamic = "force-dynamic";

const PROFILE = INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE;

export async function POST(request: NextRequest) {
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
      name?: string;
      size?: number;
    };
    const categoryId = parseUnit311DetailCategoryId(body.category ?? null);
    const name = body.name?.trim() ?? "";
    const size = Number(body.size ?? 0);
    if (!categoryId || !name || !size) {
      return NextResponse.json({ error: "Category, name, and size are required." }, { status: 400 });
    }

    const scope = { workspaceId: auth.workspace.id };
    const upload = await prepareInformationRepositoryRecordAttachmentUpload(
      categoryId,
      name,
      size,
      scope,
      PROFILE,
    );
    return NextResponse.json(upload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
