/**
 * Northstar demo EA — comprehensive question bank in LHS nav order.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import type { ApplicationCatalogueModule } from "@/lib/ai-operating-assistant/application-catalogue";

export type NorthstarEaTestQuestionKind = "data" | "navigation" | "pdf" | "composite";

export type NorthstarEaTestQuestion = {
  id: string;
  prompt: string;
  kind: NorthstarEaTestQuestionKind;
  moduleId: string;
  moduleLabel: string;
  subModuleLabel?: string;
  viewId?: string;
  expectTool?: string;
};

export type NorthstarEaTestSection = {
  id: string;
  navOrder: number;
  label: string;
  kind: "pin" | "workspace";
  moduleId: string;
  questions: NorthstarEaTestQuestion[];
};

const PIN_SECTIONS: Array<{ id: string; label: string; moduleId: string }> = [
  { id: "home", label: "HOME", moduleId: "home" },
  { id: "executive-assistant", label: "EXECUTIVE ASSISTANT", moduleId: "executive-assistant" },
];

const MODULE_LEVEL_PROMPTS = (
  module: ApplicationCatalogueModule,
): Array<{ prompt: string; kind: NorthstarEaTestQuestionKind }> => [
  { prompt: `Give me an executive summary of ${module.displayName}.`, kind: "data" },
  { prompt: `What are the key KPIs in ${module.displayName}?`, kind: "data" },
  { prompt: `What needs attention in ${module.displayName} this week?`, kind: "data" },
  { prompt: `What changed recently in ${module.displayName}?`, kind: "data" },
  { prompt: `Show me risks in ${module.displayName}.`, kind: "data" },
  { prompt: `Where is ${module.displayName} in the sidebar?`, kind: "navigation" },
  { prompt: `What applications are under ${module.displayName}?`, kind: "navigation" },
  { prompt: `Create a PDF report with ${module.displayName} highlights and KPIs.`, kind: "pdf" },
];

const PAGE_PROMPTS = (
  moduleLabel: string,
  pageLabel: string,
): Array<{ prompt: string; kind: NorthstarEaTestQuestionKind }> => [
  { prompt: `Summarise ${pageLabel} in ${moduleLabel}.`, kind: "data" },
  { prompt: `What data is on the ${pageLabel} screen?`, kind: "data" },
  { prompt: `How do I open ${pageLabel}?`, kind: "navigation" },
];

const COMPOSITE_BY_MODULE: Record<string, string[]> = {
  "business-central": [
    "Create me a PDF of onboarding and discovery calls over the last quarter and map that to revenue.",
    "Which CRM leads are hot and what is the pipeline value?",
    "Who are our at-risk clients and what is their renewal timeline?",
    "Summarise grants and onboarding status together.",
    "Show partners and management overview for Business Central.",
  ],
  financials: [
    "Make me a PDF with P&L, balance sheet, and cash for the last 6 months.",
    "What is our cash position and runway?",
    "Show payroll trend for the last six months.",
    "List outstanding invoices and total AR.",
    "Summarise general ledger and expenses for August.",
    "What is our bank balance?",
  ],
  "human-resources": [
    "Give me a graph of staff growth year by year in all locations.",
    "Who is on leave this week?",
    "What open vacancies do we have?",
    "Summarise performance review status.",
    "What is payroll gross and employer cost this month?",
  ],
  "marketing-and-events": [
    "What is our newsletter open rate and mailing list size?",
    "List upcoming external events and registrations.",
    "Create a PDF of marketing KPIs and event attendance.",
    "Who is on the mailing list in manufacturing?",
    "Summarise client stories and campaigns.",
  ],
  operations: [
    "What is total asset value and depreciation?",
    "Show inventory by location and SKU count.",
    "What procurement spend is MTD and how many POs are open?",
    "Logistics late delivery rate and in-transit shipments.",
    "Create a PDF of operations KPIs across assets and inventory.",
  ],
  "technology-management": [
    "What is our monthly technology spend trend?",
    "List software and SaaS subscriptions.",
    "How many devices are on the technology register?",
    "Summarise telecom lines and monthly cost.",
    "Create a PDF of technology spend breakdown.",
  ],
  training: [
    "What training courses are published?",
    "List upcoming training sessions.",
    "How many QMS courses are mandatory?",
    "Summarise course builder catalogue.",
    "Create a PDF of training compliance status.",
  ],
  qms: [
    "How many open CAPAs do we have?",
    "List internal audits scheduled.",
    "Summarise document control status.",
    "What is management review agenda?",
    "Create a PDF of QMS audit and CAPA status.",
  ],
  engineering: [
    "What is Atlas programme status and next gate?",
    "Which engineering programmes are at risk?",
    "List critical engineering risks.",
    "What is team utilisation?",
    "Create a PDF of engineering milestones and risks.",
  ],
  fundraising: [
    "What is our seed round pipeline value?",
    "List active investors and stages.",
    "What data rooms are prepared?",
    "Summarise pitch deck versions.",
    "Create a PDF of fundraising pipeline vs target.",
  ],
  board: [
    "Create a board deck for the next meeting.",
    "What board actions are overdue?",
    "Summarise risk register for the board.",
    "What decisions require board attention?",
    "List upcoming board meetings.",
  ],
  "northstar-intelligence": [
    "Give me company intelligence briefing.",
    "What is client intelligence posture?",
    "Summarise market intelligence and competitors.",
    "What deteriorated in intelligence this week?",
    "Create a PDF of intelligence briefing across company, client, and market.",
  ],
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function collectPages(module: ApplicationCatalogueModule) {
  const pages: Array<{ label: string; viewId?: string }> = [];
  for (const app of module.applications) {
    if (app.pages.length) {
      for (const page of app.pages) {
        pages.push({ label: page.label, viewId: page.viewId });
      }
    } else {
      pages.push({ label: app.label, viewId: app.viewId });
    }
  }
  return pages;
}

export function buildNorthstarEaTestBank(): NorthstarEaTestSection[] {
  const sections: NorthstarEaTestSection[] = [];
  let navOrder = 0;

  for (const pin of PIN_SECTIONS) {
    const questions: NorthstarEaTestQuestion[] = [
      {
        id: `${pin.id}-summary`,
        prompt:
          pin.id === "home"
            ? "What should I focus on from the executive home dashboard today?"
            : "What can the Executive Assistant answer about Northstar?",
        kind: "data",
        moduleId: pin.moduleId,
        moduleLabel: pin.label,
      },
      {
        id: `${pin.id}-nav`,
        prompt: `Where is ${pin.label} in the platform?`,
        kind: "navigation",
        moduleId: pin.moduleId,
        moduleLabel: pin.label,
      },
      {
        id: `${pin.id}-pdf`,
        prompt:
          pin.id === "home"
            ? "Create a PDF executive snapshot from the home dashboard priorities."
            : "Create a PDF summarising what EA can do across all modules.",
        kind: "pdf",
        moduleId: pin.moduleId,
        moduleLabel: pin.label,
        expectTool: pin.id === "home" ? "generateScopedBusinessPdf" : "generateScopedBusinessPdf",
      },
    ];
    for (let i = 0; i < 22; i++) {
      questions.push({
        id: `${pin.id}-data-${i + 1}`,
        prompt:
          pin.id === "home"
            ? `Home dashboard question ${i + 1}: what are top ${i + 1} priorities across the business?`
            : `EA capability question ${i + 1}: answer a cross-module question about Northstar module ${i + 1}.`,
        kind: "data",
        moduleId: pin.moduleId,
        moduleLabel: pin.label,
      });
    }
    sections.push({
      id: pin.id,
      navOrder: navOrder++,
      label: pin.label,
      kind: "pin",
      moduleId: pin.moduleId,
      questions,
    });
  }

  const modules = listPlatformModules({ workspaceSlug: DEMO_WORKSPACE_SLUG });
  for (const module of modules) {
    const questions: NorthstarEaTestQuestion[] = [];
    const moduleId = module.id;

    for (const [index, row] of MODULE_LEVEL_PROMPTS(module).entries()) {
      questions.push({
        id: `${moduleId}-module-${index}`,
        prompt: row.prompt,
        kind: row.kind,
        moduleId,
        moduleLabel: module.displayName,
        expectTool:
          row.kind === "pdf"
            ? "generateScopedBusinessPdf"
            : row.kind === "data"
              ? "northstar.queryModule"
              : undefined,
      });
    }

    const composites = COMPOSITE_BY_MODULE[moduleId] ?? [];
    for (const [index, prompt] of composites.entries()) {
      questions.push({
        id: `${moduleId}-composite-${index}`,
        prompt,
        kind: prompt.includes("PDF") || prompt.includes("pdf") ? "pdf" : "composite",
        moduleId,
        moduleLabel: module.displayName,
        expectTool:
          prompt.toLowerCase().includes("pdf") || prompt.includes("board deck")
            ? prompt.includes("board deck")
              ? "boardpack.generate"
              : "generateScopedBusinessPdf"
            : undefined,
      });
    }

    const pages = collectPages(module);
    for (const page of pages) {
      for (const [index, row] of PAGE_PROMPTS(module.displayName, page.label).entries()) {
        questions.push({
          id: `${moduleId}-${slugify(page.label)}-${index}`,
          prompt: row.prompt,
          kind: row.kind,
          moduleId,
          moduleLabel: module.displayName,
          subModuleLabel: page.label,
          viewId: page.viewId,
          expectTool: row.kind === "data" ? "northstar.queryModule" : undefined,
        });
      }
    }

    while (questions.length < 25) {
      const n = questions.length + 1;
      questions.push({
        id: `${moduleId}-extra-${n}`,
        prompt: `Additional ${module.displayName} check ${n}: provide grounded metrics and next steps.`,
        kind: "data",
        moduleId,
        moduleLabel: module.displayName,
        expectTool: "northstar.queryModule",
      });
    }

    sections.push({
      id: moduleId,
      navOrder: navOrder++,
      label: module.label,
      kind: "workspace",
      moduleId,
      questions: questions.slice(0, 30),
    });
  }

  return sections;
}

export function countNorthstarEaTestQuestions(sections = buildNorthstarEaTestBank()) {
  return sections.reduce((sum, section) => sum + section.questions.length, 0);
}
