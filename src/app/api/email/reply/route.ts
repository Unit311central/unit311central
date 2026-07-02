import { NextRequest, NextResponse } from "next/server";

import { parseAccountId } from "@/lib/email/accounts";
import { emailErrorResponse } from "@/lib/email/api-utils";
import { sendMailboxReply } from "@/lib/email/smtp";
import type { EmailAccountId } from "@/lib/email/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      account?: EmailAccountId;
      messageId?: string;
      html?: string;
      text?: string;
      context?: {
        to?: string;
        subject?: string;
        messageId?: string | null;
        references?: string[];
      };
    };

    const account = parseAccountId(body.account ?? null);
    if (!account) {
      return NextResponse.json({ error: "Valid account is required." }, { status: 400 });
    }
    if (!body.messageId?.trim()) {
      return NextResponse.json({ error: "messageId is required." }, { status: 400 });
    }
    if (!body.html?.trim() && !body.text?.trim()) {
      return NextResponse.json({ error: "Reply body is required." }, { status: 400 });
    }

    const context =
      body.context?.to?.trim() && body.context.subject?.trim()
        ? {
            to: body.context.to.trim(),
            subject: body.context.subject.trim(),
            messageId: body.context.messageId ?? null,
            references: body.context.references ?? [],
          }
        : undefined;

    const result = await sendMailboxReply({
      account,
      messageId: body.messageId,
      html: body.html,
      text: body.text,
      context,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return emailErrorResponse(error, "Failed to send reply.");
  }
}
