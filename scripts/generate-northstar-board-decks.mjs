import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateNorthstarBoardDeck } from "../src/lib/demo/northstar-board-deck-generator.ts";

const dates = ["2026-03-20", "2026-06-19", "2026-09-18", "2026-12-11"];

mkdirSync("public/samples", { recursive: true });

for (const meetingDate of dates) {
  const result = await generateNorthstarBoardDeck(meetingDate);
  const out = resolve("public/samples", result.filename);
  writeFileSync(out, result.pdfBytes);
  console.log(`Wrote ${out} (${result.pdfBytes.length} bytes)`);
}

console.log("Done — Northstar board decks in public/samples/");
