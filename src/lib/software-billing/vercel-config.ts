export function getVercelApiToken(): string | null {
  const token = process.env.VERCEL_API_TOKEN?.trim();
  return token || null;
}

export function getVercelTeamId(): string {
  return (
    process.env.VERCEL_TEAM_ID?.trim() ||
    process.env.VERCEL_ORG_ID?.trim() ||
    "team_DTE6ypjm9RQZuOjFX9epv7Ta"
  );
}

export function getVercelTeamSlug(): string {
  return process.env.VERCEL_TEAM_SLUG?.trim() || "paul-fs-projects-9f603a39";
}

export function isVercelBillingConfigured(): boolean {
  return Boolean(getVercelApiToken());
}

export const VERCEL_API_BASE = "https://api.vercel.com";
