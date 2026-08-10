export const STACK_TABLE_GRID_COLS =
  "grid-cols-[minmax(0,54%)_minmax(0,14%)_minmax(0,32%)]";

export function HomeBusinessCaseToolStackBar({ className = "" }: { className?: string }) {
  return (
    <div className={`grid ${STACK_TABLE_GRID_COLS} items-center ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 sm:text-[11px]">
        Typical tool stack
      </span>
      <span className="text-center text-[10px] font-semibold tabular-nums tracking-wide text-white/70 sm:text-[11px]">
        $45,788/yr
      </span>
      <span aria-hidden />
    </div>
  );
}
