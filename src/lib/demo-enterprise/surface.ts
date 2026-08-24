import { isBrowserNorthstarDemoTenancy } from "@/lib/demo-enterprise/workspace-tenancy-surface";

/** Client-side Northstar Demo workspace tenancy (fixtures, currency, module hosts). */
export function isBrowserDemoSurface(): boolean {
  return isBrowserNorthstarDemoTenancy();
}
