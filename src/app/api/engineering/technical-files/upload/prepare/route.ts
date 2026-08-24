import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import {
  technicalFileActor,
  technicalFileErrorResponse,
} from "@/lib/engineering-technical-files/api-helpers";
import { prepareTechnicalFileUpload } from "@/lib/engineering-technical-files/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const body = (await request.json()) as Record<string, unknown>;
    const result = await prepareTechnicalFileUpload(
      {
        fileName: String(body.fileName ?? ""),
        sizeBytes: Number(body.sizeBytes ?? 0),
        technicalFileId:
          typeof body.technicalFileId === "string" ? body.technicalFileId : undefined,
      },
      technicalFileActor(session),
    );
    return NextResponse.json(result);
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to prepare upload.");
  }
}
