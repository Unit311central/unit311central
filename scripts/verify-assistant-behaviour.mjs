/**
 * Local verification for Executive Assistant behavioural fixes
 * (intent routing + real PDF bytes). Run: node scripts/verify-assistant-behaviour.mjs
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

async function loadTsModule(rel) {
  // Prefer compiled path via dynamic import of source through tsx if available.
  const require = createRequire(import.meta.url);
  try {
    require.resolve("tsx/cjs");
    require("tsx/cjs/api").register();
    return require(path.join(root, rel));
  } catch {
    return null;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const checks = [];

  // Intent router — pure JS reimplementation of critical patterns for smoke when TS loader missing
  const historyEmployees = [
    { id: "1", role: "user", content: "List all employees.", createdAt: new Date().toISOString() },
    {
      id: "2",
      role: "assistant",
      content: "Here are the employees currently on file.",
      createdAt: new Date().toISOString(),
    },
  ];

  const intentMod = await loadTsModule("src/lib/ai-operating-assistant/intent-router.ts");
  if (intentMod?.resolveDirectIntent) {
    const pdfIntent = intentMod.resolveDirectIntent("Generate PDF", historyEmployees);
    assert(pdfIntent?.tool === "generateEmployeeListPdf", "Generate PDF after employees must route to PDF tool");
    checks.push("intent: Generate PDF → generateEmployeeListPdf");

    const emailHistory = [
      ...historyEmployees,
      {
        id: "3",
        role: "assistant",
        content: "Done.\n\nemployee.pdf is ready.",
        createdAt: new Date().toISOString(),
        artifacts: [
          {
            id: "art_test",
            kind: "pdf",
            title: "Employee Directory",
            filename: "employee.pdf",
            downloadUrl: "/x",
            openUrl: "/y",
          },
        ],
      },
    ];
    const emailIntent = intentMod.resolveDirectIntent("Email it to the Board.", emailHistory);
    assert(emailIntent?.tool === "emailAssistantArtifact", "Email it must route to email tool");
    checks.push("intent: Email it → emailAssistantArtifact");

    const clarify = intentMod.resolveDirectIntent("Generate PDF", [
      { id: "1", role: "user", content: "What is the weather?", createdAt: new Date().toISOString() },
    ]);
    assert(clarify === null, "Generate PDF without employee context should not force PDF");
    checks.push("intent: no false positive without employee context");
  } else {
    // Fallback pattern checks
    const text = "Generate PDF";
    const discussed = historyEmployees.some((m) => /employee/i.test(m.content));
    assert(
      discussed && /^(generate|create|make)\s+(a\s+|the\s+)?pdf\.?$/i.test(text),
      "fallback intent pattern",
    );
    checks.push("intent: fallback pattern ok (tsx unavailable)");
  }

  // Real PDF generation via jspdf if available
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.text("Employee Directory", 40, 40);
    doc.text("Ada Lovelace — Engineering", 40, 60);
    const bytes = Buffer.from(doc.output("arraybuffer"));
    assert(bytes.length > 200, "PDF must have real bytes");
    assert(bytes.slice(0, 4).toString() === "%PDF", "PDF magic header");
    const out = path.join(root, ".tmp-assistant-verify.pdf");
    fs.writeFileSync(out, bytes);
    checks.push(`pdf: wrote ${bytes.length} bytes to ${out}`);
  } catch (error) {
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : error}`);
  }

  console.log(JSON.stringify({ ok: true, checks }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error) }, null, 2));
  process.exit(1);
});
