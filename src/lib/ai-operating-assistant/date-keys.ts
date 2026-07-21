/** Shared date helpers safe for client + server bundles. */

export function briefDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
