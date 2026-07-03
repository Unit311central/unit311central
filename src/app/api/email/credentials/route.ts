import { NextRequest, NextResponse } from "next/server";

import { parseAccountId } from "@/lib/email/accounts";
import {
  getMailboxCredentialStatus,
  saveMailboxCredentials,
} from "@/lib/email/credentials-service";
import { emailErrorResponse } from "@/lib/email/api-utils";
import type { EmailAccountId } from "@/lib/email/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getMailboxCredentialStatus();
    return NextResponse.json(status);
  } catch (error) {
    return emailErrorResponse(error, "Failed to load mailbox credential status.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      account?: EmailAccountId;
      password?: string;
      email?: string;
    };

    const account = parseAccountId(body.account ?? null);
    if (!account) {
      return NextResponse.json({ error: "Valid account is required." }, { status: 400 });
    }
    if (!body.password?.trim()) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const saved = await saveMailboxCredentials(account, body.password, body.email);
    const status = await getMailboxCredentialStatus();

    return NextResponse.json({ ok: true, saved, status });
  } catch (error) {
    return emailErrorResponse(error, "Failed to save mailbox credentials.");
  }
}
