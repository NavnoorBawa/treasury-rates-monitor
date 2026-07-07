import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatRange, formatShortDate, formatYield } from "../lib/format";
import type { DashboardMaturityKey, HistoryPoint, SummaryPoint } from "../types";

interface HistoricalChartProps {
  maturityKey: DashboardMaturityKey;
  summary: SummaryPoint;
  data: HistoryPoint[];
}

const colorVarByKey: Record<DashboardMaturityKey, string> = {
  "2Y": "var(--series-2y)",
  "5Y": "var(--series-5y)",
  "10Y": "var(--series-10y)",
  "30Y": "var(--series-30y)"
};

export function HistoricalChart({ maturityKey, summary, data }: HistoricalChartProps) {
  const values = data.map((point) => point.value);
  const gradientId = `history-gradient-${maturityKey.toLowerCase()}`;
  const color = colorVarByKey[maturityKey];

  return (
    <article className="history-card">
      <div className="history-card__header">
        <div>
          <p className="eyebrow">{summary.shortLabel} history</p>
          <h3>{summary.label} Treasury</h3>
        </div>
        <strong>{formatYield(summary.value)}</strong>
      </div>
      <div className="history-card__range">
        <span>1Y range</span>
        <span>{formatRange(values)}</span>
      </div>
      <div className="history-card__chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              minTickGap={26}
              tickFormatter={formatShortDate}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={["dataMin - 0.1", "dataMax + 0.1"]}
              tickFormatter={(value) => Number(value).toFixed(1)}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--chart-crosshair)" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)", fill: color }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

