import { Button } from "@/components/ui/button";
import { REPORTS } from "@/lib/mock-data";
import { Download, Eye, FileText } from "lucide-react";
import SectionHeader from "./SectionHeader";

export default function ReportsSection() {
  return (
    <section className="space-y-5">
      <SectionHeader
        title="Reports"
        description="Intelligence deliverables for project stakeholders"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
        {REPORTS.map((report) => (
          <div
            key={report.title}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0D1B2A] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.25)] transition-colors hover:border-white/[0.12]"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.08]">
                <FileText className="h-5 w-5 text-red-400/80" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-white/90">{report.title}</h3>
                <p className="mt-1 text-xs text-white/40">
                  Generated {report.generatedAgo}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" className="h-8 rounded-xl text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    View Report
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
