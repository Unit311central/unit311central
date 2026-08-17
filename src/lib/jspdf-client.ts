import JsPdfImport from "jspdf";

type JsPdfConstructor = typeof import("jspdf").jsPDF;

export function createJsPdf(...args: ConstructorParameters<JsPdfConstructor>): InstanceType<JsPdfConstructor> {
  const candidate =
    (JsPdfImport as { jsPDF?: JsPdfConstructor; default?: { jsPDF?: JsPdfConstructor } }).jsPDF ??
    (JsPdfImport as { default?: JsPdfConstructor }).default ??
    (JsPdfImport as unknown as JsPdfConstructor);
  if (typeof candidate !== "function") {
    throw new Error("jspdf is unavailable in this runtime.");
  }
  return new candidate(...args);
}

export type JsPdfDocument = InstanceType<JsPdfConstructor>;
