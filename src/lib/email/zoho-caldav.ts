import { getAccountCredentials, ZOHO_CALDAV_HOST } from "@/lib/email/accounts";
import { EmailServiceError, type EmailAccountId } from "@/lib/email/types";
import type { EmailWorkspaceScope } from "@/lib/email-workspace";

export type ZohoCalendarEvent = {
  id: string;
  uid: string;
  summary: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  calendarName: string;
  calendarHref: string;
};

function authHeader(email: string, password: string) {
  return `Basic ${Buffer.from(`${email}:${password}`).toString("base64")}`;
}

function absoluteUrl(href: string, base: string) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractTag(xml: string, localName: string): string | null {
  const re = new RegExp(
    `<(?:[A-Za-z0-9_]+:)?${localName}[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_]+:)?${localName}>`,
    "i",
  );
  const match = xml.match(re);
  return match?.[1]?.trim() ? decodeXmlEntities(match[1].trim()) : null;
}

function extractHrefs(xml: string): string[] {
  const hrefs: string[] = [];
  const re = /<(?:[A-Za-z0-9_]+:)?href[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_]+:)?href>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const href = decodeXmlEntities(match[1].trim());
    if (href) hrefs.push(href);
  }
  return hrefs;
}

async function caldavRequest(
  url: string,
  method: string,
  email: string,
  password: string,
  body?: string,
  depth = "0",
): Promise<{ status: number; text: string; finalUrl: string }> {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    headers: {
      Authorization: authHeader(email, password),
      Depth: depth,
      "Content-Type": "application/xml; charset=utf-8",
      Accept: "application/xml, text/xml, */*",
    },
    body,
  });

  const text = await response.text();
  return { status: response.status, text, finalUrl: response.url || url };
}

function parseIcsDate(raw: string | undefined, params = ""): { iso: string; allDay: boolean } | null {
  if (!raw) return null;
  const value = raw.trim();
  if (/^\d{8}$/.test(value)) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    return { iso: `${year}-${month}-${day}T00:00:00.000Z`, allDay: true };
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s, z] = match;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${z || params.includes("VALUE=DATE") ? "Z" : "Z"}`;
  return { iso: new Date(iso).toISOString(), allDay: false };
}

function parseVevents(ics: string, calendarName: string, calendarHref: string): ZohoCalendarEvent[] {
  const blocks = ics.split(/BEGIN:VEVENT/i).slice(1);
  const events: ZohoCalendarEvent[] = [];

  for (const block of blocks) {
    const body = block.split(/END:VEVENT/i)[0] ?? "";
    const unfolded = body.replace(/\r?\n[ \t]/g, "");
    const get = (name: string) => {
      const re = new RegExp(`^${name}([^:]*):(.+)$`, "im");
      const match = unfolded.match(re);
      if (!match) return { params: "", value: "" };
      return { params: match[1] ?? "", value: (match[2] ?? "").trim() };
    };

    const uid = get("UID").value || `${calendarHref}-${events.length}`;
    const summary = get("SUMMARY").value || "(No title)";
    const description = get("DESCRIPTION").value.replace(/\\n/g, "\n").replace(/\\,/g, ",");
    const location = get("LOCATION").value.replace(/\\,/g, ",");
    const dtStart = get("DTSTART");
    const dtEnd = get("DTEND");
    const start = parseIcsDate(dtStart.value, dtStart.params);
    const end = parseIcsDate(dtEnd.value, dtEnd.params) ?? start;
    if (!start || !end) continue;

    events.push({
      id: `${calendarHref}:${uid}`,
      uid,
      summary,
      description,
      location,
      start: start.iso,
      end: end.iso,
      allDay: start.allDay,
      calendarName,
      calendarHref,
    });
  }

  return events;
}

async function discoverPrincipal(email: string, password: string): Promise<string> {
  const bases = [
    `${ZOHO_CALDAV_HOST.replace(/\/$/, "")}/.well-known/caldav`,
    `${ZOHO_CALDAV_HOST.replace(/\/$/, "")}/`,
  ];

  const body = `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:current-user-principal/></d:prop>
</d:propfind>`;

  for (const base of bases) {
    try {
      const result = await caldavRequest(base, "PROPFIND", email, password, body, "0");
      if (result.status >= 400) continue;
      const principal = extractTag(result.text, "href");
      if (principal) return absoluteUrl(principal, result.finalUrl);
    } catch (error) {
      console.warn("[email/caldav] principal discovery failed", base, error);
    }
  }

  throw new EmailServiceError(
    "Could not discover Zoho calendar principal for this mailbox.",
    "CONNECTION_FAILED",
  );
}

async function discoverCalendarHome(principalUrl: string, email: string, password: string) {
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><c:calendar-home-set/></d:prop>
</d:propfind>`;

  const result = await caldavRequest(principalUrl, "PROPFIND", email, password, body, "0");
  if (result.status >= 400) {
    throw new EmailServiceError("Zoho calendar home discovery failed.", "CONNECTION_FAILED");
  }

  const home = extractTag(result.text, "href");
  if (!home) {
    throw new EmailServiceError("Zoho calendar home set missing.", "CONNECTION_FAILED");
  }
  return absoluteUrl(home, result.finalUrl);
}

