import { SUPPORT_CHANNEL_ROOM } from "@/lib/support-data";
import { slugifyChannelName } from "@/lib/internal-messaging-data";

export { SUPPORT_CHANNEL_ROOM };

export const DEFAULT_SUPPORT_OPERATOR_IDS = ["user-admin", "user-info", "user-paul"] as const;

export const DEFAULT_SUPPORT_EMAILS = [
  "admin@unit311central.com",
  "info@unit311central.com",
  "paul@unit311central.com",
] as const;

export function clientSupportChannelName(companyName: string) {
  const name = companyName.trim() || "Client";
  return `Support - ${name}`;
}

export function clientSupportChannelRoom(input: {
  clientId?: string | null;
  companyName: string;
}) {
  if (input.clientId?.trim()) {
    const safe = input.clientId.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    if (safe) return `support-client-${safe}`;
  }
  const slug = slugifyChannelName(input.companyName.trim() || "client") || "client";
  return `support-org-${slug}`;
}

export function isClientSupportChannelRoom(room: string) {
  return (
    room === SUPPORT_CHANNEL_ROOM ||
    room.startsWith("support-client-") ||
    room.startsWith("support-org-")
  );
}
