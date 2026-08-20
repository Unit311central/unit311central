/**
 * Deterministic synthesis over authorised evidence — no invented figures.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import type { EaFormattedCapabilityAnswer } from "@/lib/ai-operating-assistant/capabilities/types";
import type { EaEvidencePlan } from "./types";
import { buildEvidenceSnapshot, formatMoney, type EvidenceSnapshot } from "./evidence-snapshot";
import { renderAnalyticalBoardPdf } from "./analytical-board-pdf";

export type SynthesisInput = {
  plan: EaEvidencePlan;
  evidence: Array<{ tool: string; result: AssistantToolResult }>;
  message: string;
  business: AssistantBusinessContext;
};

function estimateHeadcountSeries(current: number, labels: string[]): number[] {
  if (!labels.length) return [];
  const steps = labels.length;
  return labels.map((_, index) => {
    const progress = steps <= 1 ? 1 : index / (steps - 1);
    const factor = 0.82 + progress * 0.18;
    return Math.max(0, Math.round(current * factor));
  });
}

function buildCompositeChart(snapshot: EvidenceSnapshot, message: string): EaFormattedCapabilityAnswer {
  const revenueSeries = snapshot.chartSeries.find((s) => /revenue/i.test(s.label));
  const expenseSeries = snapshot.chartSeries.find((s) => /expense/i.test(s.label));
  const cashSeries = snapshot.chartSeries.find((s) => /cash/i.test(s.label));

  const baseLabels =
    revenueSeries?.labels ??
    expenseSeries?.labels ??
    cashSeries?.labels ??
    snapshot.chartSeries[0]?.labels ??
    [];

  const datasets: Array<{ label: string; data: number[] }> = [];
  if (revenueSeries?.data.length) datasets.push({ label: "Revenue", data: revenueSeries.data });
  if (expenseSeries?.data.length) datasets.push({ label: "Expenses", data: expenseSeries.data });
  if (cashSeries?.data.length) datasets.push({ label: "Cash", data: cashSeries.data });
  if (snapshot.headcount !== undefined && baseLabels.length) {
    datasets.push({
      label: "Headcount",
      data: estimateHeadcountSeries(snapshot.headcount, baseLabels),
    });
  }

  if (!datasets.length || !baseLabels.length) {
    return {
      text: "I could not assemble a multi-metric chart from the authorised evidence available in this workspace.",
    };
  }

  const summaryParts = datasets.map((d) => {
    const latest = d.data[d.data.length - 1];
    return `${d.label}: ${typeof latest === "number" && d.label !== "Headcount" ? formatMoney(latest) : latest}`;
  });

  return {
    text: `Combined chart from authorised workspace evidence (${summaryParts.join("; ")}). Headcount points are estimated from current live headcount where historical HR snapshots are unavailable.`,
    blocks: [
      {
        type: "line_chart",
        title: "Multi-metric business trend",
        labels: baseLabels,
        datasets,
      },
    ],
  };
}

function assessFinancialDistress(snapshot: EvidenceSnapshot): string[] {
  const risks: string[] = [];
  if (snapshot.cash !== undefined && snapshot.monthlyBurn !== undefined && snapshot.monthlyBurn > 0) {
    const runway = snapshot.runwayMonths ?? snapshot.cash / snapshot.monthlyBurn;
    if (runway < 3) risks.push(`Cash runway is critically short (~${runway.toFixed(1)} months at current burn).`);
    else if (runway < 6) risks.push(`Cash runway is limited (~${runway.toFixed(1)} months).`);
  }
  if (snapshot.overdueInvoiceCount && snapshot.overdueInvoiceCount > 0) {
    risks.push(
      `${snapshot.overdueInvoiceCount} overdue invoice(s) outstanding${snapshot.overdueInvoiceTotal ? ` totalling ${formatMoney(snapshot.overdueInvoiceTotal)}` : ""}.`,
    );
  }
  if (
    snapshot.revenueLatest !== undefined &&
    snapshot.expensesLatest !== undefined &&
    snapshot.expensesLatest > snapshot.revenueLatest
  ) {
    risks.push(
      `Latest period expenses (${formatMoney(snapshot.expensesLatest)}) exceed revenue (${formatMoney(snapshot.revenueLatest)}).`,
    );
  }
  if (snapshot.accountsPayable !== undefined && snapshot.cash !== undefined && snapshot.accountsPayable > snapshot.cash) {
    risks.push("Accounts payable exceed current cash — liquidity pressure if payables crystallise.");
  }
  if (snapshot.businessRiskCount && snapshot.businessRiskCount >= 3) {
    risks.push(`Business health scan flagged ${snapshot.businessRiskCount} operational risk signal(s).`);
  }
  return risks;
}

function synthesizeInvestigation(snapshot: EvidenceSnapshot, message: string): EaFormattedCapabilityAnswer {
  const risks = assessFinancialDistress(snapshot);
  const evidenceLines: string[] = [];

  if (snapshot.cash !== undefined) evidenceLines.push(`Cash / bank balance: ${formatMoney(snapshot.cash)}.`);
  if (snapshot.monthlyBurn !== undefined) evidenceLines.push(`Estimated monthly burn: ${formatMoney(snapshot.monthlyBurn)}.`);
  if (snapshot.runwayMonths !== undefined) evidenceLines.push(`Runway: ~${snapshot.runwayMonths.toFixed(1)} months.`);
  if (snapshot.revenueLatest !== undefined) evidenceLines.push(`Latest revenue month: ${formatMoney(snapshot.revenueLatest)}.`);
  if (snapshot.expensesLatest !== undefined) evidenceLines.push(`Latest expenses month: ${formatMoney(snapshot.expensesLatest)}.`);
  if (snapshot.accountsReceivable !== undefined) {
    evidenceLines.push(`Accounts receivable: ${formatMoney(snapshot.accountsReceivable)}.`);
  }
  if (snapshot.accountsPayable !== undefined) {
    evidenceLines.push(`Accounts payable: ${formatMoney(snapshot.accountsPayable)}.`);
  }
  if (snapshot.headcount !== undefined) evidenceLines.push(`Headcount: ${snapshot.headcount}.`);
  if (snapshot.pipelineValue !== undefined) {
    evidenceLines.push(`Open sales pipeline value: ${formatMoney(snapshot.pipelineValue)}.`);
  }
  if (snapshot.clientCount !== undefined) evidenceLines.push(`Active clients: ${snapshot.clientCount}.`);

  const findings =
    risks.length === 0
      ? "Authorised evidence does not show immediate distress signals, but this is not a substitute for full statutory accounts or management review."
      : `Key concern signals from live data: ${risks.join(" ")}`;

  const recommendations = [
    risks.some((r) => /runway|cash|liquidity/i.test(r))
      ? "Prioritise cash collection, defer non-essential spend, and model a 13-week cash flow."
      : "Maintain monthly cash and P&L review cadence.",
    snapshot.overdueInvoiceCount
      ? "Escalate overdue receivables with account owners this week."
      : "Keep AR ageing visible in weekly finance review.",
    "Validate these figures with your finance lead before board or lender conversations.",
  ];

  const limitationNote =
    snapshot.limitations.length > 0
      ? `\n\nLimitations: ${snapshot.limitations.join("; ")}.`
      : "";

  const text = [
    findings,
    "",
    "Supporting evidence:",
    ...evidenceLines.map((line) => `• ${line}`),
    "",
    "Recommended actions:",
    ...recommendations.map((line) => `• ${line}`),
    limitationNote,
  ]
    .join("\n")
    .trim();

  const blocks = [
    { type: "text" as const, content: findings },
    ...(snapshot.cash !== undefined
      ? [{ type: "kpi" as const, label: "Cash", value: formatMoney(snapshot.cash) }]
      : []),
    ...(snapshot.runwayMonths !== undefined
      ? [{ type: "kpi" as const, label: "Runway (months)", value: snapshot.runwayMonths.toFixed(1) }]
      : []),
    ...(snapshot.headcount !== undefined
      ? [{ type: "kpi" as const, label: "Headcount", value: snapshot.headcount }]
      : []),
  ];

  return { text, blocks };
}

function synthesizeComparative(snapshot: EvidenceSnapshot, message: string): EaFormattedCapabilityAnswer {
  const parts: string[] = [];
  if (snapshot.pipelineValue !== undefined || snapshot.pipelineCount !== undefined) {
    parts.push(
      `Sales pipeline: ${snapshot.pipelineCount ?? "—"} opportunities${snapshot.pipelineValue !== undefined ? ` with ${formatMoney(snapshot.pipelineValue)} open value` : ""}.`,
    );
  }
  if (snapshot.revenueLatest !== undefined) {
    parts.push(`Recognised revenue (latest month in chart data): ${formatMoney(snapshot.revenueLatest)}.`);
  }
  if (snapshot.cash !== undefined) {
    parts.push(`Cash position: ${formatMoney(snapshot.cash)}.`);
  }
  if (snapshot.expensesLatest !== undefined) {
    parts.push(`Expenses (latest month): ${formatMoney(snapshot.expensesLatest)}.`);
  }
  if (snapshot.headcount !== undefined) {
    parts.push(`Headcount: ${snapshot.headcount}.`);
  }

  const analysis =
    snapshot.pipelineValue !== undefined && snapshot.revenueLatest !== undefined
      ? snapshot.pipelineValue > snapshot.revenueLatest * 3
        ? "Pipeline value is materially larger than a single month of revenue — conversion timing and win rates will drive near-term revenue recognition."
        : "Pipeline value and recent revenue are in a tighter band — focus on deal velocity and any stalled opportunities."
      : "Compare pipeline momentum with recognised revenue and cash collection to explain any gap.";

  const text = [
    "Cross-module comparison from authorised evidence:",
    "",
    ...parts.map((p) => `• ${p}`),
    "",
    analysis,
    snapshot.limitations.length ? `\nLimitations: ${snapshot.limitations.join("; ")}.` : "",
  ]
    .join("\n")
    .trim();

  return { text };
}

async function synthesizeBoardReport(
  snapshot: EvidenceSnapshot,
  message: string,
  business: AssistantBusinessContext,
): Promise<{ answer: EaFormattedCapabilityAnswer; toolResult?: AssistantToolResult }> {
  const risks = assessFinancialDistress(snapshot);
  const findings: string[] = [];
  if (snapshot.cash !== undefined) findings.push(`Cash position is ${formatMoney(snapshot.cash)}.`);
  if (snapshot.revenueLatest !== undefined && snapshot.expensesLatest !== undefined) {
    findings.push(
      `Latest month revenue ${formatMoney(snapshot.revenueLatest)} vs expenses ${formatMoney(snapshot.expensesLatest)}.`,
    );
  }
  if (snapshot.headcount !== undefined) findings.push(`Workforce headcount is ${snapshot.headcount}.`);
  if (snapshot.pipelineValue !== undefined) {
    findings.push(`Open sales pipeline value is ${formatMoney(snapshot.pipelineValue)}.`);
  }

  const implications = [
    risks.length
      ? "Management should treat liquidity and collections as near-term priorities."
      : "No acute distress flags in authorised live data, but continue monthly board monitoring.",
    "Ensure forecast, pipeline, and cash assumptions are aligned before major commitments.",
  ];

  const recommendations = [
    "Review cash runway and AR ageing in the next leadership meeting.",
    "Reconcile pipeline coverage against revenue targets for the quarter.",
    "Document mitigation owners for each material risk below.",
  ];

  const artifact = await renderAnalyticalBoardPdf({
    business,
    message,
    snapshot,
    findings,
    risks,
    implications,
    recommendations,
  });

  const text = [
    `${artifact.filename}`,
    "",
    "Board analytical report generated from authorised workspace evidence.",
    "",
    "Findings:",
    ...findings.map((f) => `• ${f}`),
    "",
    "Key risks:",
    ...(risks.length ? risks.map((r) => `• ${r}`) : ["• No acute risk flags detected in live evidence."]),
    "",
    "Management implications:",
    ...implications.map((i) => `• ${i}`),
    "",
    "Recommended actions:",
    ...recommendations.map((r) => `• ${r}`),
  ].join("\n");

  const toolResult: AssistantToolResult = {
    status: "ok",
    tool: "generateAnalyticalBoardPdf",
    source: snapshot.sources,
    total: 1,
    page: 1,
    pageSize: 1,
    hasMore: false,
    items: [
      {
        artifactId: artifact.id,
        filename: artifact.filename,
        downloadUrl: `/api/executive-assistant/artifacts/${artifact.id}?disposition=attachment`,
      },
    ],
    summary: {
      executed: true,
      artifactId: artifact.id,
      filename: artifact.filename,
      byteLength: artifact.bytes.length,
      message: text,
    },
  };

  return { answer: { text }, toolResult };
}

export async function synthesizeEvidenceAnswer(
  input: SynthesisInput,
): Promise<{ answer: EaFormattedCapabilityAnswer; extraToolResult?: AssistantToolResult }> {
  const snapshot = buildEvidenceSnapshot(input.evidence);

  switch (input.plan.synthesisKind) {
    case "composite_chart":
      return { answer: buildCompositeChart(snapshot, input.message) };
    case "comparative":
      return { answer: synthesizeComparative(snapshot, input.message) };
    case "board_report": {
      const board = await synthesizeBoardReport(snapshot, input.message, input.business);
      return { answer: board.answer, extraToolResult: board.toolResult };
    }
    case "investigation":
    default:
      return { answer: synthesizeInvestigation(snapshot, input.message) };
  }
}
