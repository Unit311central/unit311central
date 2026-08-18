import { createRequire } from "node:module";

type PptxGenConstructor = new () => PptxGenInstance;

export type PptxGenInstance = {
  addSlide: () => PptxSlide;
  defineSlideMaster: (master: Record<string, unknown>) => void;
  write: (options: { outputType: "nodebuffer" }) => Promise<Buffer>;
  ShapeType?: Record<string, string>;
  layout?: string;
  author?: string;
  company?: string;
  title?: string;
  subject?: string;
  theme?: Record<string, unknown>;
};

export type PptxSlide = {
  background?: { color?: string; fill?: string };
  addText: (...args: unknown[]) => void;
  addShape: (...args: unknown[]) => void;
  addImage: (...args: unknown[]) => void;
  addTable: (...args: unknown[]) => void;
};

export type PptxTableRow = unknown[];
export type PptxShapeName = string;

let cachedConstructor: PptxGenConstructor | null = null;

function resolvePptxGenConstructor(mod: unknown): PptxGenConstructor {
  const candidate =
    (mod as { default?: PptxGenConstructor }).default ?? (mod as PptxGenConstructor);
  if (typeof candidate === "function") return candidate;
  const nested = (candidate as { default?: PptxGenConstructor }).default;
  if (typeof nested === "function") return nested;
  throw new Error("pptxgenjs is unavailable in this runtime.");
}

function loadPptxGenConstructor(): PptxGenConstructor {
  if (cachedConstructor) return cachedConstructor;
  const require = createRequire(import.meta.url);
  const mod = require("pptxgenjs");
  cachedConstructor = resolvePptxGenConstructor(mod);
  return cachedConstructor;
}

export function createPptxGen(): PptxGenInstance {
  const PptxGen = loadPptxGenConstructor();
  return new PptxGen();
}

export async function createPptxGenAsync(): Promise<PptxGenInstance> {
  return createPptxGen();
}
