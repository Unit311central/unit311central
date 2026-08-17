import { jsPDF } from "jspdf";

type JsPdfConstructor = typeof jsPDF;

export function createJsPdf(...args: ConstructorParameters<JsPdfConstructor>): InstanceType<JsPdfConstructor> {
  return new jsPDF(...args);
}

export type JsPdfDocument = InstanceType<JsPdfConstructor>;
