import { readFileSync } from "node:fs";

const text = readFileSync(".tmp-clarity-env.txt", "utf8");
let foundToken = false;
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^(NEXT_PUBLIC_CLARITY_(?:PROJECT_ID|DASHBOARD_URL))=(.*)$/);
  if (m) {
    const value = m[2].replace(/^"|"$/g, "");
    console.log(`${m[1]}=${value}`);
  }
  if (line.startsWith("CLARITY_API_TOKEN=")) {
    foundToken = true;
    const value = line.slice("CLARITY_API_TOKEN=".length).replace(/^"|"$/g, "");
    console.log(`CLARITY_API_TOKEN=PRESENT length=${value.length}`);
  }
}
if (!foundToken) console.log("CLARITY_API_TOKEN=ABSENT");
