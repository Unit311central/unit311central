import {
  PRODUCTION_HEALTH_URL_DEFAULT,
  UNIT311_HEALTH_WORKFLOW_PATH,
  type ExternalMonitoringReport,
  type HealthComponentReport,
  type SystemHealthReport,
} from "@/lib/system-health/types";
import {
  listRecentIncidents,
  readProbeMeta,
  recordProductionHealthProbe,
  syncIncidentsFromComponents,
} from "@/lib/system-health/incidents";
import { deriveOverallStatus, runFullHealthProbes } from "@/lib/system-health/probes";

function productionHealthUrl(): string {
  return (
    process.env.UNIT311_PRODUCTION_HEALTH_URL?.trim() || PRODUCTION_HEALTH_URL_DEFAULT
  );
}

async function probeProductionHealthEndpoint(): Promise<{
  ok: boolean;
  httpStatus: number | null;
}> {
  const url = productionHealthUrl();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);
    const ok = res.status === 200;
    await recordProductionHealthProbe({ ok, httpStatus: res.status });
    return { ok, httpStatus: res.status };
  } catch {
    await recordProductionHealthProbe({ ok: false, httpStatus: null });
    return { ok: false, httpStatus: null };
  }
}

function githubMonitoringComponent(
  probeOk: boolean,
  meta: Awaited<ReturnType<typeof readProbeMeta>>,
): HealthComponentReport {
  return {
    id: "github_monitoring",
    label: "GitHub Actions",
    critical: false,
    status: probeOk ? "ok" : "failed",
    detail: probeOk
      ? "Production health endpoint reachable"
      : "Production health endpoint check failed",
  };
}

function buildExternalMonitoring(
  probeOk: boolean,
  meta: Awaited<ReturnType<typeof readProbeMeta>>,
): ExternalMonitoringReport {
  return {
    label: "GitHub Actions",
    status: probeOk ? "ok" : "failed",
    productionHealthUrl: productionHealthUrl(),
    workflowPath: UNIT311_HEALTH_WORKFLOW_PATH,
    lastCheckAt: meta?.last_probe_at ?? null,
    lastFailureAt: meta?.last_failure_at ?? null,
    lastRecoveryAt: meta?.last_recovery_at ?? null,
    lastHttpStatus: meta?.last_probe_http_status ?? null,
  };
}

export async function buildSystemHealthReport(): Promise<SystemHealthReport> {
  const checkedAt = new Date().toISOString();
  const components = await runFullHealthProbes();
  const productionProbe = await probeProductionHealthEndpoint();
  const meta = await readProbeMeta();

  const github = githubMonitoringComponent(productionProbe.ok, meta);
  const allComponents = [...components, github];

  await syncIncidentsFromComponents(allComponents);

  const incidents = await listRecentIncidents(25);
  const overall = deriveOverallStatus(allComponents);

  return {
    overall,
    checkedAt,
    components: allComponents,
    externalMonitoring: buildExternalMonitoring(productionProbe.ok, meta),
    incidents,
  };
}
