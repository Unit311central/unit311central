/**
 * OpenAI tool schemas for ABHI EA PDF tools (definitions only — no handlers).
 */

export const ABHI_EA_PDF_TOOL_DEFINITIONS = [
  {
    name: "abhi.generateRegulatoryImpactPdf",
    description:
      "ABHI only. Generate a regulatory member impact PDF for a period (e.g. past 6 months) and region (e.g. UK members). Uses live Regulatory Intelligence data — not board deck format.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
        months: { type: "number", description: "Lookback window in months (default 6)." },
        region: { type: "string", enum: ["UK", "all"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.generateQuarterlyFinancialDeltaPdf",
    description:
      "ABHI only. Generate a quarter-over-quarter financial delta PDF for P&L, burn rate, and payroll. Compares last completed calendar quarter vs prior quarter. Not board deck format.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.generateProjectHealthPdf",
    description:
      "ABHI only. Generate a health status PDF for all active/live projects from recorded progress, due dates, and notes. Not board deck format.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.queryProjectPortfolio",
    description:
      "ABHI only. Executive health check of the ABHI project portfolio — on-track vs at-risk vs issues with milestones and risks.",
    parameters: {
      type: "object",
      properties: { question: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.generatePlatformAccessPdf",
    description:
      "ABHI only. Generate a platform users and module access PDF (not HR employee directory). Requires user-management permission.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
] as const;
