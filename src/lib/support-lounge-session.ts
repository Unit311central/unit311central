import { cookies } from "next/headers";

import { createRequesterAnonId } from "@/lib/support-lounge-service";

const COOKIE_PREFIX = "u311_sl_rid_";
const MAX_AGE = 60 * 60 * 24 * 400;

function cookieNameForLounge(loungeToken: string) {
  const safe = loungeToken.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
  return `${COOKIE_PREFIX}${safe || "default"}`;
}

export async function readOrCreateLoungeRequesterId(loungeToken: string): Promise<{
  requesterAnonId: string;
  setCookie?: { name: string; value: string; maxAge: number };
}> {
  const name = cookieNameForLounge(loungeToken);
  const jar = await cookies();
  const existing = jar.get(name)?.value?.trim();
  if (existing && existing.length >= 8) {
    return { requesterAnonId: existing };
  }
  const requesterAnonId = createRequesterAnonId();
  return {
    requesterAnonId,
    setCookie: { name, value: requesterAnonId, maxAge: MAX_AGE },
  };
}

export function applyLoungeRequesterCookie(
  responseHeaders: Headers,
  setCookie: { name: string; value: string; maxAge: number },
) {
  const parts = [
    `${setCookie.name}=${encodeURIComponent(setCookie.value)}`,
    "Path=/",
    `Max-Age=${setCookie.maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  responseHeaders.append("Set-Cookie", parts.join("; "));
}
