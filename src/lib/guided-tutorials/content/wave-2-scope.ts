/**
 * Wave 2 — P1 module entry tutorials (dashboard / primary function per module).
 *
 * One central tutorial per P1 platform module, bound to the catalogue's primary
 * runtime binding. Workspace-independent; additional bindings inherit the same tutorial.
 *
 * Project Management has no distinct catalogue row (projects live under Business Central);
 * it is deferred to a later wave.
 */

export const WAVE_2_TUTORIAL_IDS = [
  "fundraising.dashboard",
  "board.board-dashboard",
  "corporate-information.dashboard",
  "operations.dashboard",
  "marketing-events.dashboard",
  "technology-management.dashboard",
  "human-resources.dashboard",
  "business-productivity.dashboard",
  "support-desk.tickets",
  "settings.general",
] as const;

export type Wave2TutorialId = (typeof WAVE_2_TUTORIAL_IDS)[number];
