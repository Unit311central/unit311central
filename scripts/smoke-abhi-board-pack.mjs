import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);

async function loadTs(rel) {
  const href = pathToFileURL(resolve(process.cwd(), rel)).href;
  return import(href);
}

const { buildAbhiBoardPackData } = await loadTs("src/lib/abhi/board-pack-model.ts");
const { buildAbhiBoardPackPptx, abhiBoardPackPptxFileName } = await loadTs(
  "src/lib/abhi/board-pack-pptx.ts",
);
const { buildAbhiBoardPackPdf, abhiBoardPackPdfFileName } = await loadTs(
  "src/lib/abhi/board-pack-pdf.ts",
);
const { resolveAbhiBoardPackIntent } = await loadTs("src/lib/abhi/board-pack-intent.ts");

const data = buildAbhiBoardPackData("2026-08-03");
const logo =
  "data:image/jpeg;base64," +
  readFileSync("public/images/workspaces/abhi.jpg").toString("base64");
const pptx = await buildAbhiBoardPackPptx(data, logo);
const pdf = await buildAbhiBoardPackPdf(data, logo);
mkdirSync(".tmp-boardpack", { recursive: true });
const pptxName = abhiBoardPackPptxFileName(data.meetingDate);
const pdfName = abhiBoardPackPdfFileName(data.meetingDate);
writeFileSync(`.tmp-boardpack/${pptxName}`, pptx);
writeFileSync(`.tmp-boardpack/${pdfName}`, pdf);

const samples = [
  "Create a board pack for tomorrow",
  "Generate board papers",
  "Prepare tomorrow's board meeting pack",
  "Create a board deck",
  "Build a board presentation",
  "Prepare next week's board materials",
  "Generate a board report",
  "What is the weather",
];

console.log(
  JSON.stringify(
    {
      packName: data.packName,
      orgStatus: data.orgStatus,
      pptxBytes: pptx.byteLength,
      pdfBytes: pdf.byteLength,
      files: [pptxName, pdfName],
      intents: samples.map((s) => ({ s, hit: Boolean(resolveAbhiBoardPackIntent(s)) })),
    },
    null,
    2,
  ),
);

void require;
