import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const SENSITIVE_KEY =
  /password|secret|token|authorization|cookie|api[_-]?key|dsn|credential|session|email|bearer/i;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function scrubString(value: string): string {
  return value.replace(EMAIL_PATTERN, "[redacted-email]");
}

function scrubValue(value: unknown): unknown {
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map(scrubValue);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) {
        out[key] = "[Filtered]";
      } else {
        out[key] = scrubValue(nested);
      }
    }
    return out;
  }
  return value;
}

/** Strip credentials, tokens, and email addresses before events leave Unit311. */
export function scrubSentryEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  if (event.extra) {
    event.extra = scrubValue(event.extra) as Record<string, unknown>;
  }

  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as typeof event.contexts;
  }

  if (event.message && typeof event.message === "string") {
    event.message = scrubString(event.message);
  }

  return event;
}
