import { scryptSync, timingSafeEqual } from "node:crypto";

import { normalizePlatformUsername } from "@/lib/platform-auth";

/** SAEC Current Systems Discovery questionnaire operator (apex login). */
export const SAEC_DISCOVERY_USERNAME = "discovery@unit311central.com";

/** Stable platform user id — credential login and DB provisioning must match. */
export const SAEC_DISCOVERY_USER_ID = "00000000-0000-4000-8000-00000000sd01";

export const SAEC_DISCOVERY_DISPLAY_NAME = "SAEC Discovery";

const DISCOVERY_PASSWORD_SALT = `${SAEC_DISCOVERY_USERNAME}-saec-discovery-v1`;

/** Default when SAEC_DISCOVERY_PASSWORD is unset — override in Vercel for client handoff. */
export const SAEC_DISCOVERY_DEFAULT_PASSWORD = "SaecDiscovery2026$";

const DISCOVERY_PASSWORD_HASH =
  "8ad98de33b72609767faa7186ea97be8edecabf21fa0eb256df34bd593d0501f3f9328df6217c5243d35b5376081d02bdfc4661e96db7d31cc540093f7cad409";

/** Password used to provision the discovery platform user (env override wins). */
export function resolveSaecDiscoveryProvisionPassword(input?: string | null): string {
  const fromInput = String(input ?? "").trim();
  if (fromInput) return fromInput;
  const fromEnv = String(process.env.SAEC_DISCOVERY_PASSWORD ?? "").trim();
  if (fromEnv) return fromEnv;
  return SAEC_DISCOVERY_DEFAULT_PASSWORD;
}

export function isSaecDiscoveryUsername(username: string | null | undefined): boolean {
  return (
    normalizePlatformUsername(String(username ?? "")) ===
    normalizePlatformUsername(SAEC_DISCOVERY_USERNAME)
  );
}

export function verifySaecDiscoveryPassword(password: string): boolean {
  const fromEnv = String(process.env.SAEC_DISCOVERY_PASSWORD ?? "").trim();
  if (fromEnv && password === fromEnv) {
    return true;
  }
  if (!password) return false;
  const candidate = scryptSync(password, DISCOVERY_PASSWORD_SALT, 64).toString("hex");
  try {
    return timingSafeEqual(
      Buffer.from(DISCOVERY_PASSWORD_HASH, "hex"),
      Buffer.from(candidate, "hex"),
    );
  } catch {
    return false;
  }
}

export function wantsSaecDiscoveryPostLogin(nextRaw: string | null | undefined): boolean {
  const next = String(nextRaw ?? "").trim();
  if (!next) return false;
  const path = next.split("?")[0];
  return path === "/saec-discovery" || path.startsWith("/saec-discovery/");
}
