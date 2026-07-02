import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROJECT_BRIEF } from "@/lib/mock-data";
import { Building2 } from "lucide-react";

export default function ProjectBrief() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#07111F]">
            <Building2 className="h-4 w-4 text-white/50" />
          </div>
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
            {PROJECT_BRIEF.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <p className="text-sm leading-relaxed text-white/60">{PROJECT_BRIEF.intro}</p>
        <ul className="space-y-2.5">
          {PROJECT_BRIEF.items.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm text-white/50">
              <span className="h-1 w-1 shrink-0 rounded-full bg-blue-500/80" />
              {item}
            </li>
          ))}
        </ul>
        <div className="grid gap-3 pt-1">
          <div className="rounded-xl border border-white/[0.07] bg-[#07111F] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
              Target Completion
            </p>
            <p className="mt-1.5 font-mono text-lg text-white/90">
              {PROJECT_BRIEF.targetCompletion}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-[#07111F] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/35">
              Project Value
            </p>
            <p className="mt-1.5 font-mono text-lg text-white/90">
              {PROJECT_BRIEF.projectValue}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
