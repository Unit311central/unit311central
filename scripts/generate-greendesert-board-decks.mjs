import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateGreenDesertBoardDeck } from "../src/lib/greendesert/greendesert-board-deck-generator.ts";

const dates = ["2026-09-05", "2026-09-18"];

mkdirSync("public/samples", { recursive: true });

for (const meetingDate of dates) {
  const result = await generateGreenDesertBoardDeck(meetingDate);
  const out = resolve("public/samples", result.filename);
  writeFileSync(out, result.pdfBytes);
  console.log(`Wrote ${out} (${result.pdfBytes.length} bytes, ${result.pageCount} slides)`);
}

console.log("Done — Green Desert board decks in public/samples/");
