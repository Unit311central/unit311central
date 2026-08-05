/**
 * OnwardAir /overview invite page — editable demo content + module screenshot map.
 */

import {
  DEFAULT_MAJOR_MODULES,
  type PortalsIndent,
  type PortalsModuleRow,
  newPortalsRowId,
  portalsRowIndent,
} from "@/lib/onwardair/portals-demo";

export type OverviewInviteRow = {
  wave: string;
  who: string;
  why: string;
};

export type OnwardAirOverviewEditableContent = {
  headline: string;
  subheadline: string;
  questionsTitle: string;
  questionsIntro: string;
  questions: string[];
  highlightsTitle: string;
  highlightsIntro: string;
  highlights: string[];
  agendaTitle: string;
  agendaIntro: string;
  agenda: OverviewInviteRow[];
  agendaNote: string;
  modulesTitle: string;
  modules: PortalsModuleRow[];
  previewHint: string;
};

/** Public path under /images/overview/screenshots/{slug}.png */
export const OVERVIEW_SCREENSHOT_BY_MODULE_ID: Record<string, string> = {
  m1: "home",
  m2: "executive-assistant",
  m3: "intelligence",
  m3a: "intelligence",
  m3b: "intelligence",
  m4: "project-management",
  m4a: "project-management",
  m4b: "project-management",
  m4c: "project-management",
  m5: "business-central",
  m5a: "business-central",
  m5b: "business-central",
  m6: "engineering",
  m6a: "engineering",
  m6b: "engineering",
  m6c: "engineering",
  m6d: "engineering",
  m7: "ip-patents",
  m7a: "ip-patents",
  m7b: "ip-patents",
  m7c: "ip-patents",
  m8: "fundraising",
  m8a: "fundraising",
  m8b: "fundraising",
  m8c: "fundraising",
  m8d: "fundraising",
  m9: "board",
  m9a: "board",
  m9b: "board",
  m9c: "board",
  m9d: "board",
  m9e: "board",
  m10: "financials",
  m10a: "financials",
  m10b: "financials",
  m10c: "financials",
  m10d: "financials",
  m10e: "financials",
  m10f: "financials",
  m10g: "financials",
  m11: "hr",
  m11a: "hr",
  m11b: "hr",
  m11c: "hr",
  m11d: "hr",
  m11e: "hr",
  m12: "marketing",
  m12a: "marketing",
  m12b: "marketing",
  m12c: "marketing",
  m12d: "marketing",
  m13: "corporate",
  m13a: "corporate",
  m13b: "corporate",
  m13c: "corporate",
  m14: "technology",
  m14a: "technology",
  m14b: "technology",
  m15: "productivity",
  m15a: "productivity",
  m15b: "productivity",
  m15c: "productivity",
  m15d: "productivity",
  m16: "operations",
  m16a: "operations",
  m16b: "operations",
  m16c: "operations",
  m17: "training",
  m17a: "training",
  m17b: "training",
  m18: "qms",
  m18a: "qms",
  m18b: "qms",
  m18c: "qms",
  m19: "client-access",
  m19a: "client-access",
  m19b: "client-access",
  m20: "settings",
  m20a: "settings",
  m20b: "settings",
  m20c: "settings",
};

export const OVERVIEW_SCREENSHOT_SLUGS = [
  "home",
  "executive-assistant",
  "intelligence",
  "project-management",
  "business-central",
  "engineering",
  "ip-patents",
  "fundraising",
  "board",
  "financials",
  "hr",
  "marketing",
  "corporate",
  "technology",
  "productivity",
  "operations",
  "training",
  "qms",
  "client-access",
  "settings",
] as const;

export type OverviewScreenshotSlug = (typeof OVERVIEW_SCREENSHOT_SLUGS)[number];

export function overviewScreenshotSrc(slug: string | null | undefined): string {
  const key = String(slug ?? "home").trim().toLowerCase() || "home";
  return `/images/overview/screenshots/${key}.png`;
}

export function overviewScreenshotForModuleId(moduleId: string | null | undefined): string {
  const slug = OVERVIEW_SCREENSHOT_BY_MODULE_ID[String(moduleId ?? "")] ?? "generic";
  return overviewScreenshotSrc(slug);
}

