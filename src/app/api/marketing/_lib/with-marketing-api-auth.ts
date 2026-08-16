import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarMarketingKpis } from "@/lib/demo/northstar-api-fixtures";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export async function withMarketingApiAuth<T>(
  handler: (ctx: { workspaceId: string; workspaceSlug: string }) => Promise<T>,
) {
  if (await isDemoApiRequest()) {
    return handler({ workspaceId: "demo-workspace", workspaceSlug: "demo" });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const result = await handler({
      workspaceId: workspace.id,
      workspaceSlug: String(workspace.slug ?? "").toLowerCase(),
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marketing API request failed";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
