import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CalendarRange, Download, Focus, Info, RotateCcw } from "lucide-react";
import { LoadingBlock } from "./LoadingBlock";
import { useHistoricalYields } from "../hooks/useHistoricalYields";
import { formatBps, formatDate, formatShortDate, formatTimestamp, formatYield } from "../lib/format";
import {
  buildCurveMovementAnalysis,
  buildStats,
  curvePairs,
  eventsInRange,
  filterRowsByRange,
  getEventFocusRange,
  getPresetRange,
  maturityKeys,
  rangePresetLabels,
  spreadKeys
} from "../lib/research";
import type { HistoricalRow, ResearchMaturityKey, SpreadKey } from "../types";
import type { CurveMoveType, MacroEvent, RangePreset } from "../lib/research";

const rangePresets: Array<Exclude<RangePreset, "CUSTOM">> = ["1Y", "5Y", "10Y", "20Y", "MAX"];

const yieldColors: Record<ResearchMaturityKey, string> = {
  "3M": "var(--series-3m)",
  "2Y": "var(--series-2y)",
  "5Y": "var(--series-5y)",
  "10Y": "var(--series-10y)",
  "30Y": "var(--series-30y)"
};

const spreadColors: Record<SpreadKey, string> = {
  "5Y2Y": "var(--series-5y)",
  "10Y2Y": "var(--series-2y)",
  "30Y2Y": "var(--series-30y)",
  "10Y5Y": "var(--series-10y)",
  "30Y5Y": "var(--series-30y)",
  "30Y10Y": "var(--series-30y)",
  "10Y3M": "var(--series-10y)"
};

interface MultiTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number | null;
    color?: string;
  }>;
  unit: "yield" | "bps";
}

function MultiTooltip({ active, label, payload, unit }: MultiTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip chart-tooltip--wide">
      <span className="chart-tooltip__label">{formatShortDate(label)}</span>
      <div className="chart-tooltip__rows">
        {payload
          .filter((item) => typeof item.value === "number")
          .map((item) => (
            <div className="chart-tooltip__row" key={item.dataKey}>
              <span>
                <i style={{ backgroundColor: item.color }} />
                {item.name ?? item.dataKey}
              </span>
              <strong>{unit === "yield" ? formatYield(item.value) : formatBps(item.value)}</strong>
            </div>
          ))}
      </div>
    </div>
  );
}

const compactDateTick = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC"
  }).format(value);
};

const formatStat = (
  value: number | null | undefined,
  mode: "yield" | "bps" | "signedBps" | "pct" = "yield"
) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  if (mode === "bps") return `${value.toFixed(1)} bps`;
  if (mode === "signedBps") return formatBps(value);
  if (mode === "pct") return `${value.toFixed(0)}%`;
  return formatYield(value);
};

const eventClass = (event: MacroEvent) => `event-card event-card--${event.category.toLowerCase()}`;

