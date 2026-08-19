"use client";

import type { EaResponseBlock } from "@/lib/ai-operating-assistant/capabilities/types";

type Props = {
  blocks: EaResponseBlock[];
};

export default function EaResponseBlocks({ blocks }: Props) {
  return (
    <div className="mt-3 space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "kpi") {
          return (
            <div
              key={`kpi-${index}`}
              className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3"
            >
              <div className="text-xs uppercase tracking-wide text-cyan-200/70">{block.label}</div>
              <div className="text-2xl font-semibold text-white">
                {block.value}
                {block.unit ? ` ${block.unit}` : ""}
              </div>
            </div>
          );
        }
        if (block.type === "table") {
          return (
            <div key={`table-${index}`} className="overflow-x-auto rounded-lg border border-white/10">
              {block.title ? (
                <div className="border-b border-white/10 px-3 py-2 text-sm font-medium text-white/90">
                  {block.title}
                </div>
              ) : null}
              <table className="min-w-full text-left text-sm text-white/85">
                <thead className="bg-white/5 text-xs uppercase text-white/60">
                  <tr>
                    {block.columns.map((col) => (
                      <th key={col} className="px-3 py-2 font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-white/5">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (
          block.type === "line_chart" ||
          block.type === "bar_chart" ||
          block.type === "pie_chart"
        ) {
          const max =
            block.type === "pie_chart"
              ? Math.max(...block.values, 1)
              : Math.max(...block.datasets.flatMap((d) => d.data), 1);
          return (
            <div
              key={`chart-${index}`}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="mb-2 text-sm font-medium text-white/90">{block.title}</div>
              <div className="flex h-28 items-end gap-1">
                {(block.type === "pie_chart" ? block.values : block.datasets[0]?.data ?? []).map(
                  (value, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-cyan-400/80"
                        style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
                        title={String(value)}
                      />
                      <span className="truncate text-[10px] text-white/50">
                        {block.type === "pie_chart"
                          ? block.labels[i]
                          : block.labels[i] ?? i + 1}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          );
        }
        if (block.type === "text") {
          return (
            <p key={`text-${index}`} className="text-sm text-white/85">
              {block.content}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
