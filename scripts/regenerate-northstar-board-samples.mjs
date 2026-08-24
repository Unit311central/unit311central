import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildNorthstarBoardPackData } from "../src/lib/demo/northstar-board-pack-model.ts";
import { northstarBoardDeckPdfFileName } from "../src/lib/demo/northstar-board-pack-model.ts";
import { buildOnwardAirBoardPackPdf } from "../src/lib/onwardair/board-pack-pdf.ts";

const dates = ["2026-03-20", "2026-06-19", "2026-09-18", "2026-12-11"];
const logoBytes = await readFile(join(process.cwd(), "public/images/workspaces/northstar-logo-print.jpg"));
const logoDataUrl = `data:image/jpeg;base64,${logoBytes.toString("base64")}`;

await mkdir(join(process.cwd(), "public/samples"), { recursive: true });

for (const meetingDate of dates) {
  const data = buildNorthstarBoardPackData(meetingDate);
  const pdfBytes = await buildOnwardAirBoardPackPdf(data, logoDataUrl);
  const filename = northstarBoardDeckPdfFileName(meetingDate);
  await writeFile(join(process.cwd(), "public/samples", filename), Buffer.from(pdfBytes));
  console.log("wrote", filename, pdfBytes.length, "bytes");
}
