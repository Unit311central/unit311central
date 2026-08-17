export function getCursorAdminApiKey(): string | null {
  const key = process.env.CURSOR_ADMIN_API_KEY?.trim();
  return key || null;
}

export function isCursorBillingConfigured(): boolean {
  return Boolean(getCursorAdminApiKey());
}

export const CURSOR_API_BASE = "https://api.cursor.com";
