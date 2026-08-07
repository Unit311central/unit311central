import {
  createChannel,
  getChannelByName,
  listChannels,
} from "@/lib/internal-messaging-service";

const INTERNAL_CHANNELS = [
  { name: "Board", description: "Board members and managing partners." },
  { name: "Partners", description: "Talanton partners and senior investment team." },
];

const EXTERNAL_CHANNELS = [
  {
    name: "ARC Ride",
    clientKey: "arcride",
    description: "Portfolio company collaboration — mobility & logistics.",
  },
  {
    name: "Burn Manufacturing",
    clientKey: "burn",
    description: "Portfolio company collaboration — clean energy cookstoves.",
  },
  {
    name: "Pezesha",
    clientKey: "pezesha",
    description: "Portfolio company collaboration — fintech & inclusion.",
  },
];

/** Idempotent messaging channels for Talanton Impact. */
export async function ensureTalantonMessagingChannelsSeeded(
  workspaceId: string,
  operatorId = "system",
  operatorName = "System",
): Promise<void> {
  const scope = { workspaceId };
  const existing = await listChannels(scope);
  const existingNames = new Set(existing.map((channel) => channel.name.toLowerCase()));

  for (const channel of INTERNAL_CHANNELS) {
    if (existingNames.has(channel.name.toLowerCase())) continue;
    await createChannel(
      {
        name: channel.name,
        channelType: "internal",
        createdByOperatorId: operatorId,
        createdByOperatorName: operatorName,
        memberOperatorIds: [operatorId],
        description: channel.description,
      },
      scope,
    );
  }

  for (const channel of EXTERNAL_CHANNELS) {
    const byName = await getChannelByName(channel.name, scope);
    if (byName) continue;
    await createChannel(
      {
        name: channel.name,
        channelType: "client",
        clientKey: channel.clientKey,
        createdByOperatorId: operatorId,
        createdByOperatorName: operatorName,
        memberOperatorIds: [operatorId],
        memberClientUsernames: [channel.clientKey],
        description: channel.description,
      },
      scope,
    );
  }
}
