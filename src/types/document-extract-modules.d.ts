declare module "mammoth" {
  export function extractRawText(input: {
    buffer: Buffer;
  }): Promise<{ value: string; messages: unknown[] }>;
}

declare module "unpdf" {
  export function extractText(
    data: Uint8Array,
    options?: { mergePages?: boolean },
  ): Promise<{ text: string | string[]; totalPages?: number }>;
}
