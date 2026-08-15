import { listMarketingNewsletters } from "@/lib/marketing/marketing-service";
import type { AssistantActionDefinition } from "../../types";

export const listMarketingNewslettersAction: AssistantActionDefinition = {
  id: "marketing.listNewsletters",
  name: "List marketing newsletters",
  description:
    "List workspace-scoped newsletters from the central Marketing & Events module.",
  module: "marketing",
  requiredPermissions: ["authenticated"],
  confirmationRequired: false,
  auditRequired: false,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string" },
    },
  },
  capability: {
    businessObject: "marketing_newsletter",
    intentExamples: ["list newsletters", "show marketing newsletters"],
    confirmationPolicy: "never",
    successFormatter: {
      template: "Found {count} newsletter(s).",
      fields: [{ token: "count", path: "output.count" }],
    },
  },
  handler: {
    validate() {
      return { ok: true, errors: [], warnings: [] };
    },
    preview() {
      return {
        summary: "List marketing newsletters for the current workspace.",
        affectedRecords: [],
        warnings: [],
        reversible: false,
      };
    },
    async execute(input) {
      const newsletters = await listMarketingNewsletters();
      const status = String(input.status ?? "").trim().toLowerCase();
      const filtered = status
        ? newsletters.filter((row) => row.status === status)
        : newsletters;
      return {
        ok: true,
        message: `${filtered.length} newsletter(s)`,
        output: { count: filtered.length, newsletters: filtered },
      };
    },
  },
};
