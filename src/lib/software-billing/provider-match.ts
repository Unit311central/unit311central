import type { SoftwareProviderSlug } from "@/lib/software-billing/types";
import {
  CURSOR_PROVIDER_SLUG,
  OPENAI_PROVIDER_SLUG,
  SUPABASE_PROVIDER_SLUG,
  VERCEL_PROVIDER_SLUG,
} from "@/lib/software-billing/types";

const PROVIDER_MATCHERS: Record<SoftwareProviderSlug, string[]> = {
  [VERCEL_PROVIDER_SLUG]: ["vercel"],
  [OPENAI_PROVIDER_SLUG]: ["openai"],
  [CURSOR_PROVIDER_SLUG]: ["cursor"],
  [SUPABASE_PROVIDER_SLUG]: ["supabase"],
};

export function providerMatchers(slug: SoftwareProviderSlug) {
  return PROVIDER_MATCHERS[slug];
}

export function assetMatchesProvider(
  asset: { providerSlug?: string | null; vendor?: string; name?: string },
  slug: SoftwareProviderSlug,
) {
  if (asset.providerSlug === slug) return true;
  const needles = providerMatchers(slug);
  const vendor = String(asset.vendor ?? "").toLowerCase();
  const name = String(asset.name ?? "").toLowerCase();
  return needles.some((needle) => vendor.includes(needle) || name.includes(needle));
}
