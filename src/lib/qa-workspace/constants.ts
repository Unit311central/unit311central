/** Dedicated QA tenant slug — not a product module. */
export const TEST_WORKSPACE_SLUG = "test";

/** InterfaceWorx beta QA tenant slug — not a product module. */
export const INTERFACE_WORX_QA_SLUG = "interfaceworx";

export const TEST_WORKSPACE_HOST = "test.unit311central.com";

export const QA_TASK_STATUSES = ["open", "in_progress", "done", "wont_fix"] as const;

/** Legacy status stored in older rows before migration 185. */
export const QA_TASK_LEGACY_STATUSES = ["completed"] as const;

export type QaTaskStatus = (typeof QA_TASK_STATUSES)[number];

export const QA_BETA_REPORT_TYPES = [
  { id: "broken", label: "Something is broken" },
  { id: "not_working", label: "Something isn't working correctly" },
  { id: "change", label: "I'd like this changed" },
  { id: "confused", label: "I don't understand this" },
  { id: "feature", label: "I'd like something added" },
] as const;

export type QaBetaReportTypeId = (typeof QA_BETA_REPORT_TYPES)[number]["id"];

export const QA_TASK_SCOPES = ["workspace", "module", "page", "element"] as const;

export type QaTaskScope = (typeof QA_TASK_SCOPES)[number];

export const QA_WORKSPACE_LEVEL_ELEMENT = "Workspace-level";

export const QA_MODULE_LEVEL_ELEMENT = "Module-level";

export const QA_PAGE_LEVEL_ELEMENT = "Page-level";
