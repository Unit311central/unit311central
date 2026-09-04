import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireInterfaceWorxWorkspaceSession } from "@/lib/interface-worx-information-repository-auth";
import { INTERFACE_WORX_INFORMATION_REPOSITORY_PROFILE } from "@/lib/information-repository-profile";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  completeInformationRepositoryRecordAttachmentUpload,
  parseUnit311DetailCategoryId,
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
      storagePath?: string;
      mimeType?: string | null;
      size?: number;
      caption?: string;
    };
    const categoryId = parseUnit311DetailCategoryId(body.category ?? null);
    const name = body.name?.trim() ?? "";
    const storagePath = body.storagePath?.trim() ?? "";
    const size = Number(body.size ?? 0);
    if (!categoryId || !name || !storagePath || !size) {
      return NextResponse.json(
        { error: "Category, name, storagePath, and size are required." },
        { status: 400 },
      );
    }

    const scope = { workspaceId: auth.workspace.id };
    const attachment = await completeInformationRepositoryRecordAttachmentUpload(
      categoryId,
      {
        name,
        storagePath,
        mimeType: typeof body.mimeType === "string" ? body.mimeType : null,
        size,
        caption: typeof body.caption === "string" ? body.caption : undefined,
      },
      scope,
      PROFILE,
    );
    return NextResponse.json({ attachment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
