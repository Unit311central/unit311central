"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { EARTHWORKS_VOLUME_DATA } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function VolumeChart({ compact = false }: { compact?: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader className={cn("space-y-0", compact ? "pb-2" : "pb-4")}>
        <CardTitle className={compact ? "text-sm" : undefined}>Earthworks Volume</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn("w-full min-w-0", compact ? "h-[220px]" : "h-[300px]")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EARTHWORKS_VOLUME_DATA} barSize={compact ? 24 : 32}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickFormatter={(v) => `${v}k`} />
              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    label={String(label ?? "")}
                    suffix="k m³"
                    payload={payload?.map((p) => ({
                      name: "Volume",
                      value: p.value as number,
                      color: "#3b82f6",
                    }))}
                  />
                )}
              />
              <Bar dataKey="volume" name="Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
