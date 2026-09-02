import { isInternalDomainHost } from "@/lib/app-domains";
import { isWolfCentralHost } from "@/lib/wolf/wolf-surface";

/** Hosts that may use Internal-cloned Analytics (Platform, System Health, RT Video). */
export function isWolfClonedAnalyticsHost(host: string | null | undefined): boolean {
  return isInternalDomainHost(host) || isWolfCentralHost(host);
}
