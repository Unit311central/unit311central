"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { PROGRESS_VS_PLAN_DATA } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PLANNED_COLOR = "#64748b";
const ACTUAL_COLOR = "#3b82f6";

export default function ProgressChart({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader className={cn("flex-row items-center justify-between space-y-0", compact ? "pb-2" : "pb-4")}>
        <CardTitle className={compact ? "text-sm" : undefined}>Progress vs Plan</CardTitle>
        <div className="flex items-center gap-4 text-[11px] text-white/45">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[#3b82f6]" />
            Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[#64748b]" />
            Planned
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn("w-full min-w-0", compact ? "h-[220px]" : "h-[280px]")}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PROGRESS_VS_PLAN_DATA}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip suffix="%" />} />
              <Line type="monotone" dataKey="planned" name="Planned" stroke={PLANNED_COLOR} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke={ACTUAL_COLOR} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
