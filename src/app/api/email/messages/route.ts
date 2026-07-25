import { NextRequest, NextResponse } from "next/server";

import { parseAccountId, parseMailboxFolder } from "@/lib/email/accounts";
import { emailErrorResponse } from "@/lib/email/api-utils";
import { listDemoMailboxMessages } from "@/lib/email/demo-mailbox";
import { fetchMailboxMessages } from "@/lib/email/imap";
import { processInfoMailboxWhatsAppNotifications } from "@/lib/email/whatsapp-notifications";
import { requirePlatformSession } from "@/lib/platform-session";
import { isDemoWiseWorkspaceSlug } from "@/lib/treasury/bank-provider";
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

  const folder = parseMailboxFolder(request.nextUrl.searchParams.get("folder"));

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    if (isDemoWiseWorkspaceSlug(workspace.slug)) {
      return NextResponse.json(listDemoMailboxMessages(account, folder));
    }

    const messages = await fetchMailboxMessages(account, undefined, folder);
    if (account === "info" && folder === "inbox") {
      void processInfoMailboxWhatsAppNotifications(messages, scope).catch((error) => {
        console.error("[email/whatsapp] notification check failed", error);
      });
    }
    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof Error && authErrorStatus(error.message) === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return emailErrorResponse(error, "Failed to load mailbox messages.");
  }
}
