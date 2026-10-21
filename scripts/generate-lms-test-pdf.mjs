/**
 * Generic incident-reporting procedure PDF for LMS upload tests (not production content).
 */
import fs from "node:fs";
import { PDFDocument, StandardFonts } from "pdf-lib";

const text = `
Incident Reporting and Escalation Procedure

1. Identify and classify the incident severity (low, medium, high).
2. Notify the duty manager immediately using the approved communication channel.
3. If severity is high, escalate to the compliance lead within one hour.
4. Record the incident in the central register with time, location, and witnesses.
5. Assign an owner to coordinate containment actions.
6. Conduct a brief review and document lessons learned before closing the case.
`.trim();

async function main() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const lines = text.split("\n");
  let y = 740;
  for (const line of lines) {
    page.drawText(line, { x: 48, y, size: line.startsWith("Incident") ? 14 : 11, font });
    y -= line.startsWith("Incident") ? 28 : 18;
  }
  const bytes = await doc.save();
  const dir = "/opt/cursor/artifacts";
  fs.mkdirSync(dir, { recursive: true });
  for (const name of [
    "Talanton_Sample_Compliance_Procedure_Incident_Reporting.pdf",
    "Talanton_Sample_Compliance_Procedure_Incident_Reporting(1).pdf",
  ]) {
    const out = `${dir}/${name}`;
    fs.writeFileSync(out, bytes);
    console.log(`Wrote ${out} (${bytes.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
