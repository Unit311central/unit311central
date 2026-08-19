/**
 * Central application model registry — single source of truth for EA capabilities.
 */

import type { EaSemanticCapabilityBinding } from "./types";
import { buildReadCapabilityBindings } from "./integrations/read-capabilities";
import { buildExtendedCapabilityBindings } from "./integrations/extended-capabilities";
import { buildChartCapabilityBindings } from "./integrations/chart-capabilities";

const capabilityRegistry = new Map<string, EaSemanticCapabilityBinding>();
let bootstrapped = false;

export function ensureCentralApplicationModel(): void {
  if (bootstrapped) return;
  for (const binding of [
    ...buildReadCapabilityBindings(),
    ...buildExtendedCapabilityBindings(),
    ...buildChartCapabilityBindings(),
  ]) {
    capabilityRegistry.set(binding.id, binding);
  }
  bootstrapped = true;
}

export function registerSemanticCapability(binding: EaSemanticCapabilityBinding): void {
  ensureCentralApplicationModel();
  capabilityRegistry.set(binding.id, binding);
}

export function getSemanticCapability(id: string): EaSemanticCapabilityBinding | null {
  ensureCentralApplicationModel();
  return capabilityRegistry.get(id) ?? null;
}

export function listSemanticCapabilities(): EaSemanticCapabilityBinding[] {
  ensureCentralApplicationModel();
  return [...capabilityRegistry.values()];
}

export function resetCentralApplicationModelForTests(): void {
  capabilityRegistry.clear();
  bootstrapped = false;
}
