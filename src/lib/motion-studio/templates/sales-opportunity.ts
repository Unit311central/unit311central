import type { MotionStudioSpec } from "../types";

/** Default 30s sales opportunity walkthrough (illustrative demo data). */
export function buildSalesOpportunitySpec(input: {
  promptEcho: string;
  durationMs?: number;
}): MotionStudioSpec {
  const durationMs = input.durationMs ?? 30_000;
  return {
    version: 1,
    title: "Sales opportunity lifecycle",
    durationMs,
    aspectRatio: "16:9",
    fictional: true,
    promptEcho: input.promptEcho,
    scenes: [
      {
        id: "contact",
        title: "Initial contact",
        startMs: 0,
        endMs: 6_000,
        narration:
          "A new enquiry arrives and is captured as a contact ready for follow-up.",
        elements: [
          { type: "caption", text: "Illustrative demo — not live CRM data", emphasis: "demo" },
          {
            type: "title",
            text: "Initial contact",
            subtitle: "Prospective customer enters the funnel",
          },
          {
            type: "entity_row",
            label: "Contact",
            value: "Elena Vasquez",
            meta: "Inbound · Trade show follow-up",
          },
          {
            type: "card",
            title: "Activity logged",
            body: "Discovery call scheduled · owner assigned",
            tone: "accent",
          },
        ],
      },
      {
        id: "company",
        title: "Company & qualification",
        startMs: 6_000,
        endMs: 12_000,
        narration: "The contact is linked to a company and a qualified opportunity is opened.",
        elements: [
          {
            type: "title",
            text: "Company & qualification",
            subtitle: "Contact → Account → Opportunity",
          },
          {
            type: "workflow_link",
            from: "Elena Vasquez",
            to: "Helios Automation GmbH",
            note: "Primary contact",
          },
          {
            type: "card",
            title: "Opportunity created",
            body: "Edge monitoring rollout · Qualification complete",
            badge: "Qualified",
            tone: "neutral",
          },
        ],
      },
      {
        id: "pipeline",
        title: "Pipeline progression",
        startMs: 12_000,
        endMs: 19_000,
        narration: "The deal advances through representative pipeline stages with value and next steps.",
        elements: [
          {
            type: "title",
            text: "Opportunity progression",
            subtitle: "Pipeline stages & next actions",
          },
          {
            type: "pipeline",
            stages: ["Discover", "Solution", "Propose", "Negotiate", "Close"],
            activeIndex: 2,
            valueLabel: "£420k",
          },
          {
            type: "metric",
            label: "Weighted forecast",
            value: "£168k",
            hint: "Next: technical validation workshop",
          },
        ],
      },
      {
        id: "quote",
        title: "Quotation & negotiation",
        startMs: 19_000,
        endMs: 25_000,
        narration: "A quotation is prepared and the opportunity moves into negotiation.",
        elements: [
          {
            type: "title",
            text: "Quotation & negotiation",
            subtitle: "Commercial package assembled",
          },
          {
            type: "card",
            title: "Quote draft",
            body: "Hardware + 3-year service · Rev 2 sent to customer",
            tone: "accent",
          },
          {
            type: "pipeline",
            stages: ["Discover", "Solution", "Propose", "Negotiate", "Close"],
            activeIndex: 3,
            valueLabel: "£405k",
          },
        ],
      },
      {
        id: "won",
        title: "Deal closure",
        startMs: 25_000,
        endMs: durationMs,
        narration: "The opportunity reaches Closed Won with a concise executive summary.",
        elements: [
          {
            type: "title",
            text: "Closed Won",
            subtitle: "Hand-off to delivery & success",
          },
          {
            type: "metric",
            label: "Final contract value",
            value: "£398k",
            hint: "Closed · Q2 FY26",
          },
          {
            type: "card",
            title: "Summary",
            body: "Helios Automation — 24-site rollout · kick-off in 10 days",
            tone: "success",
          },
        ],
      },
    ],
  };
}
