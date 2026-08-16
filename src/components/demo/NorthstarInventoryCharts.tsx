"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatNorthstarGbp,
  getNorthstarInventoryCharts,
} from "@/lib/demo/northstar-operations-data";

const chartTooltipStyle = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const MIX_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa"];

export default function NorthstarInventoryCharts() {
  const charts = getNorthstarInventoryCharts();

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Status mix</h2>
        <p className="mt-1 text-xs text-white/45">Operational vs maintenance</p>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={charts.statusMix}
                dataKey="value"
                nameKey="name"
                innerRadius={42}
                outerRadius={68}
                paddingAngle={2}
              >
                {charts.statusMix.map((_, index) => (
                  <Cell key={index} fill={MIX_COLORS[index % MIX_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Value by location</h2>
        <p className="mt-1 text-xs text-white/45">On-hand value (GBP)</p>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={charts.valueByLocation}
              layout="vertical"
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="location"
                width={72}
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value: number) => formatNorthstarGbp(value)}
              />
              <Bar dataKey="value" fill="#34d399" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-white">Stock movement</h2>
        <p className="mt-1 text-xs text-white/45">Inbound vs outbound (6 mo)</p>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={charts.stockMovement} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }} />
              <Bar dataKey="inbound" name="Inbound" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outbound" name="Outbound" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
