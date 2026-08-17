import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import {
  getNorthstarIntegrations,
  groupNorthstarIntegrationsByCategory,
} from "@/lib/demo/northstar-integrations-data";
import { ensureIntegrationsRegistryTables } from "@/lib/internal-db-migrations";
import { listIntegrationRegistry } from "@/lib/integrations-registry-service";
import { groupIntegrationsByCategory } from "@/lib/integrations-registry";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    const integrations = getNorthstarIntegrations();
    return NextResponse.json({
      integrations,
      groups: groupNorthstarIntegrationsByCategory(integrations),
      source: "northstar-demo",
      count: integrations.length,
    });
  }

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
