import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { buildNorthstarBoardPackData } from "../src/lib/demo/northstar-board-pack-model.ts";
import { buildOnwardAirBoardPackPdf } from "../src/lib/onwardair/board-pack-pdf.ts";

const data = buildNorthstarBoardPackData("2026-03-20");
const bytes = await readFile(join(process.cwd(), "public/images/workspaces/northstar-logo-print.jpg"));
const logoDataUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`;
const pdfBytes = await buildOnwardAirBoardPackPdf(data, logoDataUrl);
console.log("pdf bytes", pdfBytes.length);
