"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { SCHEDULE_PERFORMANCE_DATA } from "@/lib/mock-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function SchedulePerformanceChart() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Schedule Performance</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={SCHEDULE_PERFORMANCE_DATA} barGap={4}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="milestone" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip suffix="%" />} />
              <Bar dataKey="planned" name="Planned" fill="#475569" radius={[3, 3, 0, 0]} opacity={0.7} />
              <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
