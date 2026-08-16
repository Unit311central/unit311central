import "server-only";

import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import type {
  ChatMessage,
  MessageChannel,
  MessageChannelType,
  ScheduledCall,
} from "@/lib/internal-messaging-data";
import type { ManagedUser } from "@/lib/user-management-data";

const NOW = "2026-08-16T10:00:00.000Z";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

const OPERATOR_IDS = {
  ceo: "mag-dir-1",
  cfo: "mag-dir-3",
  cto: "mag-dir-4",
  eng: "mag-dir-5",
  hr: "mag-dir-2",
} as const;

const CHANNEL_SEED: Array<{
  room: string;
  name: string;
  channelType: MessageChannelType;
  clientKey: string | null;
}> = [
  { room: "northstar-board", name: "Board", channelType: "internal", clientKey: null },
  { room: "northstar-management", name: "Management", channelType: "internal", clientKey: null },
  { room: "northstar-hr", name: "HR", channelType: "internal", clientKey: null },
  { room: "northstar-engineering", name: "Engineering", channelType: "internal", clientKey: null },
  {
    room: "northstar-client-sheffield",
    name: "Sheffield Precision Engineering",
    channelType: "client",
    clientKey: "sheffield",
  },
  {
    room: "northstar-client-bristol",
    name: "Bristol Composites Ltd",
    channelType: "client",
    clientKey: "bristol",
  },
];

const channels: MessageChannel[] = CHANNEL_SEED.map((seed, index) => ({
  id: `nst-msg-ch-${index + 1}`,
  room: seed.room,
  name: seed.name,
  channelType: seed.channelType,
  clientKey: seed.clientKey,
  createdByOperatorId: OPERATOR_IDS.ceo,
  createdByOperatorName: "Daniel Cooper",
  memberOperatorIds: Object.values(OPERATOR_IDS),
  memberClientUsernames: seed.clientKey ? [seed.clientKey] : [],
  createdAt: NOW,
  unreadCount: 0,
}));

const messagesByRoom = new Map<string, ChatMessage[]>([
  [
    "northstar-board",
    [
      {
        id: "nst-msg-1",
        room: "northstar-board",
        operatorId: OPERATOR_IDS.ceo,
        operatorName: "Daniel Cooper",
        username: "daniel.cooper",
        content: "Q3 board pack is ready for Friday — please review section 4 on cash runway.",
        messageType: "text",
        attachmentName: null,
        attachmentUrl: null,
        attachmentMime: null,
        callLink: null,
        createdAt: hoursAgo(2),
        deletedAt: null,
        archivedAt: null,
      },
      {
        id: "nst-msg-2",
        room: "northstar-board",
        operatorId: OPERATOR_IDS.cfo,
        operatorName: "Hannah Reed",
        username: "hannah.reed",
        content: "Added updated burn chart and AP aging — looks good to circulate.",
        messageType: "text",
        attachmentName: null,
        attachmentUrl: null,
        attachmentMime: null,
        callLink: null,
        createdAt: hoursAgo(1.5),
        deletedAt: null,
        archivedAt: null,
      },
    ],
  ],
  [
    "northstar-management",
    [
      {
        id: "nst-msg-3",
        room: "northstar-management",
        operatorId: OPERATOR_IDS.ceo,
        operatorName: "Daniel Cooper",
        username: "daniel.cooper",
        content: "Leadership sync moved to 10:30 — Sheffield demo still on for 14:00.",
        messageType: "text",
        attachmentName: null,
        attachmentUrl: null,
        attachmentMime: null,
        callLink: null,
        createdAt: hoursAgo(4),
        deletedAt: null,
        archivedAt: null,
      },
    ],
  ],
  [
    "northstar-hr",
    [
      {
        id: "nst-msg-4",
        room: "northstar-hr",
        operatorId: OPERATOR_IDS.hr,
        operatorName: "Marcus Morgan",
        username: "marcus.morgan",
        content: "Two engineering hires start Monday — onboarding packs are in the shared drive.",
        messageType: "text",
        attachmentName: null,
        attachmentUrl: null,
        attachmentMime: null,
        callLink: null,
        createdAt: hoursAgo(6),
        deletedAt: null,
        archivedAt: null,
      },
    ],
  ],
  [
    "northstar-engineering",
    [
      {
        id: "nst-msg-5",
        room: "northstar-engineering",
        operatorId: OPERATOR_IDS.cto,
        operatorName: "Harry Shah",
        username: "harry.shah",
        content: "Edge controller v2.4 build passed soak tests — staging rollout tonight.",
        messageType: "text",
        attachmentName: null,
        attachmentUrl: null,
        attachmentMime: null,
        callLink: null,
        createdAt: hoursAgo(0.5),
        deletedAt: null,
        archivedAt: null,
      },
      {
        id: "nst-msg-6",
        room: "northstar-engineering",
        operatorId: OPERATOR_IDS.eng,
        operatorName: "Mia Bennett",
        username: "mia.bennett",
        content: "Bristol pilot telemetry dashboard is wired — ready for client review.",
        messageType: "text",
        attachmentName: null,
        attachmentUrl: null,
        attachmentMime: null,
        callLink: null,
        createdAt: hoursAgo(0.25),
        deletedAt: null,
        archivedAt: null,
      },
    ],
  ],
  [
    "northstar-client-sheffield",
    [
      {
        id: "nst-msg-7",
        room: "northstar-client-sheffield",
        operatorId: "client-sheffield",
        operatorName: "Tom Bradley",
        username: "t.bradley",
        content: "Countersigned SOW received — can you return the fully executed PDF today?",
        messageType: "text",
        attachmentName: null,
        attachmentUrl: null,
        attachmentMime: null,
        callLink: null,
        createdAt: hoursAgo(3),
        deletedAt: null,
        archivedAt: null,
      },
    ],
  ],
  [
    "northstar-client-bristol",
    [
      {
        id: "nst-msg-8",
        room: "northstar-client-bristol",
        operatorId: "client-bristol",
        operatorName: "Oliver Grant",
        username: "o.grant",
        content: "Predictive maintenance pilot scope looks good — scheduling site visit for next week.",
        messageType: "text",
        attachmentName: null,
        attachmentUrl: null,
        attachmentMime: null,
        callLink: null,
        createdAt: hoursAgo(5),
        deletedAt: null,
        archivedAt: null,
      },
    ],
  ],
]);

