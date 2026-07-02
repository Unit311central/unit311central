"use client";

export function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0D1B2A] px-3 py-2.5 shadow-2xl">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/50">{entry.name}</span>
          <span className="ml-auto font-mono text-white/90">
            {entry.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
