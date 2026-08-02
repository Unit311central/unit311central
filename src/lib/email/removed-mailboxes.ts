/** Browser preference: mailboxes hidden from Settings / Email UI (per workspace host). */

export const REMOVED_MAILBOXES_STORAGE_KEY = "unit311-removed-mailboxes";
export const REMOVED_MAILBOXES_CHANGED_EVENT = "unit311:removed-mailboxes-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function workspaceStorageKey(): string {
  if (!isBrowser()) return REMOVED_MAILBOXES_STORAGE_KEY;
  try {
    const host = window.location.hostname.toLowerCase();
    const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
    const slug = match?.[1]?.trim().toLowerCase();
    if (slug) return `${REMOVED_MAILBOXES_STORAGE_KEY}:${slug}`;
  } catch {
    /* fall through */
  }
  return REMOVED_MAILBOXES_STORAGE_KEY;
}

function readIds(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function loadRemovedMailboxIds(): string[] {
  if (!isBrowser()) return [];
  const scoped = workspaceStorageKey();
  const scopedIds = readIds(scoped);
  if (scopedIds.length > 0) return scopedIds;
  // Migrate legacy unscoped list once into the current host key.
  if (scoped !== REMOVED_MAILBOXES_STORAGE_KEY) {
    const legacy = readIds(REMOVED_MAILBOXES_STORAGE_KEY);
    if (legacy.length > 0) {
      window.localStorage.setItem(scoped, JSON.stringify(legacy));
      return legacy;
    }
  }
  return [];
}

export function saveRemovedMailboxIds(ids: string[]) {
  if (!isBrowser()) return;
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  window.localStorage.setItem(workspaceStorageKey(), JSON.stringify(unique));
  window.dispatchEvent(
    new CustomEvent(REMOVED_MAILBOXES_CHANGED_EVENT, { detail: { ids: unique } }),
  );
}

export function removeMailboxFromWorkspace(accountId: string) {
  const id = accountId.trim();
  if (!id) return;
  const current = loadRemovedMailboxIds();
  if (current.includes(id)) return;
  saveRemovedMailboxIds([...current, id]);
}

export function restoreMailboxToWorkspace(accountId: string) {
  const id = accountId.trim();
  if (!id) return;
  saveRemovedMailboxIds(loadRemovedMailboxIds().filter((entry) => entry !== id));
}

export function filterRemovedMailboxes<T extends { id: string }>(accounts: T[]): T[] {
  const removed = new Set(loadRemovedMailboxIds());
  if (removed.size === 0) return accounts;
  return accounts.filter((account) => !removed.has(account.id));
}
