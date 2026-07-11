import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CalendarRange, Info } from "lucide-react";
import { formatBps, formatDate, formatYield } from "../lib/format";
import { findCompleteCurveObservationOnOrBefore, maturityKeys } from "../lib/research";
import type { HistoricalRow } from "../types";

interface YieldCurveComparisonProps {
  rows: HistoricalRow[];
  asOfDate: string;
  referenceDate: string;
  onAsOfDateChange: (value: string) => void;
  onReferenceDateChange: (value: string) => void;
}

interface ComparisonTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey?: string; name?: string; value?: number; color?: string }>;
}

function ComparisonTooltip({ active, label, payload }: ComparisonTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip chart-tooltip--wide">
      <span className="chart-tooltip__label">{label}</span>
      <div className="chart-tooltip__rows">
        {payload.map((item) => (
          <div className="chart-tooltip__row" key={item.dataKey}>
            <span>
              <i style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <strong>{typeof item.value === "number" ? formatYield(item.value) : "n/a"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function YieldCurveComparison({
  rows,
  asOfDate,
  referenceDate,
  onAsOfDateChange,
  onReferenceDateChange
}: YieldCurveComparisonProps) {
  const asOfRow = useMemo(
    () => (asOfDate ? findCompleteCurveObservationOnOrBefore(rows, asOfDate) : null),
    [asOfDate, rows]
  );
  const referenceRow = useMemo(
    () => (referenceDate ? findCompleteCurveObservationOnOrBefore(rows, referenceDate) : null),
    [referenceDate, rows]
  );

  const comparisonData = useMemo(() => {
    if (!asOfRow || !referenceRow) return [];

    return maturityKeys.map((key) => ({
      maturity: key,
      asOf: asOfRow[key] as number,
      reference: referenceRow[key] as number,
      changeBps: ((asOfRow[key] as number) - (referenceRow[key] as number)) * 100
    }));
  }, [asOfRow, referenceRow]);

  const canCompare = Boolean(asOfRow && referenceRow && referenceRow.date < asOfRow.date);

  return (
    <article className="panel curve-comparison-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Yield curve comparison</p>
          <h3>Compare Any Two Historical Curves</h3>
        </div>
        <span className="panel__meta">Nearest prior official business-day observation is used</span>
      </div>

      <div className="comparison-controls">
        <CalendarRange size={16} aria-hidden="true" />
        <label>
          <span>As of</span>
          <input type="date" value={asOfDate} min={rows[0]?.date} max={rows.at(-1)?.date} onChange={(event) => onAsOfDateChange(event.target.value)} onInput={(event) => onAsOfDateChange(event.currentTarget.value)} />
        </label>
        <label>
          <span>Reference</span>
          <input
            type="date"
            value={referenceDate}
            min={rows[0]?.date}
            max={asOfDate || rows.at(-1)?.date}
            onChange={(event) => onReferenceDateChange(event.target.value)}
            onInput={(event) => onReferenceDateChange(event.currentTarget.value)}
          />
        </label>
      </div>

      {canCompare ? (
        <>
          <div className="comparison-dates">
            <span>As of observed: <strong>{formatDate(asOfRow?.date)}</strong></span>
            <span>Reference observed: <strong>{formatDate(referenceRow?.date)}</strong></span>
          </div>
          <div className="comparison-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData} margin={{ top: 12, right: 18, bottom: 4, left: -8 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                <XAxis dataKey="maturity" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  domain={["dataMin - 0.2", "dataMax + 0.2"]}
                  tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                />
                <Tooltip content={<ComparisonTooltip />} />
                <Legend verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ color: "var(--muted)" }} />
                <Line
                  type="linear"
                  dataKey="reference"
                  name={formatDate(referenceRow?.date)}
                  stroke="var(--comparison-reference)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 3, strokeWidth: 1, fill: "var(--comparison-reference)" }}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="asOf"
                  name={formatDate(asOfRow?.date)}
                  stroke="var(--comparison-current)"
                  strokeWidth={2.6}
                  dot={{ r: 3.5, strokeWidth: 1, fill: "var(--comparison-current)" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="comparison-delta-grid" aria-label="Yield changes by maturity">
            {comparisonData.map((point) => (
              <div key={point.maturity} className="comparison-delta">
                <span>{point.maturity}</span>
                <strong>{formatBps(point.changeBps)}</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="comparison-empty">
          <Info size={16} aria-hidden="true" />
          <span>
            Select two dates with complete 2Y, 5Y, 10Y, and 30Y observations. The 30Y series is intentionally unavailable during its 2002-06 discontinuation period.
          </span>
        </div>
      )}
    </article>
  );
}
