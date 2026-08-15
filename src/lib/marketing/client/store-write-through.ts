import {
  saveMarketingResource,
  type MarketingResource,
} from "@/lib/marketing/client/marketing-api";

/** Fire-and-forget central API write, then optional store rehydrate. */
export function writeThroughMarketingResource(
  resource: MarketingResource,
  payload: Record<string, unknown>,
  rehydrate?: () => Promise<boolean>,
) {
  if (typeof window === "undefined") return;
  void saveMarketingResource(resource, payload).then(() => {
    void rehydrate?.();
  });
}

export function deleteThroughMarketingResource(
  resource: MarketingResource,
  id: string,
  rehydrate?: () => Promise<boolean>,
) {
  if (typeof window === "undefined") return;
  void import("@/lib/marketing/client/marketing-api").then(({ deleteMarketingResource }) =>
    deleteMarketingResource(resource, id).then(() => {
      void rehydrate?.();
    }),
  );
}
