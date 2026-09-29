import {
  cronofyApiUrl,
  requireCronofyConfig,
  type CronofyConfig,
} from "@/lib/cronofy/config";

export type CronofyTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  sub: string;
  linking_profile?: {
    provider_name?: string;
    profile_name?: string;
  };
};

export type CronofyCalendar = {
  calendar_id: string;
  calendar_name: string;
  calendar_readonly: boolean;
  calendar_deleted: boolean;
  calendar_primary: boolean;
  calendar_integrated_conferencing_available: boolean;
  provider_name: string;
  profile_name: string;
};

export type CronofyEventConferencing =
  | { pending: true }
  | {
      pending?: false;
      provider_name?: string;
      join_url?: string;
      profile_id?: string;
    };

export type CronofyEvent = {
  event_id: string;
  summary: string;
  start: string;
  end: string;
  conferencing?: CronofyEventConferencing;
};

async function cronofyFormPost<T>(
  path: string,
  body: Record<string, string>,
  config: CronofyConfig = requireCronofyConfig(),
): Promise<T> {
  const res = await fetch(cronofyApiUrl(path, config), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
    body: new URLSearchParams(body).toString(),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; error_description?: string };
  if (!res.ok) {
    const message =
      (data as { error_description?: string }).error_description ||
      (data as { error?: string }).error ||
      `Cronofy request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export async function exchangeCronofyAuthorizationCode(args: {
  code: string;
  redirectUri: string;
}): Promise<CronofyTokenResponse> {
  const config = requireCronofyConfig();
  return cronofyFormPost<CronofyTokenResponse>("/oauth/token", {
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: args.code,
    redirect_uri: args.redirectUri,
  });
}

export async function refreshCronofyAccessToken(refreshToken: string): Promise<CronofyTokenResponse> {
  const config = requireCronofyConfig();
  return cronofyFormPost<CronofyTokenResponse>("/oauth/token", {
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  });
}

async function cronofyBearerGet<T>(path: string, accessToken: string): Promise<T> {
  const config = requireCronofyConfig();
  const res = await fetch(cronofyApiUrl(path, config), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; error_description?: string };
  if (!res.ok) {
    const message =
      (data as { error_description?: string }).error_description ||
      (data as { error?: string }).error ||
      `Cronofy API failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function cronofyBearerPost(path: string, accessToken: string, body: unknown): Promise<Response> {
  const config = requireCronofyConfig();
  return fetch(cronofyApiUrl(path, config), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
}

export async function listCronofyCalendars(accessToken: string): Promise<CronofyCalendar[]> {
  const data = await cronofyBearerGet<{ calendars?: CronofyCalendar[] }>("/v1/calendars", accessToken);
  return data.calendars ?? [];
}

export async function createOrUpdateCronofyEvent(args: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  summary: string;
  start: string;
  end: string;
  tzid: string;
  conferencingProfileId: "default" | "integrated";
  description?: string;
}): Promise<void> {
  const res = await cronofyBearerPost(
    `/v1/calendars/${encodeURIComponent(args.calendarId)}/events`,
    args.accessToken,
    {
      event_id: args.eventId,
      summary: args.summary,
      description: args.description ?? "",
      start: args.start,
      end: args.end,
      tzid: args.tzid,
      conferencing: {
        profile_id: args.conferencingProfileId,
      },
    },
  );
  if (!res.ok && res.status !== 202) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string };
    throw new Error(data.error_description || data.error || `Cronofy event create failed (${res.status})`);
  }
}

export async function readCronofyEvents(args: {
  accessToken: string;
  calendarId: string;
  from: string;
  to: string;
}): Promise<CronofyEvent[]> {
  const params = new URLSearchParams({
    calendar_ids: args.calendarId,
    from: args.from,
    to: args.to,
    include_deleted: "false",
  });
  const data = await cronofyBearerGet<{ events?: CronofyEvent[] }>(
    `/v1/events?${params.toString()}`,
    args.accessToken,
  );
  return data.events ?? [];
}

export function extractJoinUrlFromConferencing(
  conferencing: CronofyEventConferencing | undefined,
): { joinUrl: string | null; provider: string | null; pending: boolean } {
  if (!conferencing) return { joinUrl: null, provider: null, pending: false };
  if ("pending" in conferencing && conferencing.pending === true) {
    return { joinUrl: null, provider: null, pending: true };
  }
  const joinUrl = typeof conferencing.join_url === "string" ? conferencing.join_url.trim() : "";
  const provider =
    typeof conferencing.provider_name === "string" ? conferencing.provider_name.trim() : null;
  return { joinUrl: joinUrl || null, provider, pending: false };
}

export function pickWritableCalendarForConferencing(
  calendars: CronofyCalendar[],
): { calendar: CronofyCalendar; integratedAvailable: boolean } | null {
  const usable = calendars.filter((c) => !c.calendar_deleted && !c.calendar_readonly);
  const primary =
    usable.find((c) => c.calendar_primary) ??
    usable.find((c) => c.calendar_integrated_conferencing_available) ??
    usable[0];
  if (!primary) return null;
  return {
    calendar: primary,
    integratedAvailable: Boolean(primary.calendar_integrated_conferencing_available),
  };
}

export function buildCronofyAuthorizeUrl(args: {
  redirectUri: string;
  state: string;
  scope?: string;
}): string {
  const config = requireCronofyConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: args.redirectUri,
    scope: args.scope ?? "read_write",
    state: args.state,
    avoid_linking: "true",
  });
  return `${config.siteHost.replace(/\/+$/, "")}/oauth/authorize?${params.toString()}`;
}
