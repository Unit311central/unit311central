import OpenAI from "openai";

const DEFAULT_MODEL = process.env.OPENAI_ASSISTANT_MODEL?.trim() || "gpt-4o-mini";
const MAX_RETRIES = 3;

export function getAssistantModel() {
  return DEFAULT_MODEL;
}

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Set it in the server environment (never expose it to the browser).",
    );
  }

  return new OpenAI({
    apiKey,
    maxRetries: MAX_RETRIES,
  });
}

export type ResponsesCreateParams = Parameters<OpenAI["responses"]["create"]>[0];

export async function createAssistantResponse(params: ResponsesCreateParams) {
  const client = createOpenAIClient();
  return client.responses.create({
    ...params,
    model: params.model ?? DEFAULT_MODEL,
  });
}

export function isRetryableOpenAIError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error ? Number((error as { status?: number }).status) : NaN;
  return status === 408 || status === 429 || status >= 500;
}

export function formatOpenAIError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "OpenAI request failed";
}
