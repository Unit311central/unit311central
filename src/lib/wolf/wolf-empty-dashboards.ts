/** Zero-state dashboard snapshots for WOLF Central (no legacy seed data). */

export type WolfProductivitySnapshot = {
  summary: {
    attention: number;
    changed: number;
    nextUp: string;
    headline: string;
  };
  emails: Array<{ from: string; subject: string; time: string; unread: boolean }>;
  schedule: Array<{ time: string; title: string; meta: string }>;
  messages: Array<{ channel: string; text: string; time: string }>;
  files: Array<{ name: string; action: string; by: string; time: string }>;
  support: {
    open: number;
    waiting: number;
    resolvedToday: number;
    critical: number;
    items: Array<{ id: string; title: string; status: string }>;
  };
  social: Array<{ network: string; text: string; time: string }>;
  approvals: Array<{ title: string; meta: string; due: string }>;
};

export const WOLF_EMPTY_PRODUCTIVITY_SNAPSHOT: WolfProductivitySnapshot = {
  summary: {
    attention: 0,
    changed: 0,
    nextUp: "—",
    headline: "Your WOLF workspace is ready. Activity will appear here as you add projects, tickets, and files.",
  },
  emails: [],
  schedule: [],
  messages: [],
  files: [],
  support: { open: 0, waiting: 0, resolvedToday: 0, critical: 0, items: [] },
  social: [],
  approvals: [],
};
