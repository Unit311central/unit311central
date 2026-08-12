export const STACK_TABLE_GRID_COLS =
  "grid-cols-[minmax(0,44%)_minmax(0,28%)_minmax(0,28%)]";

export function HomeBusinessCaseToolStackBar({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className={`grid ${STACK_TABLE_GRID_COLS} items-center`}>
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/55 sm:text-[13px] lg:text-sm">
          Typical tool stack
        </span>
        <span aria-hidden />
        <span className="text-center text-xs font-semibold tabular-nums tracking-wide text-white/80 sm:text-[13px] lg:text-sm">
          $45,788/yr
        </span>
      </div>
      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400/80 via-orange-400/70 to-red-400/60" />
      </div>
    </div>
  );
}
