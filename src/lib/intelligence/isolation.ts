import type {
  IntelligenceIsolationPolicy,
  IntelligenceRecord,
  IntelligenceScopedContext,
  IntelligenceWorkspaceSlug,
} from "@/lib/intelligence/types";

export class IntelligenceWorkspaceIsolationError extends Error {
  readonly code = "INTELLIGENCE_WORKSPACE_ISOLATION";

  constructor(
    message: string,
    readonly expectedSlug: IntelligenceWorkspaceSlug,
    readonly actualSlug: IntelligenceWorkspaceSlug,
  ) {
    super(message);
    this.name = "IntelligenceWorkspaceIsolationError";
  }
}

export const DEFAULT_INTELLIGENCE_ISOLATION_POLICY: IntelligenceIsolationPolicy = {
  enforceWorkspaceBoundary: true,
};

function normalizeSlug(slug: string | null | undefined): string {
  return String(slug ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Assert that a scoped context matches the expected workspace.
 * Throws {@link IntelligenceWorkspaceIsolationError} on mismatch.
 */
export function assertIntelligenceWorkspaceScope(
  context: IntelligenceScopedContext,
  expectedSlug: IntelligenceWorkspaceSlug,
  policy: IntelligenceIsolationPolicy = DEFAULT_INTELLIGENCE_ISOLATION_POLICY,
): void {
  if (!policy.enforceWorkspaceBoundary) return;

  const expected = normalizeSlug(expectedSlug);
  const actual = normalizeSlug(context.workspaceSlug);
  if (!expected || !actual || expected !== actual) {
    throw new IntelligenceWorkspaceIsolationError(
      `Intelligence operation scoped to "${actual}" but expected "${expected}".`,
      expected,
      actual,
    );
  }
}

/**
 * Validate that every record belongs to the given workspace slug.
 */
export function assertRecordsBelongToWorkspace(
  records: readonly IntelligenceRecord[],
  workspaceSlug: IntelligenceWorkspaceSlug,
  policy: IntelligenceIsolationPolicy = DEFAULT_INTELLIGENCE_ISOLATION_POLICY,
): void {
  if (!policy.enforceWorkspaceBoundary) return;

  const expected = normalizeSlug(workspaceSlug);
  for (const record of records) {
    const actual = normalizeSlug(record.workspaceSlug);
    if (actual !== expected) {
      throw new IntelligenceWorkspaceIsolationError(
        `Intelligence record "${record.id}" belongs to "${actual}", not "${expected}".`,
        expected,
        actual,
      );
    }
  }
}

/**
 * Stamp workspace slug onto records and reject any record already bound to another workspace.
 */
export function bindIntelligenceRecordsToWorkspace(
  records: readonly IntelligenceRecord[],
  workspaceSlug: IntelligenceWorkspaceSlug,
  policy: IntelligenceIsolationPolicy = DEFAULT_INTELLIGENCE_ISOLATION_POLICY,
): IntelligenceRecord[] {
  const expected = normalizeSlug(workspaceSlug);
  return records.map((record) => {
    const actual = normalizeSlug(record.workspaceSlug);
    if (actual && actual !== expected && policy.enforceWorkspaceBoundary) {
      throw new IntelligenceWorkspaceIsolationError(
        `Cannot bind record "${record.id}" from "${actual}" to "${expected}".`,
        expected,
        actual,
      );
    }
    return {
      ...record,
      workspaceSlug: expected,
    };
  });
}

/** Create a scoped context for downstream service calls. */
export function createIntelligenceScopedContext(
  workspaceSlug: IntelligenceWorkspaceSlug,
  domainId?: string,
): IntelligenceScopedContext {
  return {
    workspaceSlug: normalizeSlug(workspaceSlug),
    ...(domainId ? { domainId: String(domainId).trim() } : {}),
  };
}
