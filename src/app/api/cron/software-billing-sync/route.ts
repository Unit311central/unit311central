import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_WORKSPACE_SLUG, findWorkspaceBySlug } from "@/lib/workspace-host";
import { syncVercelSoftwareBilling } from "@/lib/software-billing/vercel-sync";
import { isVercelBillingConfigured } from "@/lib/software-billing/vercel-config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const setupSecret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  const allowed =
    (cronSecret && auth === `Bearer ${cronSecret}`) ||
    (setupSecret && auth === `Bearer ${setupSecret}`);

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isVercelBillingConfigured()) {
    return NextResponse.json(
      { ok: false, error: "VERCEL_API_TOKEN is not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const workspace = await findWorkspaceBySlug(INTERNAL_WORKSPACE_SLUG);
    if (!workspace?.id) {
      return NextResponse.json({ ok: false, error: "Internal workspace not found." }, { status: 404 });
    }
    const result = await syncVercelSoftwareBilling(workspace.id);
    return NextResponse.json({ workspace: INTERNAL_WORKSPACE_SLUG, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Sync failed." },
      { status: 500 },
    );
  }
}
