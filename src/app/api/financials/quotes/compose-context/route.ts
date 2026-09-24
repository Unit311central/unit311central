import { NextResponse } from "next/server";

import { getSalesQuoteSellerProfile } from "@/lib/accounting/sales-quote-seller-profile";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const seller = await getSalesQuoteSellerProfile(workspace.id);
    return NextResponse.json({ seller, workspaceName: workspace.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load quote context.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
