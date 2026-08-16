import "server-only";

import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";

import { getPlatformSession } from "@/lib/platform-session";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { isDemoAdminUsername } from "@/lib/demo/read-only";
import {
  DEMO_PREVIEW_COOKIE,
  DEMO_PREVIEW_HEADER,
  DEMO_WORKSPACE_SLUG,
  normalizeDemoPreviewSlug,
  type DemoPreviewWorkspaceSlug,
} from "@/lib/demo/workspace-preview";

export function readDemoPreviewSlugFromRequest(request: NextRequest): DemoPreviewWorkspaceSlug | null {
  const raw =
    request.cookies.get(DEMO_PREVIEW_COOKIE)?.value ??
    request.headers.get(DEMO_PREVIEW_HEADER);
  return normalizeDemoPreviewSlug(raw);
}

export async function resolveDemoPreviewSlug(): Promise<DemoPreviewWorkspaceSlug> {
  if (!(await isDemoApiRequest())) return DEMO_WORKSPACE_SLUG;

  const session = await getPlatformSession();
  if (!isDemoAdminUsername(session?.username)) return DEMO_WORKSPACE_SLUG;

  const requestHeaders = await headers();
  const headerSlug = requestHeaders.get(DEMO_PREVIEW_HEADER);
  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(DEMO_PREVIEW_COOKIE)?.value;
  return normalizeDemoPreviewSlug(headerSlug ?? cookieSlug) ?? DEMO_WORKSPACE_SLUG;
}
