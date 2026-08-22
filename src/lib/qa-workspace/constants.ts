/** Dedicated QA tenant slug — not a product module; Test workspace only. */
export const TEST_WORKSPACE_SLUG = "test";

export const TEST_WORKSPACE_HOST = "test.unit311central.com";

export const QA_TASK_STATUSES = ["open", "completed"] as const;

export type QaTaskStatus = (typeof QA_TASK_STATUSES)[number];

export const QA_TASK_SCOPES = ["workspace", "module", "page", "element"] as const;

export type QaTaskScope = (typeof QA_TASK_SCOPES)[number];

export const QA_WORKSPACE_LEVEL_ELEMENT = "Workspace-level";

export const QA_MODULE_LEVEL_ELEMENT = "Module-level";

export const QA_PAGE_LEVEL_ELEMENT = "Page-level";
