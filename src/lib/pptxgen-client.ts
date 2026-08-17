import type PptxGenType from "pptxgenjs";

type PptxGenConstructor = typeof import("pptxgenjs").default;

function resolvePptxGenConstructor(mod: unknown): PptxGenConstructor {
  const candidate =
    (mod as { default?: PptxGenConstructor }).default ??
  (mod as PptxGenConstructor);
  if (typeof candidate === "function") return candidate;
  const nested = (candidate as { default?: PptxGenConstructor }).default;
  if (typeof nested === "function") return nested;
  throw new Error("pptxgenjs is unavailable in this runtime.");
}

export type PptxGenInstance = InstanceType<PptxGenConstructor>;
export type PptxSlide = PptxGenType.Slide;
export type PptxTableRow = PptxGenType.TableRow;
export type PptxShapeName = PptxGenType.SHAPE_NAME;

export function createPptxGen(): PptxGenInstance {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("pptxgenjs") as unknown;
  const PptxGen = resolvePptxGenConstructor(mod);
  return new PptxGen();
}

export async function createPptxGenAsync(): Promise<PptxGenInstance> {
  const mod = await import("pptxgenjs");
  const PptxGen = resolvePptxGenConstructor(mod);
  return new PptxGen();
}

export type { default as PptxGenType } from "pptxgenjs";
