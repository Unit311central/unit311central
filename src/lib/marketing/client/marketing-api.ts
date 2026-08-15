"use client";

import { useEffect, useState } from "react";

import type {
  Campaign,
  ExternalEvent,
  ManagedEvent,
  MarketingDashboardKpis,
  MediaAsset,
  MailingContact,
  Newsletter,
} from "@/lib/marketing/types";
import type { MarketingStoryRecord } from "@/lib/marketing/mappers";

export type MarketingBundleResponse = {
  contacts: MailingContact[];
  newsletters: Newsletter[];
  campaigns: Campaign[];
  externalEvents: ExternalEvent[];
  managedEvents: ManagedEvent[];
  media: MediaAsset[];
  portfolioStories: MarketingStoryRecord[];
  journeyStories: MarketingStoryRecord[];
  kpis: MarketingDashboardKpis;
  abhiExtensions: {
    workingGroups: unknown[];
    acceleratorCohorts: unknown[];
  };
};

export type MarketingResource =
  | "contacts"
  | "newsletters"
  | "campaigns"
  | "external-events"
  | "managed-events"
  | "media"
  | "stories";

async function marketingFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store", ...init });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchMarketingBundle(): Promise<MarketingBundleResponse | null> {
  return marketingFetch<MarketingBundleResponse>("/api/marketing/bundle");
}

export async function saveMarketingResource(
  resource: MarketingResource,
  payload: Record<string, unknown>,
): Promise<unknown | null> {
  const result = await marketingFetch<{ item: unknown }>(`/api/marketing/resources/${resource}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return result?.item ?? null;
}

export async function deleteMarketingResource(
  resource: MarketingResource,
  id: string,
): Promise<boolean> {
  const result = await marketingFetch<{ ok: boolean }>(
    `/api/marketing/resources/${resource}?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return Boolean(result?.ok);
}

export function useMarketingBundle() {
  const [bundle, setBundle] = useState<MarketingBundleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchMarketingBundle().then((data) => {
      if (!cancelled) {
        setBundle(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { bundle, loading, refresh: async () => setBundle(await fetchMarketingBundle()) };
}
