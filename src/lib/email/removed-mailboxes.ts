/** Browser preference: mailboxes hidden from Settings / Email UI. */

export const REMOVED_MAILBOXES_STORAGE_KEY = "unit311-removed-mailboxes";
export const REMOVED_MAILBOXES_CHANGED_EVENT = "unit311:removed-mailboxes-changed";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadRemovedMailboxIds(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(REMOVED_MAILBOXES_STORAGE_KEY);
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

export function saveRemovedMailboxIds(ids: string[]) {
  if (!isBrowser()) return;
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  window.localStorage.setItem(REMOVED_MAILBOXES_STORAGE_KEY, JSON.stringify(unique));
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
