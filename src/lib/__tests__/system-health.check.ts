/**
 * System health probes and public health contract.
 */
import assert from "node:assert/strict";

import { deriveOverallStatus } from "@/lib/system-health/probes";
import type { HealthComponentReport } from "@/lib/system-health/types";

function component(
  partial: Omit<HealthComponentReport, "status"> & { status: HealthComponentReport["status"] },
): HealthComponentReport {
  return partial;
}

assert.equal(
  deriveOverallStatus([
    component({ id: "application", label: "Application", critical: true, status: "ok" }),
    component({ id: "database", label: "Database", critical: true, status: "ok" }),
    component({ id: "openai", label: "OpenAI", critical: false, status: "failed" }),
  ]),
  "degraded",
);

assert.equal(
  deriveOverallStatus([
    component({ id: "application", label: "Application", critical: true, status: "ok" }),
    component({ id: "database", label: "Database", critical: true, status: "failed" }),
  ]),
  "critical",
);

assert.equal(
  deriveOverallStatus([
    component({ id: "application", label: "Application", critical: true, status: "ok" }),
    component({ id: "database", label: "Database", critical: true, status: "ok" }),
    component({ id: "openai", label: "OpenAI", critical: false, status: "ok" }),
  ]),
  "operational",
);

console.log("ok system-health checks passed");
