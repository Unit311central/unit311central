/** Parse display metrics (currency, %, counts) for count-up animation. */
export type ParsedDemoMetric = {
  numeric: number | null;
  prefix: string;
  suffix: string;
  decimals: number;
};

export function parseDemoMetricValue(raw: string | number): ParsedDemoMetric {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { numeric: raw, prefix: "", suffix: "", decimals: 0 };
  }
  const text = String(raw).trim();
  if (!text || text === "—") {
    return { numeric: null, prefix: "", suffix: "", decimals: 0 };
  }

  const percent = text.endsWith("%");
  const core = percent ? text.slice(0, -1).trim() : text;
  const match = core.match(/^([^0-9\-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) {
    return { numeric: null, prefix: "", suffix: text, decimals: 0 };
  }

  const prefix = match[1] ?? "";
  const numStr = (match[2] ?? "").replace(/,/g, "");
  const trailing = match[3] ?? "";
  const numeric = Number(numStr);
  if (!Number.isFinite(numeric)) {
    return { numeric: null, prefix: "", suffix: text, decimals: 0 };
  }
  const decimals = numStr.includes(".") ? (numStr.split(".")[1]?.length ?? 0) : 0;
  const suffix = `${trailing}${percent ? "%" : ""}`;
  return { numeric, prefix, suffix, decimals };
}

export function formatDemoMetricValue(parsed: ParsedDemoMetric, value: number): string {
  if (parsed.numeric == null) return "";
  const fixed =
    parsed.decimals > 0
      ? value.toLocaleString("en-GB", {
          minimumFractionDigits: parsed.decimals,
          maximumFractionDigits: parsed.decimals,
        })
      : Math.round(value).toLocaleString("en-GB");
  return `${parsed.prefix}${fixed}${parsed.suffix}`;
}
