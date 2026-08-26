import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

import type { HealthComponentReport, HealthIncidentRow } from "@/lib/system-health/types";

type IncidentRecord = {
  id: string;
  component: string;
  severity: "critical" | "warning";
  status: "open" | "resolved";
  started_at: string;
  ended_at: string | null;
  summary: string;
};

type ProbeMetaRecord = {
  last_probe_at: string | null;
  last_probe_ok: boolean | null;
  last_probe_http_status: number | null;
  last_failure_at: string | null;
  last_recovery_at: string | null;
};

function mapIncident(row: IncidentRecord): HealthIncidentRow {
  return {
    id: row.id,
    component: row.component,
    severity: row.severity,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    summary: row.summary,
  };
}

function severityForComponent(component: HealthComponentReport): "critical" | "warning" {
  return component.critical ? "critical" : "warning";
}

function isUnhealthy(status: HealthComponentReport["status"]): boolean {
  return status === "failed" || status === "degraded";
}

export async function listRecentIncidents(limit = 20): Promise<HealthIncidentRow[]> {
  if (!isSupabaseServiceRoleConfigured()) return [];

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("unit311_system_health_incidents")
      .select("id, component, severity, status, started_at, ended_at, summary")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as IncidentRecord[]).map(mapIncident);
  } catch {
    return [];
  }
}

export async function syncIncidentsFromComponents(components: HealthComponentReport[]) {
  if (!isSupabaseServiceRoleConfigured()) return;

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();

  for (const component of components) {
    const unhealthy = isUnhealthy(component.status);
    const { data: openRows } = await supabase
      .from("unit311_system_health_incidents")
      .select("id")
      .eq("component", component.id)
      .eq("status", "open")
      .limit(1);

    const open = (openRows ?? [])[0] as { id: string } | undefined;

    if (unhealthy && !open) {
      await supabase.from("unit311_system_health_incidents").insert({
        component: component.id,
        severity: severityForComponent(component),
        status: "open",
        started_at: now,
        summary: component.detail ?? `${component.label} unhealthy`,
      });
    }

    if (!unhealthy && open) {
      await supabase
        .from("unit311_system_health_incidents")
        .update({ status: "resolved", ended_at: now })
        .eq("id", open.id);
    }
  }
}

export async function readProbeMeta(): Promise<ProbeMetaRecord | null> {
  if (!isSupabaseServiceRoleConfigured()) return null;

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("unit311_system_health_probe_meta")
      .select(
        "last_probe_at, last_probe_ok, last_probe_http_status, last_failure_at, last_recovery_at",
      )
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) return null;
    return data as ProbeMetaRecord;
  } catch {
    return null;
  }
}

export async function recordProductionHealthProbe(result: {
  ok: boolean;
  httpStatus: number | null;
}) {
  if (!isSupabaseServiceRoleConfigured()) return;

  const supabase = createSupabaseServiceRoleClient();
  const now = new Date().toISOString();
  const meta = await readProbeMeta();
  const wasOk = meta?.last_probe_ok;

  const patch: Record<string, unknown> = {
    last_probe_at: now,
    last_probe_ok: result.ok,
    last_probe_http_status: result.httpStatus,
    updated_at: now,
  };

  if (!result.ok) {
    patch.last_failure_at = now;
  } else if (wasOk === false) {
    patch.last_recovery_at = now;
  }

  await supabase.from("unit311_system_health_probe_meta").upsert({
    id: "default",
    ...patch,
  });
}
