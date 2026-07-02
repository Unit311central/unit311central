export type ClientMessagingOption = {
  key: string;
  label: string;
  username: string;
  displayName: string;
};

export const CLIENT_MESSAGING_OPTIONS: ClientMessagingOption[] = [
  {
    key: "westport",
    label: "Westport Logistics Hub",
    username: "westport",
    displayName: "Westport Logistics Hub",
  },
  {
    key: "venturi",
    label: "Venturi Aeronautical",
    username: "venturia",
    displayName: "Venturi Aeronautical",
  },
];

export function getClientMessagingOption(key: string) {
  return CLIENT_MESSAGING_OPTIONS.find((client) => client.key === key) ?? null;
}
