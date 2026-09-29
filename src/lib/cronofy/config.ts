/**
 * Cronofy application configuration (server-side only).
 */

export type CronofyConfig = {
  sdkId: string;
  apiHost: string;
  siteHost: string;
  clientId: string;
  clientSecret: string;
};

function trimHost(value: string | undefined, fallback: string): string {
  const v = String(value ?? "").trim().replace(/\/+$/, "");
  return v || fallback;
}

export function getCronofyConfig(): CronofyConfig | null {
  const clientId = process.env.CRONOFY_CLIENT_ID?.trim();
  const clientSecret = process.env.CRONOFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  return {
    sdkId: process.env.CRONOFY_SDK_ID?.trim() || "Us",
    apiHost: trimHost(process.env.CRONOFY_API_HOST, "https://api.cronofy.com"),
    siteHost: trimHost(process.env.CRONOFY_SITE_HOST, "https://app.cronofy.com"),
    clientId,
    clientSecret,
  };
}

export function requireCronofyConfig(): CronofyConfig {
  const config = getCronofyConfig();
  if (!config) {
    throw new Error(
      "Cronofy is not configured. Set CRONOFY_CLIENT_ID and CRONOFY_CLIENT_SECRET on the server.",
    );
  }
  return config;
}

export function cronofyApiUrl(path: string, config: CronofyConfig = requireCronofyConfig()): string {
  const base = config.apiHost.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function cronofySiteUrl(path: string, config: CronofyConfig = requireCronofyConfig()): string {
  const base = config.siteHost.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Default tzid for Talanton board meetings when user timezone is unknown. */
export const TALANTON_BOARD_MEETING_TZID = "America/New_York";
