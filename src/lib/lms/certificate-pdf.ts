import { jsPDF } from "jspdf";

import type { LmsCertificate } from "@/lib/lms/types";

export function buildLmsCertificatePdf(options: {
  certificate: LmsCertificate;
  workspaceName: string;
  verifyUrl: string;
}): Uint8Array {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(7, 17, 31);
  doc.rect(0, 0, w, h, "F");
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, w - 20, h - 20);

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(options.workspaceName.toUpperCase(), w / 2, 28, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(160, 174, 192);
  doc.text("Certificate of Completion", w / 2, 40, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(options.certificate.courseTitle, w / 2, 58, {
    align: "center",
    maxWidth: w - 40,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(203, 213, 225);
  doc.text("This certifies that", w / 2, 78, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(options.certificate.learnerName, w / 2, 92, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `of ${options.certificate.companyName || "Portfolio Company"} has successfully completed this programme.`,
    w / 2,
    104,
    { align: "center", maxWidth: w - 50 },
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`Score: ${options.certificate.score}%`, w / 2 - 40, 122);
  doc.text(
    `Date: ${new Date(options.certificate.issuedAt).toLocaleDateString("en-GB")}`,
    w / 2 + 20,
    122,
  );

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Certificate ID: ${options.certificate.certificateNumber}`, w / 2, 140, {
    align: "center",
  });
  doc.text(`Verify: ${options.verifyUrl}`, w / 2, 148, {
    align: "center",
    maxWidth: w - 40,
  });

  doc.setDrawColor(100, 116, 139);
  doc.line(40, 165, 100, 165);
  doc.line(w - 100, 165, w - 40, 165);
  doc.setFontSize(9);
  doc.text("Authorised Signatory", 70, 172, { align: "center" });
  doc.text("Compliance Office", w - 70, 172, { align: "center" });

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
