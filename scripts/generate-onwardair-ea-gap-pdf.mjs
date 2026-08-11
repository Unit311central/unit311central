/**
 * OnwardAir Executive Assistant gap analysis PDF → user Desktop.
 * Usage: node scripts/generate-onwardair-ea-gap-pdf.mjs
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { jsPDF } from "jspdf";

const OUT = join(homedir(), "Desktop", "OnwardAir-EA-Gap-Analysis-2026-08-11.pdf");
const MARGIN = 16;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 287;

const sections = [
  {
    title: "Executive summary",
    bullets: [
      "Target: see all OnwardAir modules and answer any natural-language executive question.",
      "P0 implemented: onwardair.getExecutiveBriefing, getOrgHealth, queryActions, getBoardInsights, queryModule.",
      "Application Catalogue aliases extended for Fundraising, Engineering, OnwardAir Intelligence.",
      "Page guides added for Fundraising, Engineering, Competitor Intelligence, Board Dashboard.",
      "ABHI-grade conversational standard applied to OnwardAir system prompt.",
    ],
  },
  {
    title: "What works now",
    bullets: [
      "Platform navigation via listPlatformModules / searchApplications (all sidebar modules).",
      "Core ops reads: clients, projects, CRM, finance, HR, cash.",
      "OnwardAir executive intelligence across fundraising, engineering, board, competitors.",
      "Board pack and LMS course generation.",
      "Write path via Action Framework (clients richest; finance/calendar/projects thin).",
    ],
  },
  {
    title: "Remaining gaps (P2+)",
    bullets: [
      "Writable actions for Fundraising, Board, Engineering, Support, HR (read path done).",
      "Page guides for every child view (~100 views; top modules covered).",
      "data-ai-target instrumentation in workspace UI components.",
      "Client-portal scoped assistant.",
      "Retire legacy executive-assistant-ai dual chat stack.",
    ],
  },
  {
    title: "Module coverage after fix",
    bullets: [
      "Fundraising / Engineering / Intelligence / Board — live Q&A via onwardair.queryModule & briefing.",
      "Business Central, Financials, HR, Projects — existing search* + queryBusiness.",
      "Marketing, QMS, Technology, Support — catalogue navigation + generic queryBusiness; add tools if needed.",
    ],
  },
  {
    title: "Example questions now answered",
    bullets: [
      "Where are we on the seed raise?",
      "Which engineering milestones are at risk?",
      "Summarise competitor intelligence.",
      "What board actions are overdue?",
      "Give me an executive briefing / organisation health.",
      "What modules exist? Where is Fundraising?",
    ],
  },
];

const doc = new jsPDF({ unit: "mm", format: "a4" });
let y = 20;

doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text("OnwardAir Executive Assistant", MARGIN, y);
y += 8;
doc.setFontSize(11);
doc.setFont("helvetica", "normal");
doc.text("Gap analysis & fix summary — 11 Aug 2026", MARGIN, y);
y += 10;

for (const section of sections) {
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(section.title, MARGIN, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  for (const bullet of section.bullets) {
    const lines = doc.splitTextToSize(`• ${bullet}`, CONTENT_W - 4);
    if (y + lines.length * 4.5 > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, MARGIN + 2, y);
    y += lines.length * 4.5 + 1;
  }
  y += 4;
}

const total = doc.getNumberOfPages();
for (let p = 1; p <= total; p++) {
  doc.setPage(p);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`OnwardAir EA · Page ${p} of ${total}`, MARGIN, FOOTER_Y);
}

const buf = Buffer.from(doc.output("arraybuffer"));
writeFileSync(OUT, buf);
console.log(`Wrote ${OUT}`);
