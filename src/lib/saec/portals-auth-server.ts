import "server-only";

import { scryptSync, timingSafeEqual } from "node:crypto";

import { OMNITRANSIT_PORTALS_DEMO_USERNAME } from "@/lib/saec/portals-auth";

/** Scrypt hash for portal demo password — plaintext is not stored in source. */
const PORTAL_PASSWORD_SALT = `${OMNITRANSIT_PORTALS_DEMO_USERNAME}-omnitransit-portal-v1`;
const PORTAL_PASSWORD_HASH =
  "40afe1bd6eefdcc4304868909dc449a50096ab943fc44c6fe1bb25c9fccc584243ab47435e909a22f0dd34b593236da770f75047bf1553eb8fea20c826afef89";

export function verifyOmnitransitPortalsPassword(password: string): boolean {
  const fromEnv = String(process.env.OMNITRANSIT_PORTALS_SHARED_PASSWORD ?? "").trim();
  if (fromEnv && password === fromEnv) {
    return true;
  }
  if (!password) return false;
  const candidate = scryptSync(password, PORTAL_PASSWORD_SALT, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(PORTAL_PASSWORD_HASH, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}
