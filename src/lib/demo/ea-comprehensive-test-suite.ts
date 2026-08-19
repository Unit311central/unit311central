/**
 * Northstar EA comprehensive test suite + PDF report builders.
 */

import "server-only";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import {
  buildNorthstarEaTestBank,
  countNorthstarEaTestQuestions,
  type NorthstarEaTestSection,
} from "@/lib/demo/ea-module-test-bank";
import { runNorthstarEaTestQuestion, type NorthstarEaQuestionResult } from "@/lib/demo/ea-question-runner";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { jsPDF } from "jspdf";

export type NorthstarEaComprehensiveReport = {
  suite: "northstar-ea-comprehensive";
  version: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totalQuestions: number;
  passed: number;
  failed: number;
  ok: boolean;
  sections: Array<{
    id: string;
    label: string;
    navOrder: number;
    passed: number;
    failed: number;
    results: NorthstarEaQuestionResult[];
  }>;
};

const SUITE_VERSION = "northstar-ea-comprehensive-v2-acceptance";

export function demoEaTestBusiness(): AssistantBusinessContext {
  return {
    user: {
      id: "u-demo",
      username: "demo@unit311central.com",
      displayName: "Demo User",
      userType: "operator",
    },
    organisation: { id: "org-demo", name: "Northstar Industrial Technologies" },
    workspace: { id: "ws-demo", name: "Demo", slug: DEMO_WORKSPACE_SLUG },
    page: { activeView: "executive-assistant", label: "Executive Assistant" },
    selection: {},
    permissions: {
      roleView: "executive",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function getNorthstarEaTestBankSections(): NorthstarEaTestSection[] {
  return buildNorthstarEaTestBank();
}

export async function runNorthstarEaComprehensiveSuite(input?: {
  sectionId?: string;
  questionIds?: string[];
}): Promise<NorthstarEaComprehensiveReport> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const business = demoEaTestBusiness();
  const bank = buildNorthstarEaTestBank();
  const sections = input?.sectionId ? bank.filter((s) => s.id === input.sectionId) : bank;
  const questionFilter = input?.questionIds ? new Set(input.questionIds) : null;

  const outSections: NorthstarEaComprehensiveReport["sections"] = [];
  let passed = 0;
  let failed = 0;

  for (const section of sections) {
    const results: NorthstarEaQuestionResult[] = [];
    for (const question of section.questions) {
      if (questionFilter && !questionFilter.has(question.id)) continue;
      const result = await runNorthstarEaTestQuestion(question, business);
      results.push(result);
      if (result.status === "pass") passed += 1;
      else failed += 1;
    }
    outSections.push({
      id: section.id,
      label: section.label,
      navOrder: section.navOrder,
      passed: results.filter((r) => r.status === "pass").length,
      failed: results.filter((r) => r.status === "fail").length,
      results,
    });
  }

  const finishedAt = new Date().toISOString();
  return {
    suite: "northstar-ea-comprehensive",
    version: SUITE_VERSION,
    startedAt,
    finishedAt,
    durationMs: Date.now() - t0,
    totalQuestions: countNorthstarEaTestQuestions(bank),
    passed,
    failed,
    ok: failed === 0,
    sections: outSections,
  };
}

function pdfHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(title, 14, 12);
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(subtitle, 14, 20);
}

export function buildNorthstarEaModuleReportPdf(section: {
  label: string;
  passed: number;
  failed: number;
  results: NorthstarEaQuestionResult[];
}): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  pdfHeader(
    doc,
    `Northstar EA — ${section.label}`,
    `${section.passed} passed · ${section.failed} failed · ${new Date().toISOString().slice(0, 10)}`,
  );
  let y = 36;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  for (const row of section.results) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const status = row.status === "pass" ? "PASS" : "FAIL";
    doc.setFont("helvetica", "bold");
    doc.text(`[${status}] ${row.subModuleLabel ? `${row.subModuleLabel}: ` : ""}${row.prompt.slice(0, 90)}`, 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const detail = row.summary ?? row.error ?? "";
    const lines = doc.splitTextToSize(detail, 182);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 4;
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
  }
  return new Uint8Array(doc.output("arraybuffer"));
}

export function buildNorthstarEaSummaryReportPdf(report: NorthstarEaComprehensiveReport): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  pdfHeader(
    doc,
    "Northstar EA — Full Test Summary",
    `${report.passed}/${report.passed + report.failed} passed · ${report.durationMs}ms · ${report.version}`,
  );
  let y = 36;
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  for (const section of report.sections) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const ok = section.failed === 0;
    doc.setFont("helvetica", "bold");
    doc.text(
      `${ok ? "✓" : "✗"} ${section.label} — ${section.passed}/${section.passed + section.failed}`,
      14,
      y,
    );
    y += 6;
    if (!ok) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28);
      for (const fail of section.results.filter((r) => r.status === "fail").slice(0, 3)) {
        const line = doc.splitTextToSize(`${fail.prompt}: ${fail.error ?? ""}`, 182);
        doc.text(line, 18, y);
        y += line.length * 3.5;
      }
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
    }
    y += 4;
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
