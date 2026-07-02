"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { COMPLETION_TREND_DATA } from "@/lib/mock-data";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function CompletionTrendChart() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Completion Trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={COMPLETION_TREND_DATA}>
              <defs>
                <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ChartTooltip suffix="%" />} />
              <Area type="monotone" dataKey="completion" name="Completion" stroke="#3b82f6" strokeWidth={2} fill="url(#completionGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
