/**
 * Real EA mode — model picks tools from a small generic set instead of regex routing.
 * Set EA_LEGACY_INTENT_ROUTER=1 to restore deterministic intent-router shortcuts.
 */
export function isEaGeneralIntentMode(): boolean {
  const legacy = process.env.EA_LEGACY_INTENT_ROUTER?.trim().toLowerCase();
  return legacy !== "1" && legacy !== "true";
}
