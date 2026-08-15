export function portalsBriefingAdminLockKey(workspaceSlug: string): string {
  return `${workspaceSlug.trim().toLowerCase()}_portals_admin_lock`;
}

export function readPortalsBriefingAdminLock(workspaceSlug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(portalsBriefingAdminLockKey(workspaceSlug)) === "1";
  } catch {
    return false;
  }
}

export function writePortalsBriefingAdminLock(workspaceSlug: string, locked: boolean) {
  if (typeof window === "undefined") return;
  try {
    const key = portalsBriefingAdminLockKey(workspaceSlug);
    if (locked) window.sessionStorage.setItem(key, "1");
    else window.sessionStorage.removeItem(key);
  } catch {
    // Ignore quota / private mode failures.
  }
}
