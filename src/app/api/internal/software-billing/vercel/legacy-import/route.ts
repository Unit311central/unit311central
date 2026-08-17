import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireInternalSoftwareBillingAccess } from "@/lib/software-billing/internal-api-auth";
import {
  previewVercelLegacyImport,
  runVercelLegacyImport,
} from "@/lib/software-billing/vercel-legacy-import";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireInternalSoftwareBillingAccess(request);
  if ("error" in auth) return auth.error;

  const dryRun = request.nextUrl.searchParams.get("dryRun") !== "false";

  try {
    const report = dryRun
      ? await previewVercelLegacyImport(auth.workspaceId)
      : await runVercelLegacyImport(auth.workspaceId, { dryRun: false });
    return NextResponse.json({ dryRun, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vercel legacy import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
