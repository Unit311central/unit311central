import type { EaResponseBlock } from "@/lib/ai-operating-assistant/capabilities/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";

import type { EaAcceptanceCheck, EaAcceptanceQuestionKind } from "./types";

const DEAD_END_PATTERNS = [
  /waiting for live business data/i,
  /i don'?t have data/i,
  /cannot answer that/i,
  /not connected/i,
  /no live source registered/i,
];

const GENERIC_CATALOGUE_PATTERNS = [
  /gives you visibility/i,
  /is where you (can )?find/i,
  /module in the sidebar/i,
  /applications are under/i,
  /you can access .* from the/i,
  /executive assistant can help with/i,
  /^[A-Z][a-z]+ gives you/i,
  /overview of the module/i,
  /catalogue entry/i,
  /platform navigation/i,
  /open module/i,
];

const PDF_FAILURE_PATTERNS = [
  /included:\s*none/i,
  /no live metrics recognised/i,
  /no live source registered/i,
];

const CURRENCY_OR_AMOUNT =
  /[£$€]|\b(GBP|USD|EUR)\b|\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(k|m|million|billion)?\b/i;

export function isGenericCatalogueAnswer(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  return GENERIC_CATALOGUE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isDeadEndAnswer(text: string): boolean {
  return DEAD_END_PATTERNS.some((pattern) => pattern.test(text));
}

export function promptExpectsChart(prompt: string): boolean {
  return /\b(graph|chart|plot|visuali[sz]e|trend line|line chart|bar chart)\b/i.test(prompt);
}

export function promptExpectsFinancialFigure(prompt: string): boolean {
  return /\b(bank balance|cash position|cash balance|how much cash|treasury balance|money in the bank|runway|ar\b|accounts receivable|payroll gross|p&l|profit|revenue)\b/i.test(
    prompt,
  );
}

export function promptExpectsCount(prompt: string): boolean {
  return /\b(how many|number of|count of|headcount|staff count|employee count)\b/i.test(prompt);
}

export function hasChartBlock(blocks?: EaResponseBlock[]): boolean {
  return Boolean(
    blocks?.some(
      (block) =>
        block.type === "line_chart" ||
        block.type === "bar_chart" ||
        block.type === "pie_chart",
    ),
  );
}

export function hasKpiOrTableBlock(blocks?: EaResponseBlock[]): boolean {
  return Boolean(blocks?.some((block) => block.type === "kpi" || block.type === "table"));
}

export function hasSubstantiveDataSignal(text: string, prompt: string, blocks?: EaResponseBlock[]): boolean {
  if (isGenericCatalogueAnswer(text) || isDeadEndAnswer(text)) return false;
  if (hasKpiOrTableBlock(blocks) || hasChartBlock(blocks)) return true;

  if (promptExpectsFinancialFigure(prompt)) return CURRENCY_OR_AMOUNT.test(text);
  if (promptExpectsCount(prompt)) return /\b\d+\b/.test(text);
  if (promptExpectsChart(prompt)) return hasChartBlock(blocks);

  return /\b\d+\b/.test(text) || (text.trim().length >= 48 && !isGenericCatalogueAnswer(text));
}

function check(id: string, passed: boolean, message: string): EaAcceptanceCheck {
  return { id, passed, message };
}

function extractPdfSummary(toolResult?: AssistantToolResult): {
  message: string;
  byteLength?: number;
  metrics?: string[];
} {
  if (!toolResult || typeof toolResult !== "object") return { message: "" };
  const row = toolResult as Record<string, unknown>;
  const summary = row.summary as Record<string, unknown> | undefined;
  const message = typeof summary?.message === "string" ? summary.message : "";
  const byteLength = typeof summary?.byteLength === "number" ? summary.byteLength : undefined;
  const metrics = Array.isArray(summary?.metrics)
    ? (summary.metrics as string[]).filter((m) => typeof m === "string")
    : undefined;
  return { message, byteLength, metrics };
}

export type EaAssertionInput = {
  prompt: string;
  kind: EaAcceptanceQuestionKind;
  routeKind: string;
  capabilityId?: string;
  tool?: string;
  deterministic?: boolean;
  gptRequired?: boolean;
  text?: string;
  responseBlocks?: EaResponseBlock[];
  toolResult?: AssistantToolResult;
  artifactByteLength?: number;
  expectTool?: string;
  expectCapabilityId?: string;
  expectDeterministic?: boolean;
  /** When false, only routing/orchestration checks run (no live tool execution). */
  executed?: boolean;
};

export function runEaAcceptanceAssertions(input: EaAssertionInput): EaAcceptanceCheck[] {
  const checks: EaAcceptanceCheck[] = [];
  const text = String(input.text ?? "").trim();
  const executed = input.executed !== false;

  if (input.expectTool) {
    checks.push(
      check(
        "expected_tool",
        input.tool === input.expectTool,
        input.tool === input.expectTool
          ? `Resolved tool ${input.tool}`
          : `Expected tool ${input.expectTool}, got ${input.tool ?? "none"}`,
      ),
    );
  }

  if (input.expectCapabilityId) {
    checks.push(
      check(
        "expected_capability",
        input.capabilityId === input.expectCapabilityId,
        input.capabilityId === input.expectCapabilityId
          ? `Matched capability ${input.capabilityId}`
          : `Expected capability ${input.expectCapabilityId}, got ${input.capabilityId ?? "none"}`,
      ),
    );
  }

  if (input.kind === "navigation") {
    const navigationOk =
      input.routeKind === "platform_answer" ||
      input.tool === "searchApplications" ||
      (input.routeKind === "tool" && input.tool === "searchApplications");
    checks.push(
      check(
        "navigation_route",
        navigationOk,
        navigationOk
          ? "Navigation route resolved"
          : `Expected navigation route, got ${input.routeKind}${input.tool ? ` (${input.tool})` : ""}`,
      ),
    );
    if (text) {
      checks.push(
        check(
          "navigation_has_guidance",
          !isDeadEndAnswer(text),
          isDeadEndAnswer(text) ? "Navigation answer was a dead end" : "Navigation guidance present",
        ),
      );
    }
    return checks;
  }

  if (input.kind === "denied") {
    const deniedOk =
      input.routeKind === "capability_answer" &&
      /can'?t|cannot|not enabled|not available|only access data for your current workspace/i.test(text);
    checks.push(
      check(
        "denied_message",
        deniedOk,
        deniedOk ? "Request correctly denied" : `Expected denial message, got route=${input.routeKind}`,
      ),
    );
    return checks;
  }

  if (input.kind === "clarification") {
    const clarifyOk = input.routeKind === "need_info" || /which|clarify|need (a |more )/i.test(text);
    checks.push(
      check(
        "clarification",
        clarifyOk,
        clarifyOk ? "Clarification requested" : `Expected clarification, got ${input.routeKind}`,
      ),
    );
    return checks;
  }

  if (input.kind === "pdf") {
    if (!executed) {
      checks.push(
        check(
          "pdf_route",
          input.routeKind === "tool" && Boolean(input.tool?.toLowerCase().includes("pdf") || input.tool === "boardpack.generate"),
          `Expected PDF tool route, got ${input.routeKind}${input.tool ? ` (${input.tool})` : ""}`,
        ),
      );
      return checks;
    }
    const pdfTool =
      input.tool === "generateScopedBusinessPdf" ||
      input.tool === "boardpack.generate" ||
      input.tool === "generateBusinessReportPdf";
    checks.push(
      check(
        "pdf_tool",
        pdfTool || input.routeKind === "semantic_answer",
        pdfTool
          ? `PDF tool ${input.tool}`
          : `Expected PDF tool route, got ${input.routeKind}${input.tool ? ` (${input.tool})` : ""}`,
      ),
    );

    const pdfMeta = extractPdfSummary(input.toolResult);
    const pdfText = pdfMeta.message || text;
    const pdfFailed = PDF_FAILURE_PATTERNS.some((pattern) => pattern.test(pdfText));
    checks.push(
      check(
        "pdf_has_live_content",
        !pdfFailed,
        pdfFailed ? `PDF missing live content: ${pdfText.slice(0, 160)}` : "PDF includes live metrics",
      ),
    );

    const bytes = input.artifactByteLength ?? pdfMeta.byteLength;
    if (bytes != null) {
      checks.push(
        check(
          "pdf_byte_length",
          bytes >= 1500,
          bytes >= 1500 ? `PDF size ${bytes} bytes` : `PDF too small (${bytes} bytes) — likely empty`,
        ),
      );
    }

    if (pdfMeta.metrics) {
      checks.push(
        check(
          "pdf_metrics",
          pdfMeta.metrics.length > 0,
          pdfMeta.metrics.length > 0
            ? `PDF metrics: ${pdfMeta.metrics.join(", ")}`
            : "PDF has no resolved metrics",
        ),
      );
    }

    return checks;
  }

  if (input.kind === "chart" || promptExpectsChart(input.prompt)) {
    if (!executed) {
      checks.push(
        check(
          "chart_route",
          input.routeKind === "semantic_answer" ||
            (input.routeKind === "tool" && Boolean(input.capabilityId)),
          `Expected chart-capable route, got ${input.routeKind}`,
        ),
      );
      return checks;
    }
    const chartOk = hasChartBlock(input.responseBlocks);
    checks.push(
      check(
        "chart_block",
        chartOk,
        chartOk ? "Chart block returned" : "Expected chart block but none was returned",
      ),
    );
    if (text) {
      checks.push(
        check(
          "chart_not_generic",
          !isGenericCatalogueAnswer(text),
          isGenericCatalogueAnswer(text) ? "Chart answer was generic catalogue text" : "Chart answer is substantive",
        ),
      );
    }
    return checks;
  }

  if (input.kind === "composite") {
    if (input.gptRequired) {
      checks.push(
        check(
          "composite_evidence_route",
          input.routeKind === "evidence_gpt",
          input.routeKind === "evidence_gpt"
            ? "Composite question routed to evidence+GPT path"
            : `Expected evidence_gpt for composite reasoning, got ${input.routeKind}`,
        ),
      );
      return checks;
    }

    const compositeOk =
      input.routeKind === "semantic_answer" ||
      (input.routeKind === "tool" && Boolean(input.capabilityId)) ||
      input.routeKind === "evidence_gpt";
    checks.push(
      check(
        "composite_route",
        compositeOk,
        compositeOk
          ? `Composite route ${input.routeKind}`
          : `Expected semantic or evidence route for composite question, got ${input.routeKind}`,
      ),
    );
    if (text) {
      checks.push(
        check(
          "composite_substance",
          hasSubstantiveDataSignal(text, input.prompt, input.responseBlocks),
          "Composite answer must include live data, not catalogue copy",
        ),
      );
    }
    return checks;
  }

  // data + action default
  if (input.routeKind === "platform_answer") {
    checks.push(
      check(
        "not_catalogue_only",
        false,
        "Data question resolved to platform catalogue answer instead of live data",
      ),
    );
    return checks;
  }

  if (input.routeKind === "none") {
    checks.push(
      check(
        "route_resolved",
        false,
        "No orchestration route — question fell through to GPT without deterministic capability",
      ),
    );
    return checks;
  }

  if (input.gptRequired && input.routeKind === "evidence_gpt") {
    checks.push(
      check(
        "evidence_gpt_route",
        true,
        "Routed to authorised-evidence GPT path (acceptable for strategic questions)",
      ),
    );
    return checks;
  }

  const liveRouteOk =
    input.routeKind === "semantic_answer" ||
    input.routeKind === "tool" ||
    input.routeKind === "workflow_read";
  checks.push(
    check(
      "live_data_route",
      liveRouteOk,
      liveRouteOk
        ? `Live data route ${input.routeKind}`
        : `Expected live data route, got ${input.routeKind}`,
    ),
  );

  if (!executed) {
    if (
      input.expectDeterministic !== false &&
      (promptExpectsFinancialFigure(input.prompt) || promptExpectsCount(input.prompt))
    ) {
      checks.push(
        check(
          "deterministic_route",
          input.deterministic === true && !input.gptRequired,
          input.deterministic
            ? "Deterministic route flagged"
            : "Expected deterministic route without GPT-Terra",
        ),
      );
    }
    return checks;
  }

  if (input.toolResult) {
    const status = String((input.toolResult as { status?: string }).status ?? "");
    checks.push(
      check(
        "tool_status",
        status === "ok" || status === "partial",
        status === "ok" || status === "partial"
          ? `Tool status ${status}`
          : `Tool returned status ${status || "unknown"}`,
      ),
    );
  }

  if (text) {
    checks.push(
      check(
        "not_generic_catalogue",
        !isGenericCatalogueAnswer(text),
        isGenericCatalogueAnswer(text)
          ? "Answer is generic module catalogue text, not live data"
          : "Answer is not generic catalogue copy",
      ),
    );
    checks.push(
      check(
        "not_dead_end",
        !isDeadEndAnswer(text),
        isDeadEndAnswer(text) ? "Answer is a dead-end stub" : "Answer is not a dead end",
      ),
    );
    checks.push(
      check(
        "substantive_data",
        hasSubstantiveDataSignal(text, input.prompt, input.responseBlocks),
        "Answer includes substantive live data for the question",
      ),
    );
  } else if (!hasKpiOrTableBlock(input.responseBlocks) && !hasChartBlock(input.responseBlocks)) {
    checks.push(
      check("has_answer_text", false, "No answer text or structured blocks returned"),
    );
  }

  if (
    input.expectDeterministic !== false &&
    (promptExpectsFinancialFigure(input.prompt) || promptExpectsCount(input.prompt))
  ) {
    checks.push(
      check(
        "deterministic_path",
        input.deterministic === true && !input.gptRequired,
        input.deterministic
          ? "Deterministic path used (no GPT required)"
          : "Expected deterministic resolution without GPT-Terra",
      ),
    );
  }

  return checks;
}

export function acceptanceChecksPassed(checks: EaAcceptanceCheck[]): boolean {
  return checks.length > 0 && checks.every((row) => row.passed);
}

export function formatFailedChecks(checks: EaAcceptanceCheck[]): string {
  return checks
    .filter((row) => !row.passed)
    .map((row) => `${row.id}: ${row.message}`)
    .join("; ");
}
