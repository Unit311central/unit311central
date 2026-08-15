export function getVercelApiToken(): string | null {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  return token || null;
}

export function getVercelTeamId(): string | null {
  return (
    process.env.VERCEL_TEAM_ID?.trim() ||
    process.env.VERCEL_ORG_ID?.trim() ||
    null
  );
}

export function getVercelTeamSlug(): string | null {
  return process.env.VERCEL_TEAM_SLUG?.trim() || null;
}

export function isVercelBillingConfigured(): boolean {
  return Boolean(getVercelApiToken() && getVercelTeamId() && getVercelTeamSlug());
}

export const VERCEL_API_BASE = "https://api.vercel.com";
