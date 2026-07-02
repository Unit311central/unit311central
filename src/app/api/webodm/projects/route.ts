import { NextResponse } from "next/server";

import { getPublicWebODMUrl } from "@/lib/webodm-env";
import {
  fetchWebODMProjectsWithTasks,
  getWebODMBaseUrl,
  isWebODMConfigured,
} from "@/lib/webodm-client";

export const dynamic = "force-dynamic";

function webodmConfigError() {
  const missing: string[] = [];

  if (!getWebODMBaseUrl()) {
    missing.push("WEBODM_URL");
  }
  if (!process.env.WEBODM_USERNAME) {
    missing.push("WEBODM_USERNAME");
  }
  if (!process.env.WEBODM_PASSWORD) {
    missing.push("WEBODM_PASSWORD");
  }

  return `Set ${missing.join(", ")} in Vercel Environment Variables (or .env.local for local dev).`;
}

export async function GET() {
  if (!isWebODMConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        dashboardUrl: getPublicWebODMUrl(),
        error: webodmConfigError(),
        projects: [],
      },
      { status: 503 },
    );
  }

  try {
    const projects = await fetchWebODMProjectsWithTasks();

    return NextResponse.json({
      configured: true,
      dashboardUrl: getPublicWebODMUrl(),
      projects,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load WebODM projects";

    return NextResponse.json(
      {
        configured: true,
        dashboardUrl: getPublicWebODMUrl(),
        error: message,
        projects: [],
      },
      { status: 502 },
    );
  }
}
