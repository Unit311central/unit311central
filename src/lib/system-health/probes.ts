import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

import type { HealthComponentReport, HealthComponentStatus } from "@/lib/system-health/types";

function okReport(
  partial: Omit<HealthComponentReport, "status"> & { status?: HealthComponentStatus },
): HealthComponentReport {
  return { ...partial, status: partial.status ?? "ok" };
}

export async function probeApplication(): Promise<HealthComponentReport> {
  return okReport({
    id: "application",
    label: "Application",
    critical: true,
    detail: "Next.js runtime responding",
  });
}

export async function probeDatabase(): Promise<HealthComponentReport> {
  if (!isSupabaseConfigured()) {
    return {
      id: "database",
      label: "Database",
      critical: true,
      status: "failed",
      detail: "Database client not configured",
    };
  }

  try {
    const client = isSupabaseServiceRoleConfigured()
      ? createSupabaseServiceRoleClient()
      : createSupabaseServerClient();
  // Lightweight read against a core table (always present in production).
    const { error } = await client.from("workspaces").select("id").limit(1);

    if (error) {
      return {
        id: "database",
        label: "Database",
        critical: true,
        status: "failed",
        detail: "Database query failed",
      };
    }

    return okReport({
      id: "database",
      label: "Database",
      critical: true,
      detail: "PostgreSQL connectivity confirmed",
    });
  } catch {
    return {
      id: "database",
      label: "Database",
      critical: true,
      status: "failed",
      detail: "Database query failed",
    };
  }
}

export async function probeSupabase(): Promise<HealthComponentReport> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return {
      id: "supabase",
      label: "Supabase",
      critical: true,
      status: "failed",
      detail: "Supabase environment not configured",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        id: "supabase",
        label: "Supabase",
        critical: true,
        status: "failed",
        detail: "Supabase API not reachable",
      };
    }

    return okReport({
      id: "supabase",
      label: "Supabase",
      critical: true,
      detail: "Supabase API reachable",
    });
  } catch {
    return {
      id: "supabase",
      label: "Supabase",
      critical: true,
      status: "failed",
      detail: "Supabase API not reachable",
    };
  }
}

export async function probeStorage(): Promise<HealthComponentReport> {
  if (!isSupabaseServiceRoleConfigured()) {
    return {
      id: "storage",
      label: "Storage",
      critical: false,
      status: "unknown",
      detail: "Storage probe unavailable (service role not configured)",
    };
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.storage.listBuckets();
    if (error) {
      return {
        id: "storage",
        label: "Storage",
        critical: false,
        status: "degraded",
        detail: "Storage API check failed",
      };
    }
    return okReport({
      id: "storage",
      label: "Storage",
      critical: false,
      detail: "Storage API reachable",
    });
  } catch {
    return {
      id: "storage",
      label: "Storage",
      critical: false,
      status: "degraded",
      detail: "Storage API check failed",
    };
  }
}

export async function probeOpenAi(): Promise<HealthComponentReport> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === "sk-ci-placeholder") {
    return {
      id: "openai",
      label: "OpenAI",
      critical: false,
      status: "unknown",
      detail: "OpenAI not configured (non-critical)",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return okReport({
        id: "openai",
        label: "OpenAI",
        critical: false,
        detail: "OpenAI API reachable",
      });
    }

    return {
      id: "openai",
      label: "OpenAI",
      critical: false,
      status: "degraded",
      detail: "OpenAI API returned an error (non-critical)",
    };
  } catch {
    return {
      id: "openai",
      label: "OpenAI",
      critical: false,
      status: "degraded",
      detail: "OpenAI API not reachable (non-critical)",
    };
  }
}

export function deriveOverallStatus(
  components: HealthComponentReport[],
): "operational" | "critical" | "degraded" {
  const criticalFailed = components.some(
    (row) => row.critical && row.status === "failed",
  );
  if (criticalFailed) return "critical";

  const anyDegraded = components.some(
    (row) => row.status === "degraded" || row.status === "failed",
  );
  if (anyDegraded) return "degraded";

  return "operational";
}

export async function runCriticalHealthProbes(): Promise<{
  ok: boolean;
  components: HealthComponentReport[];
}> {
  const application = await probeApplication();
  const database = await probeDatabase();
  const supabase = await probeSupabase();
  const components = [application, database, supabase];
  const ok = deriveOverallStatus(components) === "operational";
  return { ok, components };
}

export async function runFullHealthProbes(): Promise<HealthComponentReport[]> {
  const [application, database, supabase, storage, openai] = await Promise.all([
    probeApplication(),
    probeDatabase(),
    probeSupabase(),
    probeStorage(),
    probeOpenAi(),
  ]);
  return [application, database, supabase, storage, openai];
}
