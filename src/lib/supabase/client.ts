import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(url: string, anonKey: string) {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(url, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 8,
      },
    },
  });

  return browserClient;
}

export function isSupabaseBrowserConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseBrowserClientFromEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createSupabaseBrowserClient(url, key);
}
