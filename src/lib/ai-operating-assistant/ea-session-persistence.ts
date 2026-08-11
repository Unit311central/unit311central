/** Client-side keys to resume exec-assistant chats after navigating away. */

function workspaceStorageKey(): string {
  if (typeof window === "undefined") return "default";
  const host = window.location.hostname.toLowerCase();
  if (host.includes("onwardair")) return "onwardair";
  if (host.includes("talanton")) return "talanton";
  if (host.includes("abhi")) return "abhi";
  if (host.includes("corpcentre")) return "corpcentre";
  return host.split(".")[0] || "default";
}

function activeKey() {
  return `unit311.ea.activeConversation.${workspaceStorageKey()}`;
}

function lastDraftKey() {
  return `unit311.ea.lastDraftConversation.${workspaceStorageKey()}`;
}

export function readPersistedConversationId(): string | null {
  if (typeof window === "undefined") return null;
  const sessionId = window.sessionStorage.getItem(activeKey());
  if (sessionId && !sessionId.startsWith("local_") && sessionId !== "pending") {
    return sessionId;
  }
  const localId = window.localStorage.getItem(lastDraftKey());
  if (localId && !localId.startsWith("local_") && localId !== "pending") {
    return localId;
  }
  return null;
}

export function persistConversationId(conversationId: string | null) {
  if (typeof window === "undefined") return;
  if (
    conversationId &&
    !conversationId.startsWith("local_") &&
    conversationId !== "pending"
  ) {
    window.sessionStorage.setItem(activeKey(), conversationId);
    window.localStorage.setItem(lastDraftKey(), conversationId);
    return;
  }
  if (!conversationId) {
    window.sessionStorage.removeItem(activeKey());
  }
}

export function clearPersistedConversationId() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(activeKey());
  window.localStorage.removeItem(lastDraftKey());
}
