import { createHmac, timingSafeEqual } from "node:crypto";

const WORKSPACE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function phoneIngestToken(workspaceId: string, secret: string): string {
  const sig = createHmac("sha256", secret).update(`wolf-phone:${workspaceId}`).digest("base64url");
  return `${workspaceId}.${sig}`;
}

export function workspaceIdFromPhoneToken(token: string, secret: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const workspaceId = token.slice(0, dot);
  if (!WORKSPACE_ID.test(workspaceId) || !secret) return null;
  const expected = phoneIngestToken(workspaceId, secret);
  const actual = Buffer.from(token);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
  return workspaceId;
}
