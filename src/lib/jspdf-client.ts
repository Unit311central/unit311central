import { jsPDF, type jsPDF as JsPdfDocument } from "jspdf";

type JsPdfOptions = {
  orientation?: "portrait" | "landscape" | "p" | "l";
  unit?: string;
  format?: string | number[];
  compress?: boolean;
  precision?: number;
  userUnit?: number;
  encryption?: object;
  putOnlyUsedFonts?: boolean;
  floatPrecision?: number | "smart";
};

export function createJsPdf(options?: JsPdfOptions): JsPdfDocument {
  return new jsPDF(options as never);
}

export type { JsPdfDocument };
