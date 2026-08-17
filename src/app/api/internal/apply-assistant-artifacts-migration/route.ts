import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  ASSISTANT_ARTIFACTS_STORAGE_MIGRATION_PATH,
  ensureAssistantArtifactStorage,
  reloadPostgrestSchema,
} from "@/lib/internal-db-migrations";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-setup-secret") === secret;
}

/** One-shot: assistant artifact storage bucket + assistant_artifact_records table. */
export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applied = await ensureAssistantArtifactStorage();
    await reloadPostgrestSchema();
    return NextResponse.json({
      ok: true,
      applied,
      migration: ASSISTANT_ARTIFACTS_STORAGE_MIGRATION_PATH,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to apply assistant artifacts migration.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
