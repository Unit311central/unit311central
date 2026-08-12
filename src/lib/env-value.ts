const PLACEHOLDER_VALUES = new Set(["", "[SENSITIVE]"]);

export function readEnvString(name: string): string | null {
  const raw = process.env[name]?.trim();
  if (!raw || PLACEHOLDER_VALUES.has(raw) || raw.startsWith("env_")) {
    return null;
  }
  return raw;
}

export function readEnvUrl(name: string, fallback: string): string {
  const raw = readEnvString(name);
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return fallback;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export function readSupabaseProjectRef(): string | null {
  const fromEnv = readEnvString("SUPABASE_PROJECT_REF");
  if (fromEnv) return fromEnv;
  const url = readEnvString("SUPABASE_URL");
  if (!url) return null;
  try {
    return new URL(url).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}
