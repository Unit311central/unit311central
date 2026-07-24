import { NextResponse } from "next/server";

import { ensureIntegrationsRegistryTables } from "@/lib/internal-db-migrations";
import { listIntegrationRegistry } from "@/lib/integrations-registry-service";
import { groupIntegrationsByCategory } from "@/lib/integrations-registry";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    await ensureIntegrationsRegistryTables();
    const integrations = await listIntegrationRegistry();
    const groups = groupIntegrationsByCategory(integrations);
    return NextResponse.json({
      integrations,
      groups,
      source: "supabase",
      count: integrations.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load integrations";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