const formatSpreadLevel = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(1)} bps`;
};

const curveMoveTone = (type?: CurveMoveType) => {
  if (!type) return "neutral";
  if (type.includes("steepening")) return "steepening";
  if (type.includes("flattening")) return "flattening";
  if (type.includes("higher")) return "higher";
  return "lower";
};

const curveMoveBadgeClass = (type?: CurveMoveType) => `curve-move-badge curve-move-badge--${curveMoveTone(type)}`;

const csvEscape = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const csvNumber = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isNaN(value) ? "" : value.toFixed(3);

export function ResearchWorkbench() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [shouldLoadHistory, setShouldLoadHistory] = useState(false);
  const { data, error, isLoading } = useHistoricalYields(shouldLoadHistory);
  const [preset, setPreset] = useState<RangePreset>("10Y");
  const [range, setRange] = useState({ start: "", end: "" });
  const [selectedSpread, setSelectedSpread] = useState<SpreadKey>("10Y2Y");

  useEffect(() => {
    if (shouldLoadHistory) return;
    if (!("IntersectionObserver" in window)) {
      setShouldLoadHistory(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadHistory(true);
          observer.disconnect();
        }
      },
      { rootMargin: "700px 0px" }
    );

    const node = sectionRef.current;
    if (node) observer.observe(node);

    return () => observer.disconnect();
  }, [shouldLoadHistory]);

  useEffect(() => {
    if (!data?.rows.length || range.start || range.end) return;
    setRange(getPresetRange("10Y", data.rows));
  }, [data?.rows, range.end, range.start]);

  const selectedRows = useMemo(() => {
    if (!data?.rows.length || !range.start || !range.end) return [];
    return filterRowsByRange(data.rows, range.start, range.end);
  }, [data?.rows, range.end, range.start]);

  const visibleEvents = useMemo(() => {
    if (!range.start || !range.end) return [];
    return eventsInRange(range.start, range.end);
  }, [range.end, range.start]);

  const stats = useMemo(() => buildStats(selectedRows), [selectedRows]);
  const curveMovement = useMemo(() => (data?.rows.length ? buildCurveMovementAnalysis(data.rows) : null), [data?.rows]);

  const selectedSpreadMeta = data?.spreads.find((spread) => spread.key === selectedSpread);

  const setPresetRange = (nextPreset: Exclude<RangePreset, "CUSTOM">) => {
    if (!data?.rows.length) return;
    setPreset(nextPreset);
    setRange(getPresetRange(nextPreset, data.rows));
  };

  const focusEvent = (event: MacroEvent) => {
    if (!data?.rows.length) return;
    setPreset("CUSTOM");
    setRange(getEventFocusRange(event, data.rows));
  };

  const onCustomDateChange = (field: "start" | "end", value: string) => {
    setPreset("CUSTOM");
    setRange((current) => ({ ...current, [field]: value }));
  };

  const downloadSelectedCurveData = () => {
    if (!selectedRows.length) return;

    const headers = ["date", "2Y", "5Y", "10Y", "30Y", ...curvePairs.map((pair) => pair.label)];
    const body = selectedRows.map((row) => [
      row.date,
      csvNumber(row["2Y"]),
      csvNumber(row["5Y"]),
      csvNumber(row["10Y"]),
      csvNumber(row["30Y"]),
      ...curvePairs.map((pair) => csvNumber(row[pair.key]))
    ]);
    const csv = [
      headers.map(csvEscape).join(","),
      ...body.map((cells) => cells.map(csvEscape).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `treasury-curve-${range.start || "start"}-${range.end || "end"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (!shouldLoadHistory || isLoading) {
    return (
      <section className="research-shell" ref={sectionRef}>
        <LoadingBlock className="panel" rows={6} />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="notice" role="alert" ref={sectionRef}>
        <strong>Unable to load long-run historical data.</strong>
        <span>{error instanceof Error ? error.message : "Please retry in a moment."}</span>
      </section>
    );
  }

  const latestRow = data.rows.at(-1);
  const hasSelectedRows = selectedRows.length > 0;
  const dominantWeeklyMove = curveMovement?.dominantWeekly?.weekly;
  const dominantMonthlyMove = curveMovement?.dominantMonthly?.monthly;

  return (
    <section className="research-shell" ref={sectionRef}>
      <div className="research-header">
        <div>
          <p className="eyebrow">Macro research layer</p>
          <h2>Historical Treasury Regime Analysis</h2>
          <p>
            Official H.15 history with Treasury XML supplement for the freshest latest observation. Analyze curve
            behavior across tightening cycles, recessions, crises, and geopolitical shocks.
          </p>
        </div>
        <div className="research-source">
          <span>History: {formatDate(data.source.recordStartDate)} - {formatDate(data.source.recordEndDate)}</span>
          <strong>{data.rows.length.toLocaleString()} daily records</strong>
        </div>
      </div>

      <div className="research-controls">
        <div className="segmented-control" aria-label="Date range presets">
          {rangePresets.map((item) => (
            <button
              className={preset === item ? "segmented-control__button segmented-control__button--active" : "segmented-control__button"}
              type="button"
              key={item}
              aria-pressed={preset === item}
              onClick={() => setPresetRange(item)}
            >
              {rangePresetLabels[item]}
            </button>
          ))}
        </div>
        <div className="date-controls">
          <CalendarRange size={16} aria-hidden="true" />
          <label>
            <span>From</span>
            <input
              type="date"
              value={range.start}
              min={data.source.recordStartDate ?? undefined}
              max={range.end || data.source.recordEndDate || undefined}
              onChange={(event) => onCustomDateChange("start", event.target.value)}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="date"
              value={range.end}
              min={range.start || data.source.recordStartDate || undefined}
              max={data.source.recordEndDate ?? undefined}
              onChange={(event) => onCustomDateChange("end", event.target.value)}
            />
          </label>
          <button className="text-button" type="button" onClick={() => setPresetRange("10Y")}>
            <RotateCcw size={15} aria-hidden="true" />
            Reset
          </button>
          <button className="text-button" type="button" disabled={!selectedRows.length} onClick={downloadSelectedCurveData}>
            <Download size={15} aria-hidden="true" />
            CSV
          </button>
        </div>
      </div>

      {curveMovement ? (
        <article className="panel curve-movement-panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">Curve movement decomposition</p>
              <h3>Steepening, Flattening, and Parallel Shift Analysis</h3>
            </div>
            <span className="panel__meta">
              Latest complete curve {curveMovement.latestDate ? formatDate(curveMovement.latestDate) : "n/a"}
            </span>
          </div>

          <div className="curve-movement-kpis">
            <div className="curve-movement-card">
              <span>Dominant 1W move</span>
              <strong>{curveMovement.dominantWeekly?.pair.label ?? "n/a"}</strong>
              <em className={curveMoveBadgeClass(dominantWeeklyMove?.type)}>{dominantWeeklyMove?.type ?? "n/a"}</em>
              <small>
                {dominantWeeklyMove ? `${formatBps(dominantWeeklyMove.spreadDeltaBps)} vs ${formatShortDate(dominantWeeklyMove.comparisonDate)}` : "Insufficient data"}
              </small>
            </div>
            <div className="curve-movement-card">
              <span>Dominant 1M move</span>
              <strong>{curveMovement.dominantMonthly?.pair.label ?? "n/a"}</strong>
              <em className={curveMoveBadgeClass(dominantMonthlyMove?.type)}>{dominantMonthlyMove?.type ?? "n/a"}</em>
              <small>
                {dominantMonthlyMove ? `${formatBps(dominantMonthlyMove.spreadDeltaBps)} vs ${formatShortDate(dominantMonthlyMove.comparisonDate)}` : "Insufficient data"}
              </small>
            </div>
            <div className="curve-movement-card curve-movement-card--scenario">
              <span>{curveMovement.yearEndScenario.confidence} confidence scenario</span>
              <strong>{curveMovement.yearEndScenario.title}</strong>
              <small>{curveMovement.yearEndScenario.description}</small>
            </div>
          </div>

          <div className="curve-movement-table-wrap">
            <table className="curve-movement-table">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Current spread</th>
                  <th>1W spread Δ</th>
                  <th>1W type</th>
                  <th>1M spread Δ</th>
                  <th>1M type</th>
                  <th>Economic read</th>
                </tr>
              </thead>
              <tbody>
                {curveMovement.pairs.map((row) => (
                  <tr key={row.pair.key}>
                    <th>{row.pair.label}</th>
                    <td>{formatSpreadLevel(row.currentSpreadBps)}</td>
                    <td>{formatBps(row.weekly?.spreadDeltaBps)}</td>
                    <td>
                      <span className={curveMoveBadgeClass(row.weekly?.type)}>{row.weekly?.type ?? "n/a"}</span>
                    </td>
                    <td>{formatBps(row.monthly?.spreadDeltaBps)}</td>
                    <td>
                      <span className={curveMoveBadgeClass(row.monthly?.type)}>{row.monthly?.type ?? "n/a"}</span>
                    </td>
                    <td>{row.monthly?.rationale ?? row.weekly?.rationale ?? "Insufficient observations for this segment."}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="source-footnote source-footnote--inline">
            <span>Six curve segments use all pair combinations from 2Y, 5Y, 10Y, and 30Y Treasury yields.</span>
            <span>{curveMovement.yearEndScenario.caveat}</span>
          </div>
        </article>
      ) : null}

      {hasSelectedRows ? (
        <div className="research-grid">
          <article className="panel research-chart-panel research-chart-panel--wide">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Yields</p>
                <h3>Nominal Constant Maturity Yields</h3>
              </div>
              <span className="panel__meta">{selectedRows.length.toLocaleString()} selected observations</span>
            </div>
            <div className="research-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedRows} margin={{ top: 12, right: 18, bottom: 6, left: -6 }}>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                  <XAxis
                    dataKey="date"
                    minTickGap={42}
                    tickFormatter={compactDateTick}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={50}
                    domain={["dataMin - 0.35", "dataMax + 0.35"]}
                    tickFormatter={(value) => `${Number(value).toFixed(1)}%`}
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                  />
                  <Tooltip content={<MultiTooltip unit="yield" />} />
                  <Legend verticalAlign="top" align="right" iconType="plainline" wrapperStyle={{ color: "var(--muted)" }} />
                  {visibleEvents.map((event) => (
                    <ReferenceLine
                      key={event.id}
                      x={event.startDate}
                      stroke="var(--event-line)"
                      strokeDasharray="4 6"
                      ifOverflow="extendDomain"
                    />
                  ))}
                  {maturityKeys.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={key}
                      connectNulls={false}
                      dot={false}
                      stroke={yieldColors[key]}
                      strokeWidth={key === "10Y" ? 2.4 : 1.8}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="panel research-chart-panel">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Curve measures</p>
                <h3>{selectedSpreadMeta?.longLabel ?? selectedSpread}</h3>
              </div>
            </div>
            <div className="spread-selector" aria-label="Spread selector">
              {spreadKeys.map((key) => {
                const spread = data.spreads.find((item) => item.key === key);
                return (
                  <button
                    className={selectedSpread === key ? "spread-selector__button spread-selector__button--active" : "spread-selector__button"}
                    type="button"
                    key={key}
                    aria-pressed={selectedSpread === key}
                    onClick={() => setSelectedSpread(key)}
                  >
                    {spread?.label ?? key}
                  </button>
                );
              })}
            </div>
            <div className="spread-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedRows} margin={{ top: 10, right: 14, bottom: 4, left: -10 }}>
                  <defs>
                    <linearGradient id="spread-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={spreadColors[selectedSpread]} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={spreadColors[selectedSpread]} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 6" />
                  <XAxis
                    dataKey="date"
                    minTickGap={32}
                    tickFormatter={compactDateTick}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(value) => `${Number(value).toFixed(0)}`}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                  />
                  <Tooltip content={<MultiTooltip unit="bps" />} />
                  <ReferenceLine y={0} stroke="var(--zero-line)" strokeDasharray="4 5" />
                  <Area
                    type="monotone"
                    dataKey={selectedSpread}
                    name={selectedSpreadMeta?.label ?? selectedSpread}
                    stroke={spreadColors[selectedSpread]}
                    strokeWidth={2}
                    fill="url(#spread-gradient)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="spread-note">
              <Info size={15} aria-hidden="true" />
              <span>
                Spreads are shown in basis points. Values below zero indicate inversion for that curve segment.
                Historical charts use business-day observations; weekends and market holidays are omitted.
              </span>
            </div>
          </article>
        </div>
      ) : (
        <div className="empty-state empty-state--research">
          No valid Treasury observations are available inside the selected date window.
        </div>
      )}

      <div className="event-section">
        <div className="section-header section-header--compact">
          <div>
            <p className="eyebrow">Event study</p>
            <h2>Macro Event Markers</h2>
          </div>
          <span>{visibleEvents.length} events in selected window</span>
        </div>
        <div className="event-rail">
          {visibleEvents.length ? (
            visibleEvents.map((event) => (
              <button className={eventClass(event)} type="button" key={event.id} onClick={() => focusEvent(event)}>
                <span>{event.category}</span>
                <strong>{event.title}</strong>
                <small>
                  {formatDate(event.startDate)}
                  {event.endDate ? ` - ${formatDate(event.endDate)}` : ""}
                </small>
                <em>{event.description}</em>
                <i>
                  <Focus size={14} aria-hidden="true" />
                  Focus window
                </i>
              </button>
            ))
          ) : (
            <div className="empty-state">No configured event markers fall inside the selected range.</div>
          )}
        </div>
      </div>

      <article className="panel stats-panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">Selected-period analytics</p>
            <h3>Yield Statistics and Momentum</h3>
          </div>
          <span className="panel__meta">
            Latest row {latestRow ? formatDate(latestRow.date) : "n/a"} · Retrieved {formatTimestamp(data.source.retrievedAt)}
          </span>
        </div>
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Maturity</th>
                <th>Latest</th>
                <th>Min</th>
                <th>Max</th>
                <th>Average</th>
                <th>Ann. vol</th>
                <th>1M Δ</th>
                <th>3M Δ</th>
                <th>1Y Δ</th>
                <th>Percentile</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) => (
                <tr key={row.key}>
                  <th>{row.key}</th>
                  <td>{formatStat(row.latest)}</td>
                  <td>{formatStat(row.min)}</td>
                  <td>{formatStat(row.max)}</td>
                  <td>{formatStat(row.average)}</td>
                  <td>{formatStat(row.annualizedVolBps, "bps")}</td>
                  <td>{formatStat(row.oneMonthChangeBps, "signedBps")}</td>
                  <td>{formatStat(row.threeMonthChangeBps, "signedBps")}</td>
                  <td>{formatStat(row.oneYearChangeBps, "signedBps")}</td>
                  <td>{formatStat(row.percentile, "pct")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="source-footnote">
          <span>{data.source.name}</span>
          <span>{data.source.supplementalSource}</span>
          <span>{data.source.note}</span>
          <span>Historical charts are observation-based: weekends and federal market holidays are not imputed.</span>
        </div>
      </article>
    </section>
  );
}
