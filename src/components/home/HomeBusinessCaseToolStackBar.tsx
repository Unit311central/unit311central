export function HomeBusinessCaseToolStackBar({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 sm:text-[11px]">
        <span>Typical tool stack</span>
        <span className="text-white/70">$45,788/yr</span>
      </div>
      <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400/80 via-orange-400/70 to-red-400/60" />
      </div>
    </div>
  );
}
