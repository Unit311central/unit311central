import { NextRequest, NextResponse } from "next/server";

import {
  technicalFileActor,
  technicalFileErrorResponse,
} from "@/lib/engineering-technical-files/api-helpers";
import type { TechnicalFileStatus } from "@/lib/engineering-technical-files/file-types";
import { addTechnicalFileVersion } from "@/lib/engineering-technical-files/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const file = await addTechnicalFileVersion(
      id,
      {
        fileName: String(body.fileName ?? ""),
        storagePath: String(body.storagePath ?? ""),
        versionId: String(body.versionId ?? ""),
        sizeBytes: Number(body.sizeBytes ?? 0),
        mimeType: typeof body.mimeType === "string" ? body.mimeType : null,
        revision: String(body.revision ?? ""),
        changeNotes: typeof body.changeNotes === "string" ? body.changeNotes : undefined,
        status: typeof body.status === "string" ? (body.status as TechnicalFileStatus) : undefined,
      },
      technicalFileActor(session),
    );
    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to upload new version.");
  }
}
