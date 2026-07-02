export default function DashboardMockup() {
  return (
    <div className="w-full overflow-hidden rounded-md border border-white/10 bg-[#0c1424] shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
      <div className="flex">
        <div className="w-[110px] shrink-0 border-r border-white/10 bg-[#080f1c] px-2.5 py-3">
          <p className="text-[8px] font-semibold text-white/85">Project Alpha</p>
          <ul className="mt-3 space-y-3">
            {["Dashboard", "Reports", "Imagery", "Analytics"].map((item, i) => (
              <li key={item} className="flex items-center gap-1.5">
                <span
                  className={`h-[10px] w-[10px] rounded-sm border ${
                    i === 0 ? "border-[#3b82f6] bg-[#3b82f6]/30" : "border-white/20"
                  }`}
                  aria-hidden
                />
                <span className={`text-[7px] ${i === 0 ? "text-[#3b82f6]" : "text-white/40"}`}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 flex-1 p-2.5">
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Projects", value: "24" },
              { label: "Surveys", value: "156" },
              { label: "Reports", value: "89" },
              { label: "Issues", value: "12" },
            ].map((s) => (
              <div key={s.label} className="rounded border border-white/8 bg-white/[0.04] px-2 py-1.5">
                <p className="text-[7px] text-white/40">{s.label}</p>
                <p className="text-[13px] font-semibold leading-tight text-white">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <div className="rounded border border-white/8 bg-white/[0.04] p-2">
              <p className="text-[7px] text-white/40">Progress Overview</p>
              <svg viewBox="0 0 120 36" className="mt-1 h-9 w-full" aria-hidden>
                <polyline
                  points="0,28 20,22 40,26 60,14 80,18 100,8 120,12"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div className="rounded border border-white/8 bg-white/[0.04] p-2">
              <p className="text-[7px] text-white/40">Site Overview</p>
              <div className="mt-1 h-9 rounded-sm bg-gradient-to-br from-emerald-900/50 via-slate-700/40 to-slate-800/60" />
            </div>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            <div className="rounded border border-white/8 bg-white/[0.04] p-2">
              <p className="text-[7px] text-white/40">Volume Change</p>
              <svg viewBox="0 0 60 28" className="mt-0.5 h-7 w-full" aria-hidden>
                <rect x="4" y="18" width="8" height="10" fill="#3b82f6" opacity="0.7" />
                <rect x="16" y="12" width="8" height="16" fill="#3b82f6" opacity="0.7" />
                <rect x="28" y="8" width="8" height="20" fill="#3b82f6" opacity="0.7" />
                <rect x="40" y="14" width="8" height="14" fill="#3b82f6" opacity="0.7" />
              </svg>
            </div>
            <div className="rounded border border-white/8 bg-white/[0.04] p-2">
              <p className="text-[7px] text-white/40">Recent Reports</p>
              <p className="mt-1 text-[8px] text-white/65">Quarry Survey Q1</p>
              <p className="text-[8px] text-white/45">Solar Inspection</p>
            </div>
            <div className="rounded border border-white/8 bg-white/[0.04] p-2">
              <p className="text-[7px] text-white/40">Active Issues</p>
              <p className="mt-1 text-[8px] text-amber-400/90">3 flagged areas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
