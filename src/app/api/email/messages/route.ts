import { NextRequest, NextResponse } from "next/server";

import { parseAccountId } from "@/lib/email/accounts";
import { emailErrorResponse } from "@/lib/email/api-utils";
import { fetchMailboxMessages } from "@/lib/email/imap";
import { processInfoMailboxWhatsAppNotifications } from "@/lib/email/whatsapp-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const account = parseAccountId(request.nextUrl.searchParams.get("account"));
  if (!account) {
    return NextResponse.json({ error: "Valid account query parameter is required." }, { status: 400 });
  }

  try {
    const messages = await fetchMailboxMessages(account);
    if (account === "info") {
      void processInfoMailboxWhatsAppNotifications(messages).catch((error) => {
        console.error("[email/whatsapp] notification check failed", error);
      });
    }
    return NextResponse.json(messages);
  } catch (error) {
    return emailErrorResponse(error, "Failed to load mailbox messages.");
  }
}
