import { isDemoDomainHost, isInternalDomainHost } from "@/lib/app-domains";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { isSaecSlug } from "@/lib/saec-surface";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { demoWorkspaceSlug } from "@/lib/runtime-surface";

export type MarketingWorkspaceKey =
  | "internal"
  | "demo"
  | "onwardair"
  | "talanton"
  | "abhi"
  | "saec"
  | "customer"
  | "unknown";

/** Resolve active workspace for Marketing module routing (client-safe). */
export function resolveMarketingWorkspaceKey(
  slug?: string | null,
  hostname?: string | null,
): MarketingWorkspaceKey {
  const normalizedSlug = String(slug ?? "").trim().toLowerCase();
  if (normalizedSlug) {
    if (normalizedSlug === INTERNAL_WORKSPACE_SLUG || normalizedSlug === "internal") {
      return "internal";
    }
    if (normalizedSlug === demoWorkspaceSlug()) return "demo";
    if (isOnwardAirSlug(normalizedSlug)) return "onwardair";
    if (isTalantonImpactSlug(normalizedSlug)) return "talanton";
    if (isAbhiSlug(normalizedSlug)) return "abhi";
    if (isSaecSlug(normalizedSlug)) return "saec";
    if (isCustomerWorkspaceSlug(normalizedSlug)) return "customer";
  }

  if (typeof window !== "undefined" && !hostname) {
    hostname = window.location.hostname;
  }

  const host = String(hostname ?? "")
    .split(":")[0]
    .trim()
    .toLowerCase();

  if (!host) return "unknown";
  if (isInternalDomainHost(host)) return "internal";
  if (isDemoDomainHost(host)) return "demo";

  const subdomain = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i)?.[1]?.toLowerCase();
  if (subdomain) {
    if (isOnwardAirSlug(subdomain)) return "onwardair";
    if (isTalantonImpactSlug(subdomain)) return "talanton";
    if (isAbhiSlug(subdomain)) return "abhi";
    if (isSaecSlug(subdomain)) return "saec";
    if (isCustomerWorkspaceSlug(subdomain)) return "customer";
  }

  if (host.includes("onwardair") || host === "onward.localhost") return "onwardair";
  if (host.includes("talanton")) return "talanton";
  if (host.includes("abhi")) return "abhi";
  if (host.includes("demo")) return "demo";
  if (host.includes("internal")) return "internal";

  return "unknown";
}

export function resolveBrowserMarketingWorkspaceKey(): MarketingWorkspaceKey {
  if (typeof window === "undefined") return "unknown";
  return resolveMarketingWorkspaceKey(null, window.location.hostname);
}
