import { NextRequest, NextResponse } from "next/server";

import { parseAccountId } from "@/lib/email/accounts";
import { emailErrorResponse } from "@/lib/email/api-utils";
import { fetchZohoMailboxCalendar } from "@/lib/email/zoho-caldav";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authErrorStatus(message: string) {
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

export async function GET(request: NextRequest) {
  const account = parseAccountId(request.nextUrl.searchParams.get("account"));
  if (!account) {
    return NextResponse.json({ error: "Valid account query parameter is required." }, { status: 400 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const calendar = await fetchZohoMailboxCalendar(account, { workspaceId: workspace.id });
    return NextResponse.json(calendar);
  } catch (error) {
    if (error instanceof Error && authErrorStatus(error.message) === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return emailErrorResponse(error, "Failed to load mailbox calendar.");
  }
}
