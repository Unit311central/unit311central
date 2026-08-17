export function getOpenAiAdminApiKey(): string | null {
  const key =
    process.env.OPENAI_ADMIN_API_KEY?.trim() ||
    process.env.OPENAI_ADMIN_KEY?.trim() ||
    null;
  return key || null;
}

export function isOpenAiBillingConfigured(): boolean {
  return Boolean(getOpenAiAdminApiKey());
}

export const OPENAI_API_BASE = "https://api.openai.com/v1";
