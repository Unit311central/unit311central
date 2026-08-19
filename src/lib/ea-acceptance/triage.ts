/**
 * Group acceptance failures into an actionable defect backlog.
 */

import type { EaAcceptanceCaseResult } from "./types";

export type FailureCluster = {
  workspaceSlug: string;
  moduleLabel: string;
  capabilityId: string | null;
  failureType: string;
  count: number;
  examples: string[];
};

export type EaTriageReport = {
  total: number;
  passed: number;
  failed: number;
  clusters: FailureCluster[];
};

function primaryFailureType(result: EaAcceptanceCaseResult): string {
  const failed = result.checks.filter((c) => !c.passed);
  if (failed.length === 0) return result.error ?? "unknown";
  return failed[0]?.id ?? "unknown";
}

export function triageAcceptanceResults(
  workspaceSlug: string,
  results: EaAcceptanceCaseResult[],
): EaTriageReport {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail");
  const clusterMap = new Map<string, FailureCluster>();

  for (const result of failed) {
    const failureType = primaryFailureType(result);
    const key = [
      workspaceSlug,
      result.moduleLabel ?? "unknown",
      result.capabilityId ?? "none",
      failureType,
    ].join("::");

    const existing = clusterMap.get(key);
    if (existing) {
      existing.count += 1;
      if (existing.examples.length < 3) existing.examples.push(result.prompt);
    } else {
      clusterMap.set(key, {
        workspaceSlug,
        moduleLabel: result.moduleLabel ?? "unknown",
        capabilityId: result.capabilityId ?? null,
        failureType,
        count: 1,
        examples: [result.prompt],
      });
    }
  }

  const clusters = [...clusterMap.values()].sort((a, b) => b.count - a.count);
  return {
    total: results.length,
    passed,
    failed: failed.length,
    clusters,
  };
}

export function formatTriageMarkdown(reports: Array<{ slug: string; triage: EaTriageReport }>): string {
  const lines = [`# EA Acceptance Failure Triage`, ``];
  for (const { slug, triage } of reports) {
    lines.push(`## ${slug} — ${triage.passed}/${triage.total} passed`);
    if (triage.clusters.length === 0) {
      lines.push(`All scenarios passed.`);
      lines.push(``);
      continue;
    }
    lines.push(`| Module | Capability | Failure | Count | Example |`);
    lines.push(`| --- | --- | --- | --- | --- |`);
    for (const cluster of triage.clusters.slice(0, 20)) {
      lines.push(
        `| ${cluster.moduleLabel} | ${cluster.capabilityId ?? "—"} | ${cluster.failureType} | ${cluster.count} | ${cluster.examples[0]?.slice(0, 60) ?? ""} |`,
      );
    }
    lines.push(``);
  }
  return lines.join("\n");
}
