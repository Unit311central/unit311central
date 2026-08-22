/** Dedicated QA tenant slug — not a product module; Test workspace only. */
export const TEST_WORKSPACE_SLUG = "test";

export const TEST_WORKSPACE_HOST = "test.unit311central.com";

export const QA_TASK_STATUSES = ["open", "completed"] as const;

export type QaTaskStatus = (typeof QA_TASK_STATUSES)[number];

export const QA_PAGE_LEVEL_ELEMENT = "Page-level";
