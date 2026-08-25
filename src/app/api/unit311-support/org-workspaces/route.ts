import { NextResponse } from "next/server";

import {
  requireCustomerUnit311SupportApiContext,
  unit311SupportErrorResponse,
} from "@/lib/unit311-support/api-helpers";
import { listOrganisationWorkspacesForSupport } from "@/lib/unit311-support/org-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await requireCustomerUnit311SupportApiContext();
    const workspaces = await listOrganisationWorkspacesForSupport(ctx.organisationId);
    const withCurrent = workspaces.some((item) => item.id === ctx.workspace.id)
      ? workspaces
      : [
          { id: ctx.workspace.id, name: ctx.workspace.name, slug: ctx.workspace.slug },
          ...workspaces,
        ];
    return NextResponse.json({ workspaces: withCurrent });
  } catch (error) {
    return unit311SupportErrorResponse(error);
  }
}
