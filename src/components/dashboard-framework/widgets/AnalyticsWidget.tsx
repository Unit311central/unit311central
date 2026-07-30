"use client";

import type {
  DashboardAnalyticsAnnotation,
  DashboardAnalyticsSeries,
  DashboardAnalyticsWidget,
} from "@/lib/dashboard-framework";
import { withPreferredCurrencySymbol } from "@/lib/accounting/chart-of-accounts";
import { cn } from "@/lib/utils";
import { WidgetTitle, widgetShellClass } from "./widget-shell";

const SERIES_COLORS = ["var(--platform-accent, #2F80ED)", "#34d399", "#fbbf24", "#a78bfa"];

const TONE_CLASS: Record<NonNullable<DashboardAnalyticsAnnotation["tone"]>, string> = {
  neutral: "text-white/70",
  positive: "text-emerald-300",
  warning: "text-amber-300",
  critical: "text-rose-300",
};

function formatSeriesValue(series: DashboardAnalyticsSeries, value: number) {
  if (series.format === "currency") {
    const currency = String(series.currency ?? "GBP").toUpperCase();
    const abs = Math.abs(value);
    const formatted =
      abs >= 10_000
        ? new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency,
            notation: "compact",
            maximumFractionDigits: 1,
          }).format(value)
        : new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          }).format(value);
    return withPreferredCurrencySymbol(formatted, currency);
  }
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

function latestDisplay(series: DashboardAnalyticsSeries) {
  if (series.latestLabel) return series.latestLabel;
  const latest = series.values[series.values.length - 1] ?? 0;
  return formatSeriesValue(series, latest);
}

function periodLabels(seriesList: readonly DashboardAnalyticsSeries[]): string[] {
  const withLabels = seriesList.find((s) => s.labels && s.labels.length > 0);
  if (withLabels?.labels) return [...withLabels.labels];
  const len = Math.max(0, ...seriesList.map((s) => s.values.length));
  return Array.from({ length: len }, (_, i) => `P${i + 1}`);
}

export default function AnalyticsWidget({ widget }: { widget: DashboardAnalyticsWidget }) {
  const seriesList = widget.series;
  const pointCount = Math.max(0, ...seriesList.map((s) => s.values.length));
  const labels = periodLabels(seriesList);
  const max = Math.max(1, ...seriesList.flatMap((s) => s.values));
  const hasData = seriesList.some((s) => s.values.some((v) => v !== 0));
  const useGrouped = seriesList.length >= 2 && pointCount > 0;

  return (
    <section className={widgetShellClass()}>
      <WidgetTitle title={widget.title ?? "Analytics"} meta={widget.caption} />

      {widget.annotations && widget.annotations.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {widget.annotations.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
            >
              <p className="text-[10px] uppercase tracking-wide text-white/45">{item.label}</p>
              <p
                className={cn(
                  "mt-0.5 text-[13px] font-semibold tabular-nums",
                  TONE_CLASS[item.tone ?? "neutral"],
                )}
              >
                {item.value}
              </p>
              {item.hint ? <p className="mt-0.5 text-[10px] text-white/35">{item.hint}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {!hasData ? (
        <p className="py-6 text-center text-[12px] text-white/40">
          {widget.emptyMessage ?? "No performance data for this period yet."}
        </p>
      ) : useGrouped ? (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            {seriesList.map((series, seriesIndex) => (
              <div key={series.id} className="flex items-center gap-1.5 text-[11px] text-white/60">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: SERIES_COLORS[seriesIndex % SERIES_COLORS.length] }}
                />
                <span>{series.label}</span>
                <span className="tabular-nums text-white/40">{latestDisplay(series)}</span>
              </div>
            ))}
          </div>

          <div className="flex h-28 items-end gap-1.5 sm:gap-2">
            {Array.from({ length: pointCount }, (_, index) => {
              const period = labels[index] ?? `P${index + 1}`;
              return (
                <div key={period + index} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end justify-center gap-0.5">
                    {seriesList.map((series, seriesIndex) => {
                      const value = series.values[index] ?? 0;
                      const height = Math.max(value > 0 ? 6 : 2, (value / max) * 100);
                      return (
                        <div
                          key={`${series.id}-${index}`}
                          className="min-w-0 flex-1 rounded-t-sm opacity-95"
                          style={{
                            height: `${height}%`,
                            background: SERIES_COLORS[seriesIndex % SERIES_COLORS.length],
                          }}
                          title={`${period} · ${series.label}: ${formatSeriesValue(series, value)}`}
                        />
                      );
                    })}
                  </div>
                  <span className="truncate text-[9px] text-white/40">{period}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-white/30">
            Scale to {formatSeriesValue(seriesList[0], max)} · hover bars for exact amounts
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {seriesList.map((series, seriesIndex) => (
            <div key={series.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="text-[12px] text-white/70">{series.label}</p>
                <p className="text-[11px] tabular-nums text-white/50">{latestDisplay(series)}</p>
              </div>
              <div className="flex h-16 items-end gap-1">
                {series.values.map((value, index) => (
                  <div key={`${series.id}-${index}`} className="flex min-w-0 flex-1 flex-col justify-end gap-1">
                    <div
                      className="w-full rounded-t-sm opacity-90"
                      style={{
                        height: `${Math.max(8, (value / max) * 100)}%`,
                        background: SERIES_COLORS[seriesIndex % SERIES_COLORS.length],
                      }}
                      title={`${labels[index] ?? index + 1} · ${series.label}: ${formatSeriesValue(series, value)}`}
                    />
                    {labels[index] ? (
                      <span className="truncate text-center text-[9px] text-white/35">{labels[index]}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
