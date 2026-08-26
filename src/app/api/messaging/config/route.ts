import { NextResponse } from "next/server";

import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace, WorkspaceAccessError } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function authErrorStatus(error: unknown): number {
  if (error instanceof WorkspaceAccessError) return error.status;
  const message = error instanceof Error ? error.message : "";
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

/**
 * Realtime bootstrap for authenticated workspace members only.
 * Exposes the public Supabase URL + anon key for browser Realtime subscriptions.
 * Never exposes service-role or other secrets.
 */
export async function GET() {
  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        configured: false,
        supabaseUrl: null,
        supabaseAnonKey: null,
        workspaceId: workspace.id,
      });
    }

    return NextResponse.json({
      configured: true,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      workspaceId: workspace.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication required.";
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
