import PptxGenJSImport from "pptxgenjs";
import type PptxGenType from "pptxgenjs";

type PptxGenConstructor = typeof import("pptxgenjs").default;

function resolvePptxGenConstructor(): PptxGenConstructor {
  const candidate =
    (PptxGenJSImport as { default?: PptxGenConstructor }).default ?? PptxGenJSImport;
  if (typeof candidate !== "function") {
    throw new Error("pptxgenjs is unavailable in this runtime.");
  }
  return candidate;
}

export type PptxGenInstance = InstanceType<PptxGenConstructor>;
export type PptxSlide = PptxGenType.Slide;
export type PptxTableRow = PptxGenType.TableRow;
export type PptxShapeName = PptxGenType.SHAPE_NAME;

export function createPptxGen(): PptxGenInstance {
  const PptxGen = resolvePptxGenConstructor();
  return new PptxGen();
}

export type { default as PptxGenType } from "pptxgenjs";
