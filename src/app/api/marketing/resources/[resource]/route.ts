import { NextResponse } from "next/server";

import {
  handleMarketingResourceDelete,
  handleMarketingResourceGet,
  handleMarketingResourcePost,
} from "../../_lib/marketing-resource-handlers";
import { withMarketingApiAuth } from "../../_lib/with-marketing-api-auth";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ resource: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { resource } = await params;
  return withMarketingApiAuth(({ workspaceId, workspaceSlug }) =>
    handleMarketingResourceGet(resource, workspaceId, workspaceSlug),
  );
}

export async function POST(request: Request, { params }: RouteParams) {
  const { resource } = await params;
  const payload = (await request.json()) as Record<string, unknown>;
  return withMarketingApiAuth(({ workspaceId, workspaceSlug }) =>
    handleMarketingResourcePost(resource, workspaceId, workspaceSlug, payload),
  );
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { resource } = await params;
  const url = new URL(_request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query parameter required" }, { status: 400 });
  }
  return withMarketingApiAuth(({ workspaceId, workspaceSlug }) =>
    handleMarketingResourceDelete(resource, id, workspaceId, workspaceSlug),
  );
}
