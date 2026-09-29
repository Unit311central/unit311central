import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getAuthSecret } from "@/lib/platform-session-token";

export type CronofyOAuthStatePayload = {
  nonce: string;
  platformUserId: string;
  workspaceId: string;
  meetingId: string;
  returnPath: string;
  exp: number;
};

const STATE_TTL_MS = 15 * 60 * 1000;

function sign(payloadB64: string): string {
  return createHmac("sha256", getAuthSecret()).update(payloadB64).digest("base64url");
}

export function createCronofyOAuthState(
  input: Omit<CronofyOAuthStatePayload, "nonce" | "exp">,
): string {
  const payload: CronofyOAuthStatePayload = {
    ...input,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + STATE_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyCronofyOAuthState(token: string): CronofyOAuthStatePayload | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = sign(payloadB64);
  try {
    const a = Buffer.from(sig, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as CronofyOAuthStatePayload;
    if (!payload.platformUserId || !payload.workspaceId || !payload.meetingId) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
