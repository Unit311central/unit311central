import { NextResponse } from "next/server";

import { emailErrorResponse } from "@/lib/email/api-utils";
import { processInfoMailboxWhatsAppNotifications } from "@/lib/email/whatsapp-notifications";
import { ensureEmailInfrastructureTables } from "@/lib/internal-db-migrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Lightweight poll endpoint for background WhatsApp alert checks. */
export async function GET() {
  try {
    await ensureEmailInfrastructureTables();
    const result = await processInfoMailboxWhatsAppNotifications();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return emailErrorResponse(error, "WhatsApp notification check failed.");
  }
}