const scheduledCalls: ScheduledCall[] = [
  {
    id: "nst-call-1",
    room: "northstar-management",
    title: "Weekly leadership sync",
    scheduledAt: new Date(Date.now() + 2 * 3_600_000).toISOString(),
    participantOperatorIds: [OPERATOR_IDS.ceo, OPERATOR_IDS.cfo, OPERATOR_IDS.cto],
    callLink: "https://unit311central.com/meet/video/demo-leadership",
    callType: "video",
    createdByOperatorId: OPERATOR_IDS.ceo,
    createdByOperatorName: "Daniel Cooper",
    createdAt: NOW,
  },
];

function attachUnreadCounts(channelList: MessageChannel[], viewerKey: string): MessageChannel[] {
  return channelList.map((channel) => {
    const roomMessages = messagesByRoom.get(channel.room) ?? [];
    const unreadCount = roomMessages.filter((message) => message.operatorId !== viewerKey).length;
    return { ...channel, unreadCount };
  });
}

export function getNorthstarMessagingOperators(): ManagedUser[] {
  const fixtures = getDemoEnterpriseFixtures();
  return fixtures.directory
    .filter((row) => row.status === "Active")
    .map((row) => ({
      id: row.id,
      operatorLabel: row.fullName.split(" ")[0] ?? row.fullName,
      fullName: row.fullName,
      username: row.email,
      email: row.email,
      phone: "",
      role: "Admin" as const,
      roles: ["Admin" as const],
      department: "Corporate" as const,
      departments: ["Corporate" as const],
      status: "Active" as const,
      region: "Multi-site" as const,
      licenseId: "",
      notes: row.department,
      allowedViews: null,
      dashboardPrefs: null,
    }));
}

export function listNorthstarMessagingChannels(input: {
  viewerType: "internal" | "client";
  operatorId?: string;
  clientKey?: string;
  viewerKey: string;
}): MessageChannel[] {
  const filtered =
    input.viewerType === "client"
      ? channels.filter(
          (channel) =>
            channel.channelType === "client" &&
            channel.memberClientUsernames.includes(input.clientKey ?? ""),
        )
      : channels.filter((channel) => channel.channelType === "internal" || channel.channelType === "client");

  return attachUnreadCounts(filtered, input.viewerKey);
}

export function listNorthstarMessagingMessages(options: {
  room: string;
  limit?: number;
  view?: "active" | "archived" | "saved";
}): ChatMessage[] {
  const rows = [...(messagesByRoom.get(options.room) ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  if (options.limit && options.limit > 0) return rows.slice(0, options.limit);
  return rows;
}

export function sendNorthstarMessagingMessage(input: {
  room: string;
  operatorId: string;
  operatorName: string;
  username: string;
  content: string;
}): ChatMessage {
  const message: ChatMessage = {
    id: `nst-msg-${crypto.randomUUID().slice(0, 8)}`,
    room: input.room,
    operatorId: input.operatorId,
    operatorName: input.operatorName,
    username: input.username,
    content: input.content.trim(),
    messageType: "text",
    attachmentName: null,
    attachmentUrl: null,
    attachmentMime: null,
    callLink: null,
    createdAt: new Date().toISOString(),
    deletedAt: null,
    archivedAt: null,
  };
  const existing = messagesByRoom.get(input.room) ?? [];
  messagesByRoom.set(input.room, [message, ...existing]);
  return message;
}

export function getNorthstarScheduledCalls(room?: string): ScheduledCall[] {
  if (!room) return scheduledCalls;
  return scheduledCalls.filter((call) => call.room === room);
}