export function defaultOnwardAirOverviewContent(): OnwardAirOverviewEditableContent {
  return {
    headline: "OnwardAir Demonstration Environment",
    subheadline: "Built using publicly available information relating to OnwardAir.",
    questionsTitle: "Questions for thought",
    questionsIntro:
      "A fully customisable business operating system — shaped around how OnwardAir actually runs.",
    questions: [
      "Can you see the health of your business in real time?",
      "Can you get a trusted answer to a question about your business — rapidly?",
      "Do you have complete visibility of your projects, people and finances?",
      "Are your teams switching between too many applications?",
      "Do you know where your biggest business risks are?",
    ],
    highlightsTitle: "KEY HIGHLIGHTS",
    highlightsIntro: "Summary of major functions I thought would be useful for you and your team.",
    highlights: [
      "AI Executive Assistant",
      "OnwardAir Intelligence (competitors + ecosystem)",
      "Fundraising pipeline & data rooms",
      "Board workspace + advisor portal",
      "Project management (internal + external)",
      "Engineering programmes, assurance & certification",
      "Financials & cash runway view",
      "IP & Patents register",
      "QMS aligned to aerospace (AS9100)",
      "Client portal — Coastal Freight Partners",
    ],
    agendaTitle: "60-minute working session",
    agendaIntro: "Live walkthrough — then decide if it's for you. Who should join:",
    agenda: [
      { wave: "0–25", who: "Scott · Brian · Monte", why: "Leadership picture & offer" },
      { wave: "25–45", who: "+ Eng leads", why: "Programmes, risk, day-to-day tools" },
      { wave: "45–60", who: "Core three", why: "6-month build plan & next steps" },
    ],
    agendaNote: "Full workspace opens ~24h before we meet — not before.",
    modulesTitle: "Major Modules",
    modules: DEFAULT_MAJOR_MODULES.map((entry) => ({ ...entry })),
    previewHint: "Highlight a module — screenshot appears here.",
  };
}

export function sanitizeOverviewContent(raw: unknown): OnwardAirOverviewEditableContent {
  const fallback = defaultOnwardAirOverviewContent();
  if (!raw || typeof raw !== "object") return fallback;
  const body = raw as Partial<OnwardAirOverviewEditableContent>;

  const str = (value: unknown, fb: string) => {
    const next = String(value ?? "").trim();
    return next || fb;
  };

  const strList = (value: unknown, fb: string[]) => {
    if (!Array.isArray(value)) return [...fb];
    const rows = value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
    return rows.length ? rows : [...fb];
  };

  const agenda = Array.isArray(body.agenda)
    ? body.agenda
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const wave = String((row as OverviewInviteRow).wave ?? "").trim();
          const who = String((row as OverviewInviteRow).who ?? "").trim();
          const why = String((row as OverviewInviteRow).why ?? "").trim();
          if (!wave && !who && !why) return null;
          return { wave: wave || "—", who: who || "—", why: why || "—" };
        })
        .filter(Boolean) as OverviewInviteRow[]
    : fallback.agenda;

  const modules: PortalsModuleRow[] = Array.isArray(body.modules)
    ? body.modules
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") return null;
          const text = String((entry as PortalsModuleRow).text ?? "");
          const rawIndent = (entry as PortalsModuleRow).indent;
          const indent: PortalsIndent = rawIndent === 2 ? 2 : rawIndent === 1 ? 1 : 0;
          const id =
            typeof (entry as PortalsModuleRow).id === "string" && (entry as PortalsModuleRow).id
              ? (entry as PortalsModuleRow).id
              : newPortalsRowId(`m${index}`);
          return { id, text, indent };
        })
        .filter(Boolean) as PortalsModuleRow[]
    : fallback.modules.map((entry) => ({ ...entry }));

  return {
    headline: str(body.headline, fallback.headline),
    subheadline: str(body.subheadline, fallback.subheadline),
    questionsTitle: str(body.questionsTitle, fallback.questionsTitle),
    questionsIntro: str(body.questionsIntro, fallback.questionsIntro),
    questions: strList(body.questions, fallback.questions),
    highlightsTitle: str(body.highlightsTitle, fallback.highlightsTitle),
    highlightsIntro: str(body.highlightsIntro, fallback.highlightsIntro),
    highlights: strList(body.highlights, fallback.highlights),
    agendaTitle: str(body.agendaTitle, fallback.agendaTitle),
    agendaIntro: str(body.agendaIntro, fallback.agendaIntro),
    agenda: agenda.length ? agenda : fallback.agenda,
    agendaNote: str(body.agendaNote, fallback.agendaNote),
    modulesTitle: str(body.modulesTitle, fallback.modulesTitle),
    modules: modules.length ? modules : fallback.modules.map((entry) => ({ ...entry })),
    previewHint: str(body.previewHint, fallback.previewHint),
  };
}

export { portalsRowIndent, newPortalsRowId };
export type { PortalsModuleRow, PortalsIndent };
