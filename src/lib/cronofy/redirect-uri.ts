import type { NextRequest } from "next/server";

export function cronofyOAuthRedirectUri(request: NextRequest): string {
  const configured = process.env.CRONOFY_REDIRECT_URI?.trim();
  if (configured) return configured;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) {
    return `${proto}://${host}/api/talanton/governance/cronofy/callback`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (site) return `${site}/api/talanton/governance/cronofy/callback`;
  return "http://localhost:3000/api/talanton/governance/cronofy/callback";
}
