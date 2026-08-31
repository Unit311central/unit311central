import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { parseAccountId } from "@/lib/email/accounts";
import { isMailboxAllowedOnWorkspace } from "@/lib/email/mailbox-registry";
import { emailErrorResponse } from "@/lib/email/api-utils";
import { sendMailboxEmail } from "@/lib/email/smtp";
import type { EmailAccountId } from "@/lib/email/types";
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

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    await requirePlatformSession();

    const body = (await request.json()) as {
      account?: EmailAccountId;
      to?: string;
      cc?: string;
      bcc?: string;
      fromAddress?: string;
      subject?: string;
      html?: string;
      text?: string;
      inReplyTo?: string | null;
      references?: string[];
      attachments?: Array<{
        filename?: string;
        contentType?: string;
        contentBase64?: string;
      }>;
    };

    const account = parseAccountId(body.account ?? null);
    if (!account) {
      return NextResponse.json({ error: "Valid account is required." }, { status: 400 });
    }
    const workspace = await requireCurrentWorkspace();
    const allowed = await isMailboxAllowedOnWorkspace(account, {
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Mailbox is not available on this workspace." }, { status: 403 });
    }
    if (!body.to?.trim()) {
      return NextResponse.json({ error: "Recipient is required." }, { status: 400 });
    }
    if (!body.subject?.trim()) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    const attachments = (body.attachments ?? [])
      .filter((entry) => entry.filename?.trim() && entry.contentBase64?.trim())
      .map((entry) => ({
        filename: entry.filename!.trim(),
        contentType: entry.contentType?.trim() || undefined,
        content: Buffer.from(entry.contentBase64!.trim(), "base64"),
      }));

    const result = await sendMailboxEmail({
      account,
      to: body.to,
      cc: body.cc,
      bcc: body.bcc,
      fromAddress: body.fromAddress,
      subject: body.subject,
      html: body.html,
      text: body.text,
      inReplyTo: body.inReplyTo ?? undefined,
      references: body.references,
      attachments: attachments.length > 0 ? attachments : undefined,
      workspaceId: workspace.id,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof Error && authErrorStatus(error.message) === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return emailErrorResponse(error, "Failed to send email.");
  }
}
