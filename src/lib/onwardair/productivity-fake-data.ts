/**
 * OnwardAir Business Productivity fixtures — dashboard snapshot for logged-in admin.
 */

export type OaProductivitySnapshot = {
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
  communications: Array<{ title: string; meta: string; time: string }>;
  support: {
    open: number;
    waiting: number;
    resolvedToday: number;
    critical: number;
    items: Array<{ id: string; title: string; status: string }>;
  };
};

/** Personalized brief for admin@onwardair.tech / Houston ops. */
export function buildOaProductivitySnapshot(displayName?: string | null): OaProductivitySnapshot {
  const who = displayName?.trim() || "Admin";
  return {
    summary: {
      attention: 4,
      changed: 11,
      nextUp: "FLEX Pod build sync · 10:30",
      headline: `${who}: morning brief — 5 unread emails, FLEX Pod supplier call at 10:30, 2 support tickets waiting, and 3 major file updates in Engineering / Board packs.`,
    },
    emails: [
      {
        from: "Mike Teeter",
        subject: "Motor mount CNC first-article photos",
        time: "08:22",
        unread: true,
      },
      {
        from: "Toray US",
        subject: "Cold-chain delivery window — Houston Lab",
        time: "07:48",
        unread: true,
      },
      {
        from: "Monte Mann",
        subject: "Q3 cash runway note for board pack",
        time: "Yesterday",
        unread: false,
      },
    ],
    schedule: [
      { time: "09:15", title: "Eng stand-up — Houston Lab", meta: "Teams · 15 min" },
      { time: "10:30", title: "FLEX Pod build sync", meta: "Boardroom · 45 min" },
      { time: "13:00", title: "DFW vertiport partner call", meta: "Video · 30 min" },
      { time: "15:30", title: "Support triage", meta: "Ops · 30 min" },
    ],
    messages: [
      { channel: "#Management", text: "Board pack annex locked for Friday.", time: "14m" },
      { channel: "#Engineering", text: "Dyno rig back online after recal.", time: "38m" },
      { channel: "#Support", text: "OA-SUP-004 waiting on vendor reply.", time: "1h" },
    ],
    files: [
      {
        name: "FLEX_Pod_ICD_v0.4.pdf",
        action: "Uploaded",
        by: "David Colling",
        time: "45m ago",
      },
      {
        name: "Board_Pack_Aug2026.pptx",
        action: "Edited",
        by: "Monte Mann",
        time: "2h ago",
      },
      {
        name: "Battery_Pack_A_Test_Log.xlsx",
        action: "Shared",
        by: "Keven Coates",
        time: "Yesterday",
      },
    ],
    communications: [
      { title: "Stand-up recording — Eng", meta: "Teams · 12 attendees", time: "Today" },
      { title: "Partner briefing draft — DFW", meta: "Carolyn Scott", time: "Yesterday" },
      { title: "All-hands agenda — Aug", meta: "Brian Whiteside", time: "Mon" },
    ],
    support: {
      open: 7,
      waiting: 2,
      resolvedToday: 1,
      critical: 1,
      items: [
        { id: "OA-SUP-003", title: "Lab NAS backup RPO miss — flight telemetry", status: "Critical" },
        { id: "OA-SUP-007", title: "VPN drop for remote GNC engineer", status: "Waiting" },
        { id: "OA-SUP-001", title: "M365 licence seat request — new hire", status: "Open" },
      ],
    },
  };
}
