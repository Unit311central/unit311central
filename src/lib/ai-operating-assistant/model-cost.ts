/**
 * Approximate OpenAI USD pricing for EA cost dashboards (Internal Platform Analytics).
 * Override via env when list prices change or for unreleased models.
 */

export type ModelPricePer1M = { inputUsd: number; outputUsd: number };

const DEFAULT_PRICES: Record<string, ModelPricePer1M> = {
  "gpt-4o-mini": { inputUsd: 0.15, outputUsd: 0.6 },
  "gpt-4o": { inputUsd: 2.5, outputUsd: 10 },
  "gpt-4.1": { inputUsd: 2, outputUsd: 8 },
  "gpt-4.1-mini": { inputUsd: 0.4, outputUsd: 1.6 },
  "gpt-5.6-terra": { inputUsd: 3, outputUsd: 12 },
  "o3-mini": { inputUsd: 1.1, outputUsd: 4.4 },
};

function envPrice(key: "input" | "output"): number | null {
  const raw =
    key === "input"
      ? process.env.OPENAI_ASSISTANT_INPUT_USD_PER_1M
      : process.env.OPENAI_ASSISTANT_OUTPUT_USD_PER_1M;
  if (!raw?.trim()) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function resolveModelPrice(model: string): { price: ModelPricePer1M; isEstimate: boolean } {
  const normalized = model.trim().toLowerCase();
  const envIn = envPrice("input");
  const envOut = envPrice("output");
  if (envIn != null && envOut != null) {
    return { price: { inputUsd: envIn, outputUsd: envOut }, isEstimate: true };
  }

  const exact = DEFAULT_PRICES[normalized];
  if (exact) return { price: exact, isEstimate: true };

  const prefix = Object.keys(DEFAULT_PRICES).find((key) => normalized.startsWith(key));
  if (prefix) {
    return { price: DEFAULT_PRICES[prefix]!, isEstimate: true };
  }

  return {
    price: { inputUsd: 2.5, outputUsd: 10 },
    isEstimate: true,
  };
}

export function estimateModelCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const { price } = resolveModelPrice(model);
  const inCost = (Math.max(0, inputTokens) / 1_000_000) * price.inputUsd;
  const outCost = (Math.max(0, outputTokens) / 1_000_000) * price.outputUsd;
  return Math.round((inCost + outCost) * 1_000_000) / 1_000_000;
}

export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  if (amount < 10) return `$${amount.toFixed(2)}`;
  return `$${amount.toFixed(2)}`;
}