async function listCalendars(homeUrl: string, email: string, password: string) {
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <c:supported-calendar-component-set/>
  </d:prop>
</d:propfind>`;

  const result = await caldavRequest(homeUrl, "PROPFIND", email, password, body, "1");
  if (result.status >= 400) {
    throw new EmailServiceError("Zoho calendar list failed.", "CONNECTION_FAILED");
  }

  const responses = result.text.split(/<(?:[A-Za-z0-9_]+:)?response[\s>]/i).slice(1);
  const calendars: Array<{ href: string; name: string }> = [];

  for (const chunk of responses) {
    if (!/calendar/i.test(chunk)) continue;
    if (/inbox|outbox|schedule/i.test(chunk) && !/VEVENT/i.test(chunk)) continue;
    const href = extractTag(chunk, "href");
    if (!href) continue;
    const name = extractTag(chunk, "displayname") || "Calendar";
    calendars.push({ href: absoluteUrl(href, result.finalUrl), name });
  }

  return calendars;
}

async function fetchCalendarEvents(
  calendarHref: string,
  calendarName: string,
  email: string,
  password: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<ZohoCalendarEvent[]> {
  const start = rangeStart.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const end = rangeEnd.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const body = `<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${start}" end="${end}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const result = await caldavRequest(calendarHref, "REPORT", email, password, body, "1");
  if (result.status >= 400) {
    console.warn("[email/caldav] calendar REPORT failed", calendarHref, result.status);
    return [];
  }

  const dataBlocks =
    result.text.match(
      /<(?:[A-Za-z0-9_]+:)?calendar-data[^>]*>[\s\S]*?<\/(?:[A-Za-z0-9_]+:)?calendar-data>/gi,
    ) ?? [];

  const events: ZohoCalendarEvent[] = [];
  for (const block of dataBlocks) {
    const ics = decodeXmlEntities(
      block.replace(/^<[^>]+>/, "").replace(/<\/[^>]+>$/, "").trim(),
    );
    events.push(...parseVevents(ics, calendarName, calendarHref));
  }

  // Some Zoho responses nest hrefs for individual event resources.
  if (events.length === 0) {
    for (const href of extractHrefs(result.text)) {
      if (!href || href === calendarHref) continue;
      try {
        const eventRes = await caldavRequest(
          absoluteUrl(href, calendarHref),
          "GET",
          email,
          password,
        );
        if (eventRes.status < 400 && /BEGIN:VEVENT/i.test(eventRes.text)) {
          events.push(...parseVevents(eventRes.text, calendarName, calendarHref));
        }
      } catch {
        // ignore individual event fetch failures
      }
    }
  }

  return events;
}

export async function fetchZohoMailboxCalendar(
  accountId: EmailAccountId,
  scope?: EmailWorkspaceScope,
): Promise<{
  accountId: EmailAccountId;
  email: string;
  calendars: Array<{ href: string; name: string }>;
  events: ZohoCalendarEvent[];
}> {
  let credentials: { email: string; password: string };
  try {
    credentials = await getAccountCredentials(accountId, scope);
  } catch (error) {
    throw new EmailServiceError(
      error instanceof Error ? error.message : "Mailbox credentials not configured.",
      "NOT_CONFIGURED",
    );
  }

  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(now);
  rangeEnd.setDate(rangeEnd.getDate() + 60);

  try {
    const principal = await discoverPrincipal(credentials.email, credentials.password);
    const home = await discoverCalendarHome(principal, credentials.email, credentials.password);
    const calendars = await listCalendars(home, credentials.email, credentials.password);

    if (calendars.length === 0) {
      return {
        accountId,
        email: credentials.email,
        calendars: [],
        events: [],
      };
    }

    const nested = await Promise.all(
      calendars.slice(0, 6).map((calendar) =>
        fetchCalendarEvents(
          calendar.href,
          calendar.name,
          credentials.email,
          credentials.password,
          rangeStart,
          rangeEnd,
        ),
      ),
    );

    const events = nested
      .flat()
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return {
      accountId,
      email: credentials.email,
      calendars,
      events,
    };
  } catch (error) {
    if (error instanceof EmailServiceError) throw error;
    throw new EmailServiceError(
      error instanceof Error ? error.message : "Failed to load Zoho calendar.",
      "CONNECTION_FAILED",
    );
  }
}
