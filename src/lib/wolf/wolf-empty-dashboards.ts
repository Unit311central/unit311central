/** Zero-state dashboard snapshots for WOLF Central (no legacy seed data). */

import type { DashboardTileDefinition } from "@/lib/dashboard-view-tiles";
import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import { WOLF_REPORTING_CURRENCY } from "@/lib/wolf/wolf-surface";

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

export const WOLF_EMPTY_FLEET_METRICS = {
  totalAircraft: 0,
  largeDrones: 0,
  smallDrones: 0,
  docks: 0,
  batteries: 0,
} as const;

export const WOLF_EMPTY_OPERATIONS_TILES: DashboardTileDefinition[] = [
  {
    id: "assets",
    label: "Assets",
    value: "0",
    hint: "0 in service · 0 maintenance",
  },
  {
    id: "inventory",
    label: "Inventory",
    value: "0",
    hint: "0 operational · 0 reorder watch",
  },
  {
    id: "open-pos",
    label: "Open POs",
    value: "0",
    hint: "0 awaiting approval · 0 suppliers",
  },
  {
    id: "procurement-spend",
    label: "Procurement spend",
    value: formatMoney(0, WOLF_REPORTING_CURRENCY),
    hint: `Budget ${formatMoney(0, WOLF_REPORTING_CURRENCY)} · ${WOLF_REPORTING_CURRENCY}`,
  },
  {
    id: "shipments",
    label: "Active shipments",
    value: "0",
    hint: "0 in · 0 out",
  },
  {
    id: "international",
    label: "International",
    value: "0",
    hint: "No active international lanes",
  },
];
