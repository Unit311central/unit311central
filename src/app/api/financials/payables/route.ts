import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarPayables } from "@/lib/demo/northstar-api-fixtures";
import { requirePlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (await isDemoApiRequest()) {
      return NextResponse.json({ payables: getNorthstarPayables() });
    }

    await requirePlatformSession();
    return NextResponse.json({ payables: [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load payables.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
