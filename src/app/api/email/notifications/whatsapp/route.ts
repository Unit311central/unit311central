import { NextRequest, NextResponse } from "next/server";

import { emailErrorResponse } from "@/lib/email/api-utils";
import {
  getWhatsAppNotificationStatus,
  processInfoMailboxWhatsAppNotifications,
  sendWhatsAppTestNotification,
  setWhatsAppNotificationsEnabled,
} from "@/lib/email/whatsapp-notifications";
import { ensureEmailInfrastructureTables } from "@/lib/internal-db-migrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorizedCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim() || process.env.WHATSAPP_CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (isAuthorizedCron(request)) {
    try {
      const result = await processInfoMailboxWhatsAppNotifications();
      return NextResponse.json({ ok: true, cron: true, ...result });
    } catch (error) {
      return emailErrorResponse(error, "WhatsApp cron check failed.");
    }
  }

  try {
    await ensureEmailInfrastructureTables();
    const status = await getWhatsAppNotificationStatus();
    return NextResponse.json(status);
  } catch (error) {
    return emailErrorResponse(error, "Failed to load WhatsApp notification status.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureEmailInfrastructureTables();
    const body = (await request.json().catch(() => ({}))) as {
      action?: "check" | "enable" | "disable" | "test";
      enabled?: boolean;
    };

    const cron = isAuthorizedCron(request);

    if (body.action === "enable" || body.action === "disable") {
      await setWhatsAppNotificationsEnabled(body.action === "enable");
      const status = await getWhatsAppNotificationStatus();
      return NextResponse.json({ ok: true, ...status });
    }

    if (body.action === "test") {
      const result = await sendWhatsAppTestNotification();
      return NextResponse.json(result);
    }

    if (body.action === "check" || cron || body.action == null) {
      const result = await processInfoMailboxWhatsAppNotifications();
      return NextResponse.json({ ok: true, ...result });
    }

    if (typeof body.enabled === "boolean") {
      await setWhatsAppNotificationsEnabled(body.enabled);
      const status = await getWhatsAppNotificationStatus();
      return NextResponse.json({ ok: true, ...status });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return emailErrorResponse(error, "WhatsApp notification request failed.");
  }
}
