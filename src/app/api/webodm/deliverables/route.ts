import { NextRequest, NextResponse } from "next/server";

import { BRIGHTON_BEACH_TASK_NAME } from "@/lib/webodm-deliverables";
import { fetchAerialIntelligenceWorkspace, isWebODMConfigured } from "@/lib/webodm-client";
import { getPublicWebODMUrl } from "@/lib/webodm-env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const taskName = request.nextUrl.searchParams.get("task")?.trim() || BRIGHTON_BEACH_TASK_NAME;

  if (!isWebODMConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        dashboardUrl: getPublicWebODMUrl(),
        error: "WebODM is not configured.",
        mission: null,
        orthophoto: null,
        dsm: null,
        dsmGeotiffUrl: null,
        modelGlbUrl: null,
        reportPdfUrl: null,
        hasPointCloud: false,
      },
      { status: 503 },
    );
  }

  try {
    const workspace = await fetchAerialIntelligenceWorkspace(taskName);

    return NextResponse.json({
      configured: true,
      dashboardUrl: getPublicWebODMUrl(),
      ...workspace,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load aerial intelligence workspace";

    return NextResponse.json(
      {
        configured: true,
        dashboardUrl: getPublicWebODMUrl(),
        error: message,
        mission: null,
        orthophoto: null,
        dsm: null,
        dsmGeotiffUrl: null,
        modelGlbUrl: null,
        reportPdfUrl: null,
        hasPointCloud: false,
      },
      { status: 502 },
    );
  }
}
