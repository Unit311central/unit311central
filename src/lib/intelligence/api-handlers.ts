import { NextRequest, NextResponse } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getPlatformSession } from "@/lib/platform-session";
import { getCurrentWorkspace } from "@/lib/workspace-context";
import type { IntelligenceServiceAccess } from "@/lib/intelligence/provider";
import {
  buildIntelligenceBriefing,
  getIntelligenceRecord,
  listIntelligenceSources,
  searchIntelligenceRecords,
} from "@/lib/intelligence/provider";
import {
  getIntelligencePackBySlug,
  listIntelligenceDomainsForWorkspace,
} from "@/lib/intelligence/registry";
import {
  resolveIntelligenceHostSurface,
  resolveIntelligencePackSlugForWorkspace,
  resolveIntelligenceWorkspaceSlugFromHost,
} from "@/lib/intelligence/workspace-context";
import type { IntelligenceFilter, IntelligenceSeverity } from "@/lib/intelligence/types";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function unauthorized() {
  return json({ error: "Authentication required." }, 401);
}

async function requireIntelligenceSession(request: NextRequest) {
  if (await isDemoApiRequest()) return true;
  const session = await getPlatformSession();
  return Boolean(session);
}

async function resolveWorkspaceSlug(
  request: NextRequest,
  override?: string,
): Promise<string | null> {
  if (override) {
    return resolveIntelligencePackSlugForWorkspace(override);
  }

  const workspace = await getCurrentWorkspace();
  if (workspace) {
    return resolveIntelligencePackSlugForWorkspace(workspace.slug);
  }

  return resolveIntelligenceWorkspaceSlugFromHost(getRequestHost(request));
}

async function buildAccessContext(
  request: NextRequest,
  workspaceSlug: string,
): Promise<IntelligenceServiceAccess | undefined> {
  const session = await getPlatformSession();
  if (!session) {
    if (await isDemoApiRequest()) {
      return {
        roleView: "admin",
        hostSurface: resolveIntelligenceHostSurface(workspaceSlug),
        isExternal: false,
        isAdmin: true,
      };
    }
    return undefined;
  }
  return {
    roleView: "admin",
    hostSurface: resolveIntelligenceHostSurface(workspaceSlug),
    isExternal: session.userType === "external",
    isAdmin: session.userType === "internal",
  };
}

export async function handleListIntelligenceDomains(
  request: NextRequest,
  workspaceSlugOverride?: string,
) {
  const workspaceSlug = await resolveWorkspaceSlug(request, workspaceSlugOverride);
  if (!workspaceSlug) {
    return json({ error: "Intelligence not available for this workspace." }, 404);
  }

  const pack = getIntelligencePackBySlug(workspaceSlug);
  if (!pack) {
    return json({ error: "No intelligence pack for this workspace." }, 404);
  }

  const sessionOk = await requireIntelligenceSession(request);
  if (!sessionOk) return unauthorized();

  return json({
    workspaceSlug: pack.slug,
    label: pack.label,
    domains: listIntelligenceDomainsForWorkspace(pack.slug),
    uiViews: pack.uiViews ?? [],
  });
}

export async function handleSearchIntelligenceRecords(
  request: NextRequest,
  workspaceSlugOverride?: string,
) {
  const workspaceSlug = await resolveWorkspaceSlug(request, workspaceSlugOverride);
  if (!workspaceSlug) {
    return json({ error: "Intelligence not available for this workspace." }, 404);
  }

  if (!(await requireIntelligenceSession(request))) return unauthorized();

  const params = request.nextUrl.searchParams;
  const domainId = params.get("domainId")?.trim();
  if (!domainId) {
    return json({ error: "domainId is required." }, 400);
  }

  const filter: IntelligenceFilter = {
    domainIds: [domainId],
    search: params.get("search")?.trim() || undefined,
    severities: params.getAll("severity") as IntelligenceSeverity[],
    tags: params.getAll("tag").length ? params.getAll("tag") : undefined,
  };

  const providerDataRaw = params.get("providerData");
  let data: Record<string, unknown> | undefined;
  if (providerDataRaw) {
    try {
      data = JSON.parse(providerDataRaw) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid providerData JSON." }, 400);
    }
  }

  try {
    const access = await buildAccessContext(request, workspaceSlug);
    const result = await searchIntelligenceRecords(
      {
        workspaceSlug,
        filter,
        limit: Number(params.get("limit") ?? "50"),
        offset: Number(params.get("offset") ?? "0"),
      },
      { access, data },
    );
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    const status = message.includes("INTELLIGENCE_ACCESS_DENIED") ? 403 : 500;
    return json({ error: message }, status);
  }
}

export async function handleGetIntelligenceRecord(
  request: NextRequest,
  recordId: string,
  workspaceSlugOverride?: string,
) {
  const workspaceSlug = await resolveWorkspaceSlug(request, workspaceSlugOverride);
  if (!workspaceSlug) {
    return json({ error: "Intelligence not available for this workspace." }, 404);
  }

  if (!(await requireIntelligenceSession(request))) return unauthorized();

  const domainId = request.nextUrl.searchParams.get("domainId")?.trim();
  if (!domainId) {
    return json({ error: "domainId is required." }, 400);
  }

  try {
    const access = await buildAccessContext(request, workspaceSlug);
    const record = await getIntelligenceRecord(workspaceSlug, domainId, recordId, { access });
    if (!record) return json({ error: "Record not found." }, 404);
    return json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed.";
    const status = message.includes("INTELLIGENCE_ACCESS_DENIED") ? 403 : 500;
    return json({ error: message }, status);
  }
}

export async function handleGetIntelligenceBriefing(
  request: NextRequest,
  workspaceSlugOverride?: string,
) {
  const workspaceSlug = await resolveWorkspaceSlug(request, workspaceSlugOverride);
  if (!workspaceSlug) {
    return json({ error: "Intelligence not available for this workspace." }, 404);
  }

  if (!(await requireIntelligenceSession(request))) return unauthorized();

  const domainId = request.nextUrl.searchParams.get("domainId")?.trim();
  if (!domainId) {
    return json({ error: "domainId is required." }, 400);
  }

  try {
    const access = await buildAccessContext(request, workspaceSlug);
    const briefing = await buildIntelligenceBriefing(workspaceSlug, domainId, { access });
    return json({ briefing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Briefing failed.";
    const status = message.includes("INTELLIGENCE_ACCESS_DENIED") ? 403 : 500;
    return json({ error: message }, status);
  }
}

export async function handleListIntelligenceSources(
  request: NextRequest,
  workspaceSlugOverride?: string,
) {
  const workspaceSlug = await resolveWorkspaceSlug(request, workspaceSlugOverride);
  if (!workspaceSlug) {
    return json({ error: "Intelligence not available for this workspace." }, 404);
  }

  if (!(await requireIntelligenceSession(request))) return unauthorized();

  const domainId = request.nextUrl.searchParams.get("domainId")?.trim();
  if (!domainId) {
    return json({ error: "domainId is required." }, 400);
  }

  try {
    const access = await buildAccessContext(request, workspaceSlug);
    const sources = await listIntelligenceSources(workspaceSlug, domainId, { access });
    return json({ sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sources failed.";
    const status = message.includes("INTELLIGENCE_ACCESS_DENIED") ? 403 : 500;
    return json({ error: message }, status);
  }
}
