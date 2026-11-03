/** Messaging call channel for ranger ↔ reserve vet evaluation sessions. */
export const WOLF_VET_EVALUATION_ROOM = "wolf-vet-evaluation";

export const WOLF_VET_WORKFLOW_STEPS = [
  {
    title: "Field capture",
    detail: "Log GPS, photos, and clips on WOLF Test Ground WebRTC while Brix streams live video.",
  },
  {
    title: "Start evaluation call",
    detail: "Ranger and reserve vet join the same secure voice or video room (Business Prod Communications stack).",
  },
  {
    title: "Share with the vet",
    detail: "Copy the guest link for a vet without a WOLF login, or pick an on-call operator from the directory.",
  },
  {
    title: "Remote consultation",
    detail: "Review footage together, share screen, and agree next steps before returning to the field.",
  },
] as const;
